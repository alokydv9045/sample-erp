'use strict';

const prisma = require('../config/database');

// ─────────────────────────────────────────────────────────────
// Settings helpers
// ─────────────────────────────────────────────────────────────

/**
 * Return the single notification settings row, creating defaults if missing.
 */
async function getSettings() {
  let settings = await prisma.notificationSettings.findFirst();
  if (!settings) {
    settings = await prisma.notificationSettings.create({ data: {} });
  }
  return settings;
}

/**
 * Upsert notification settings. Only fields present in `data` are changed.
 * @param {object} data
 * @param {string} updatedBy  userId of the admin making the change
 */
async function updateSettings(data, updatedBy) {
  const existing = await prisma.notificationSettings.findFirst();

  const payload = {
    updatedBy,
    ...(data.attendanceNotificationTime !== undefined && { attendanceNotificationTime: data.attendanceNotificationTime }),
    ...(data.attendanceNotifEnabled     !== undefined && { attendanceNotifEnabled:     data.attendanceNotifEnabled }),
    ...(data.homeworkNotifEnabled       !== undefined && { homeworkNotifEnabled:       data.homeworkNotifEnabled }),
    ...(data.feeReminderEnabled         !== undefined && { feeReminderEnabled:         data.feeReminderEnabled }),
    ...(data.announcementEnabled        !== undefined && { announcementEnabled:        data.announcementEnabled }),
  };

  if (existing) {
    return prisma.notificationSettings.update({ where: { id: existing.id }, data: payload });
  }
  return prisma.notificationSettings.create({ data: { ...payload } });
}

// ─────────────────────────────────────────────────────────────
// Feature flag check
// ─────────────────────────────────────────────────────────────

/**
 * Returns true if the given notification type is enabled in settings.
 * @param {'ATTENDANCE'|'HOMEWORK'|'FEE_REMINDER'|'ANNOUNCEMENT'} type
 */
async function isFeatureEnabled(type) {
  const settings = await getSettings();
  const map = {
    ATTENDANCE:   settings.attendanceNotifEnabled,
    HOMEWORK:     settings.homeworkNotifEnabled,
    FEE_REMINDER: settings.feeReminderEnabled,
    ANNOUNCEMENT: settings.announcementEnabled,
  };
  return !!map[type];
}

// ─────────────────────────────────────────────────────────────
// Phone resolution – only uses registered parent phones
// ─────────────────────────────────────────────────────────────

/**
 * Resolves parent phone numbers for a given student from the Parent model.
 * Returns an array of valid phone strings (empty if none found).
 * @param {string} studentId
 * @returns {Promise<string[]>}
 */
async function resolveParentPhones(studentId) {
  const studentParents = await prisma.studentParent.findMany({
    where: { studentId },
    include: { parent: { select: { phone: true } } },
  });

  const phones = studentParents
    .map((sp) => sp.parent?.phone)
    .filter((p) => p && p.trim().length > 0);

  // Deduplicate
  return [...new Set(phones)];
}

// ─────────────────────────────────────────────────────────────
// Template rendering
// ─────────────────────────────────────────────────────────────

/**
 * Replaces {variable} placeholders in a template body.
 * @param {string} templateBody
 * @param {Record<string, string>} variables
 * @returns {string}
 */
function renderTemplate(templateBody, variables) {
  let message = templateBody;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value ?? '');
  }
  return message;
}

// ─────────────────────────────────────────────────────────────
// Enqueue helpers
// ─────────────────────────────────────────────────────────────

/**
 * Enqueue attendance notification for a student.
 * SAFE TO CALL without await — will not throw upward.
 *
 * @param {string}   studentId
 * @param {{status:string, date:Date}} attendanceRecord
 */
