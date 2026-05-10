'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

const ADMIN = ['SUPER_ADMIN', 'ADMIN'];
const ALL = ['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'];

// All routes require authentication
router.use(authMiddleware);

// ── In-app notifications (header bell) ───────────────────────
router.get('/', ctrl.getNotifications);
router.put('/:id/read', ctrl.markAsRead);
router.put('/mark-all-read', ctrl.markAllRead);

// ── Settings ─────────────────────────────────────────────────
router.get('/settings', requireRole(...ALL), ctrl.getSettings);
router.put('/settings', requireRole(...ADMIN), ctrl.updateSettings);

// ── Templates ────────────────────────────────────────────────
router.get('/templates', requireRole(...ALL), ctrl.getTemplates);
router.post('/templates', requireRole(...ALL), ctrl.createTemplate);
router.put('/templates/:id', requireRole(...ALL), ctrl.updateTemplate);
router.delete('/templates/:id', requireRole(...ADMIN), ctrl.deleteTemplate);

// ── Messaging ────────────────────────────────────────────────
router.post('/bulk-send', requireRole(...ALL), ctrl.bulkSend);
router.post('/retry', requireRole(...ADMIN), ctrl.retryFailed);

// ── Queue & Logs ─────────────────────────────────────────────
router.get('/queue', requireRole(...ALL), ctrl.getQueue);
router.get('/logs', requireRole(...ALL), ctrl.getLogs);

// ── Dashboard stats ──────────────────────────────────────────
router.get('/dashboard', requireRole(...ALL), ctrl.getDashboard);

module.exports = router;
