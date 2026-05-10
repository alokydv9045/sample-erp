'use strict';

/**
 * Notification Scheduler — runs a cron job every minute to flush
 * due notification rows from NotificationQueue.
 *
 * Uses node-cron. Gracefully skips if not installed.
 */

const { processScheduledQueue } = require('./notificationQueue');

let cron;
try {
  cron = require('node-cron');
} catch {
  console.warn('[NotificationScheduler] node-cron not installed. Run: npm install node-cron');
}

let schedulerTask = null;

/**
 * Start the notification scheduler.
 * Runs every minute and processes any notifications whose scheduledAt ≤ now().
 */
function startScheduler() {
  if (!cron) {
    console.warn('[NotificationScheduler] Scheduler not started — node-cron unavailable.');
    return;
  }

  if (schedulerTask) {
    console.warn('[NotificationScheduler] Scheduler already running.');
    return;
  }

  // Run every minute
  schedulerTask = cron.schedule('* * * * *', async () => {
    try {
      await processScheduledQueue();
    } catch (err) {
      console.error('[NotificationScheduler] Error during queue processing:', err.message);
    }
  });

  console.log('[NotificationScheduler] Cron scheduler started (runs every minute)');
}

/**
 * Stop the scheduler (for graceful shutdown).
 */
function stopScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('[NotificationScheduler] Scheduler stopped');
  }
}

module.exports = { startScheduler, stopScheduler };
