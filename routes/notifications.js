import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { notificationsWriteLimiter, listNotifications, getNotification, createNotification, updateNotification, deleteNotification, markNotificationSent } from '../controllers/notificationsController.js';

const router = express.Router();

// Rate limiter provided by controller

// GET /api/notifications - Get notifications for the authenticated user
router.get('/', authenticate, listNotifications);

// GET /api/notifications/:id - Get notification by ID (owner only)
router.get('/:id', authenticate, getNotification);

// POST /api/notifications - Create new notification (owner-only creation)
router.post('/', authenticate, notificationsWriteLimiter, createNotification);

// PUT /api/notifications/:id - Update notification (owner only)
router.put('/:id', authenticate, notificationsWriteLimiter, updateNotification);

// DELETE /api/notifications/:id - Delete notification (owner only)
router.delete('/:id', authenticate, notificationsWriteLimiter, deleteNotification);

// POST /api/notifications/:id/mark-sent - Mark notification as sent (owner only)
router.post('/:id/mark-sent', authenticate, notificationsWriteLimiter, markNotificationSent);

export default router;
