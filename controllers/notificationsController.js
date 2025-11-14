import rateLimit from 'express-rate-limit';
import Notification from '../models/Notification.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

export const notificationsWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

export async function listNotifications(req, res) {
  try {
    const { kind, sent } = req.query;
    const { limit, page, skip } = parsePagination(req.query);
    const filter = { userId: req.user._id };
    if (kind) filter.kind = kind;
    if (sent === 'true') filter.sentAt = { $exists: true, $ne: null };
    else if (sent === 'false') filter.sentAt = { $exists: false };

    const notifications = await Notification.find(filter)
      .populate('userId', 'profile.fullName')
      .select('-__v')
      .limit(limit)
      .skip(skip)
      .sort({ scheduledFor: -1, createdAt: -1 });

    const total = await Notification.countDocuments(filter);
    res.json({ notifications, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getNotification(req, res) {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('userId', 'profile.fullName')
      .select('-__v');
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    if (notification.userId && notification.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createNotification(req, res) {
  try {
    const notification = new Notification({ ...req.body, userId: req.user._id });
    await notification.save();
    const populated = await Notification.findById(notification._id).populate('userId', 'profile.fullName');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateNotification(req, res) {
  try {
    const { sentAt, ...updateData } = req.body;
    if (sentAt) updateData.sentAt = new Date(sentAt);

    const existing = await Notification.findById(req.params.id).select('userId');
    if (!existing) return res.status(404).json({ error: 'Notification not found' });
    if (existing.userId && existing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'profile.fullName').select('-__v');
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteNotification(req, res) {
  try {
    const existing = await Notification.findById(req.params.id).select('userId');
    if (!existing) return res.status(404).json({ error: 'Notification not found' });
    if (existing.userId && existing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function markNotificationSent(req, res) {
  try {
    const existing = await Notification.findById(req.params.id).select('userId');
    if (!existing) return res.status(404).json({ error: 'Notification not found' });
    if (existing.userId && existing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const notification = await Notification.findByIdAndUpdate(req.params.id, { sentAt: new Date() }, { new: true })
      .populate('userId', 'profile.fullName');
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