async function enqueueAttendanceNotif(studentId, attendanceRecord) {
  try {
    const enabled = await isFeatureEnabled('ATTENDANCE');
    if (!enabled) return;

    const phones = await resolveParentPhones(studentId);
    if (phones.length === 0) return; // No registered phone → no message

    // Fetch student name + class
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        currentClass: { select: { name: true } },
        section: { select: { name: true } },
      },
    });

    if (!student) return;

    // Try to use an existing ATTENDANCE template
    const template = await prisma.notificationTemplate.findFirst({
      where: { templateType: 'ATTENDANCE', isActive: true },
    });

    const vars = {
      student_name: `${student.user.firstName} ${student.user.lastName}`,
      class: student.currentClass?.name ?? 'N/A',
      section: student.section?.name ?? '',
      status: attendanceRecord.status,
      date: new Date(attendanceRecord.date).toLocaleDateString('en-IN'),
    };

    const messageBody = template
      ? renderTemplate(template.messageBody, vars)
      : `Hello Parent,\n\nYour child ${vars.student_name} (${vars.class} ${vars.section}) attendance status on ${vars.date}: *${vars.status}*.\n\n– School ERP`;

    // Get scheduled send time from settings
    const settings = await getSettings();
    const [hh, mm] = settings.attendanceNotificationTime.split(':').map(Number);
    const scheduledAt = new Date(attendanceRecord.date);
    scheduledAt.setHours(hh, mm, 0, 0);

    // If scheduled time already passed today, send at next occurrence (next day same time is not standard —
    // we just set now + 1 min so queue worker picks it up soon)
    if (scheduledAt < new Date()) {
      scheduledAt.setTime(Date.now() + 60 * 1000);
    }

    // Create queue rows for each parent phone
    const rows = phones.map((phone) => ({
      recipientType: 'STUDENT_PARENT',
      recipientId: studentId,
      phoneNumber: phone,
      message: messageBody,
      notifType: 'ATTENDANCE',
      templateId: template?.id ?? null,
      scheduledAt,
    }));

    await prisma.notificationQueue.createMany({ data: rows });
  } catch (err) {
    console.error('[NotificationService] enqueueAttendanceNotif error:', err.message);
  }
}

/**
 * Enqueue a bulk notification to multiple recipients.
 *
 * @param {{ target: string, classId?: string, sectionId?: string, studentId?: string }} recipient
 * @param {string}   message       Already-rendered message body
 * @param {string}   notifType     NotifTemplateType enum value
 * @param {Date}     scheduledAt
 */
async function enqueueBulkNotif(recipient, message, notifType, scheduledAt) {
  const rows = [];

  if (recipient.target === 'ALL_STUDENTS') {
    const students = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    for (const s of students) {
      const phones = await resolveParentPhones(s.id);
      for (const phone of phones) {
        rows.push({ recipientType: 'STUDENT_PARENT', recipientId: s.id, phoneNumber: phone, message, notifType, scheduledAt });
      }
    }
  } else if (recipient.target === 'CLASS' && recipient.classId) {
    const students = await prisma.student.findMany({
      where: { currentClassId: recipient.classId, status: 'ACTIVE' },
      select: { id: true },
    });
    for (const s of students) {
      const phones = await resolveParentPhones(s.id);
      for (const phone of phones) {
        rows.push({ recipientType: 'STUDENT_PARENT', recipientId: s.id, phoneNumber: phone, message, notifType, scheduledAt });
      }
    }
  } else if (recipient.target === 'SECTION' && recipient.sectionId) {
    const students = await prisma.student.findMany({
      where: { sectionId: recipient.sectionId, status: 'ACTIVE' },
      select: { id: true },
    });
    for (const s of students) {
      const phones = await resolveParentPhones(s.id);
      for (const phone of phones) {
        rows.push({ recipientType: 'STUDENT_PARENT', recipientId: s.id, phoneNumber: phone, message, notifType, scheduledAt });
      }
    }
  } else if (recipient.target === 'INDIVIDUAL' && recipient.studentId) {
    const phones = await resolveParentPhones(recipient.studentId);
    for (const phone of phones) {
      rows.push({ recipientType: 'STUDENT_PARENT', recipientId: recipient.studentId, phoneNumber: phone, message, notifType, scheduledAt });
    }
  }

  if (rows.length > 0) {
    await prisma.notificationQueue.createMany({ data: rows });
  }

  return rows.length;
}

// ─────────────────────────────────────────────────────────────
// Dashboard stats
// ─────────────────────────────────────────────────────────────

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [sentToday, scheduledCount, pendingCount, failedCount, monthlyCount] = await Promise.all([
    prisma.notificationLog.count({ where: { sentAt: { gte: today, lt: tomorrow } } }),
    prisma.notificationQueue.count({ where: { status: 'PENDING', scheduledAt: { gt: new Date() } } }),
    prisma.notificationQueue.count({ where: { status: 'PENDING', scheduledAt: { lte: new Date() } } }),
    prisma.notificationQueue.count({ where: { status: 'FAILED' } }),
    prisma.notificationLog.count({ where: { sentAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } } }),
  ]);

  return { sentToday, scheduledCount, pendingCount, failedCount, monthlyCount };
}

module.exports = {
  getSettings,
  updateSettings,
  isFeatureEnabled,
  resolveParentPhones,
  renderTemplate,
  enqueueAttendanceNotif,
  enqueueBulkNotif,
  getDashboardStats,
};
