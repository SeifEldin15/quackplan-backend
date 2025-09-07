import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /api/notifications - Get notifications for a user
router.get('/', async (req, res) => {
  try {
    const { userId, kind, sent, limit = 20, page = 1 } = req.query;
    
    const filter = {};
    if (userId) filter.userId = userId;
    if (kind) filter.kind = kind;
    
    // Filter by sent/unsent status
    if (sent === 'true') {
      filter.sentAt = { $exists: true, $ne: null };
    } else if (sent === 'false') {
      filter.sentAt = { $exists: false };
    }
    
    const skip = (page - 1) * limit;
    const notifications = await Notification.find(filter)
      .populate('userId', 'profile.fullName profile.email profile.phone')
      .select('-__v')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ scheduledFor: -1, createdAt: -1 });
    
    const total = await Notification.countDocuments(filter);
    
    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('userId', 'profile.fullName profile.email profile.phone')
      .select('-__v');
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications - Create new notification
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('userId', 'profile.fullName profile.email profile.phone');
    
    res.status(201).json(populatedNotification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/notifications/:id - Update notification (mark as sent)
router.put('/:id', async (req, res) => {
  try {
    const { sentAt, ...updateData } = req.body;
    
    if (sentAt) {
      updateData.sentAt = new Date(sentAt);
    }
    
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('userId', 'profile.fullName profile.email profile.phone')
    .select('-__v');
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/:id/mark-sent - Mark notification as sent
router.post('/:id/mark-sent', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { sentAt: new Date() },
      { new: true }
    )
    .populate('userId', 'profile.fullName profile.email profile.phone');
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
