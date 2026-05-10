'use strict';

/**
 * Notification Queue Worker — uses BullMQ + existing Redis connection.
 *
 * HOW IT WORKS:
 *  1. notificationService.enqueueAttendanceNotif / enqueueBulkNotif inserts rows
 *     into the NotificationQueue Prisma table.
 *  2. notificationScheduler calls processScheduledQueue() at the configured time.
 *  3. processScheduledQueue() picks up PENDING rows whose scheduledAt ≤ now
 *     and adds them as BullMQ jobs.
 *  4. The BullMQ worker (startQueueWorker) processes each job, calls WhatsApp
 *     gateway, then writes to NotificationLog.
 *
 * GRACEFUL DEGRADATION:
 *  If Redis / BullMQ is not available (REDIS_URL not set, package not installed),
 *  the module falls back to a direct-send mode that still works.
 */

const prisma = require('../config/database');
const { sendWhatsApp } = require('./whatsappGateway');
const { sendSMS }      = require('./smsGateway');

// ─────────────────────────────────────────────────────────────
// Try to load BullMQ — graceful fallback if not installed yet
// ─────────────────────────────────────────────────────────────
let Queue, Worker, Redis;
try {
  ({ Queue, Worker } = require('bullmq'));
  Redis = require('ioredis');
} catch {
  console.warn('[NotificationQueue] BullMQ not installed. Run: npm install bullmq');
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let notifQueue = null;
let queueWorker = null;

// ─────────────────────────────────────────────────────────────
// Initialise queue + worker
// ─────────────────────────────────────────────────────────────

async function startQueueWorker() {
  if (!Queue || !Worker || !Redis) {
    console.warn('[NotificationQueue] BullMQ unavailable — using direct processing fallback.');
    return;
  }

  const redisUrl = REDIS_URL;

  // Pre-flight check: Test if Redis is up without crashing the app
  const testClient = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy: () => null // don't retry, fail fast
  });

  testClient.on('error', () => {
    // Suppress connection errors on test client
  });

  try {
    await testClient.connect();
    testClient.disconnect();
  } catch (err) {
    console.warn(
      '[NotificationQueue] Redis unavailable (ECONNREFUSED). ' +
      'Falling back to direct DB processing. Start Redis to enable BullMQ.'
    );
    return; // Don't start BullMQ, rely on direct fallback
  }

  try {
    const connection = {
      url: redisUrl,
      // BullMQ retries aggressively by default — limit it so we don't flood logs
      maxRetriesPerRequest: null,
    };

    notifQueue = new Queue('whatsapp-notifications', { connection });

    queueWorker = new Worker(
      'whatsapp-notifications',
      async (job) => {
        const { queueRowId } = job.data;
        await processOneQueueRow(queueRowId);
      },
      { connection, concurrency: 5 }
    );

    const handleRedisError = (err) => {
      console.error('[NotificationQueue] Redis error:', err.message);
    };

    notifQueue.on('error', handleRedisError);
    queueWorker.on('error', handleRedisError);

    queueWorker.on('completed', (job) => {
      console.log(`[NotificationQueue] Job ${job.id} completed`);
    });

    queueWorker.on('failed', (job, err) => {
      console.error(`[NotificationQueue] Job ${job?.id} failed:`, err.message);
    });

    console.log('[NotificationQueue] BullMQ worker started');
  } catch (err) {
    console.error('[NotificationQueue] Failed to start BullMQ worker:', err.message);
    notifQueue = null;
    queueWorker = null;
  }
}

// ─────────────────────────────────────────────────────────────
// Core processor — can be called directly (fallback) or by BullMQ
// ─────────────────────────────────────────────────────────────

async function processOneQueueRow(queueRowId) {
  const row = await prisma.notificationQueue.findUnique({ where: { id: queueRowId } });
  if (!row || row.status !== 'PENDING') return;

  // Mark as in-progress
  await prisma.notificationQueue.update({
    where: { id: queueRowId },
    data: { status: 'PROCESSING' },
  });

  const [waResult, smsResult] = await Promise.all([
    sendWhatsApp(row.phoneNumber, row.message),
    sendSMS(row.phoneNumber, row.message),
  ]);

  const success = waResult.success || smsResult.success;
  const providerResponse = {
    whatsapp: waResult.providerResponse,
    sms: smsResult.providerResponse
  };

  if (success) {
    await Promise.all([
      prisma.notificationQueue.update({
        where: { id: queueRowId },
        data: { status: 'SENT', sentAt: new Date() },
      }),
      prisma.notificationLog.create({
        data: {
          recipientId: row.recipientId,
          phoneNumber: row.phoneNumber,
          message: row.message,
          deliveryStatus: 'sent',
          notifType: row.notifType,
          providerResponse: JSON.stringify(providerResponse),
        },
      }),
    ]);
  } else {
    await Promise.all([
      prisma.notificationQueue.update({
        where: { id: queueRowId },
        data: {
          status: 'FAILED',
          failureReason: JSON.stringify(providerResponse).slice(0, 500),
        },
      }),
      prisma.notificationLog.create({
        data: {
          recipientId: row.recipientId,
          phoneNumber: row.phoneNumber,
          message: row.message,
          deliveryStatus: 'failed',
          notifType: row.notifType,
          providerResponse: JSON.stringify(providerResponse),
        },
      }),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────
// Scheduler calls this to flush due rows
// ─────────────────────────────────────────────────────────────

async function processScheduledQueue() {
  const dueRows = await prisma.notificationQueue.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: new Date() },
    },
    take: 500, // process at most 500 at a time
  });

  if (dueRows.length === 0) return;
  console.log(`[NotificationQueue] Processing ${dueRows.length} due notification(s)`);

  for (const row of dueRows) {
    if (notifQueue) {
      // BullMQ available — hand off to worker
      await notifQueue.add('send', { queueRowId: row.id }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    } else {
      // Fallback: direct send (synchronous, no retry)
      await processOneQueueRow(row.id).catch((e) =>
        console.error('[NotificationQueue] Direct send error:', e.message)
      );
    }
  }
}

module.exports = { startQueueWorker, processScheduledQueue };
