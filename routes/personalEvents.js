import express from 'express';
import PersonalEvent from '../models/PersonalEvent.js';
import Event from '../models/Event.js';
import { authenticate } from '../middleware/auth.js';
import { isSameUserId } from '../utils/authz.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const router = express.Router();

// GET /api/personal-events/overview - Full personal view (includes vendor-created events for vendors)
router.get('/overview', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { limit, page, skip } = parsePagination(req.query);
    const userId = req.user._id;

    const range = {};
    if (startDate) range.$gte = new Date(startDate);
    if (endDate) range.$lte = new Date(endDate);

    const personalFilter = { userId };
    if (startDate || endDate) personalFilter.startsAt = range;

    const personal = await PersonalEvent.find(personalFilter)
      .select('-__v')
      .limit(limit)
      .skip(skip)
      .sort({ startsAt: 1 })
      .lean();

    let vendorCreated = [];
    if (req.user.userType === 'vendor') {
      const eventFilter = { vendorId: userId };
      if (startDate || endDate) eventFilter.startsAt = range;
      const events = await Event.find(eventFilter)
        .select('title startsAt endsAt')
        .sort({ startsAt: 1 })
        .lean();
      vendorCreated = events.map(e => ({
        _id: `vendor-${e._id}`,
        userId,
        title: e.title,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        notes: undefined,
        source: 'vendor'
      }));
    }

    const items = [
      ...personal.map(p => ({ ...p, source: p.source || 'personal' })),
      ...vendorCreated
    ];

    // manual pagination across combined list (keep simple: already limited personal; vendor list typically smaller)
    res.json({
      items,
      pagination: buildPaginationMeta(page, limit, items.length)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/personal-events - Get personal events for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { limit, page, skip } = parsePagination(req.query);
    const userId = req.user._id;
    const filter = { userId };
    
    if (startDate || endDate) {
      filter.startsAt = {};
      if (startDate) filter.startsAt.$gte = new Date(startDate);
      if (endDate) filter.startsAt.$lte = new Date(endDate);
    }
    
    const events = await PersonalEvent.find(filter)
      .populate('userId', 'profile.fullName profile.email')
      .select('-__v')
      .limit(limit)
      .skip(skip)
      .sort({ startsAt: 1 });
    
    const total = await PersonalEvent.countDocuments(filter);
    
    res.json({ events, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/personal-events/from-event - Add a public event to personal calendar for the authenticated user
router.post('/from-event', authenticate, async (req, res) => {
  try {
    const { eventId, notes } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    const evt = await Event.findById(eventId).select('title startsAt endsAt status visibility');
    if (!evt) return res.status(404).json({ error: 'Event not found' });
    if (evt.status !== 'published') return res.status(400).json({ error: 'Event unavailable' });

    const personal = await PersonalEvent.findOneAndUpdate(
      { userId: req.user._id, title: evt.title, startsAt: evt.startsAt, endsAt: evt.endsAt },
      { $setOnInsert: { userId: req.user._id, title: evt.title, startsAt: evt.startsAt, endsAt: evt.endsAt, notes } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('userId', 'profile.fullName profile.email');

    res.status(201).json(personal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/personal-events/:id - Get personal event by ID (owner only)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const event = await PersonalEvent.findById(req.params.id)
      .populate('userId', 'profile.fullName profile.email')
      .select('-__v');
    
    if (!event) {
      return res.status(404).json({ error: 'Personal event not found' });
    }
    if (!isSameUserId(event.userId?._id ?? event.userId, req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/personal-events - Create new personal event (owner is authenticated user)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, startsAt, endsAt, notes } = req.body;
    if (!startsAt || !endsAt) {
      return res.status(400).json({ error: 'startsAt and endsAt are required' });
    }
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format for startsAt or endsAt' });
    }
    if (end <= start) {
      return res.status(400).json({ error: 'endsAt must be after startsAt' });
    }

    const event = new PersonalEvent({
      userId: req.user._id,
      title,
      startsAt: start,
      endsAt: end,
      notes
    });
    await event.save();
    
    const populatedEvent = await PersonalEvent.findById(event._id)
      .populate('userId', 'profile.fullName profile.email');
    
    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/personal-events/:id - Update personal event (owner only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await PersonalEvent.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Personal event not found' });
    }
    if (!isSameUserId(existing.userId, req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const update = { ...req.body };
    if (update.startsAt || update.endsAt) {
      const start = update.startsAt ? new Date(update.startsAt) : new Date(existing.startsAt);
      const end = update.endsAt ? new Date(update.endsAt) : new Date(existing.endsAt);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format for startsAt or endsAt' });
      }
      if (end <= start) {
        return res.status(400).json({ error: 'endsAt must be after startsAt' });
      }
    }

    const event = await PersonalEvent.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    )
      .populate('userId', 'profile.fullName profile.email')
      .select('-__v');

    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/personal-events/:id - Delete personal event (owner only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const existing = await PersonalEvent.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Personal event not found' });
    }
    if (!isSameUserId(existing.userId, req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await PersonalEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Personal event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
