import express from 'express';
import Event from '../models/Event.js';
import { authenticate, requireVendor, optionalAuth } from '../middleware/auth.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const router = express.Router();

// GET /api/events - Get all events with filtering
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { vendorId, status = 'published', visibility = 'public', tags, search, startDate, endDate } = req.query;
    const { limit, page, skip } = parsePagination(req.query);
    
    const filter = {};
    
    if (vendorId) filter.vendorId = vendorId;
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (startDate || endDate) {
      filter.startsAt = {};
      if (startDate) filter.startsAt.$gte = new Date(startDate);
      if (endDate) filter.startsAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$text = { $search: search };
    }
    
    const events = await Event.find(filter)
      .populate('vendorId', 'profile.fullName profile.academyName profile.rating')
      .select('-__v')
      .limit(limit)
      .skip(skip)
      .sort({ startsAt: 1 });
    
    const total = await Event.countDocuments(filter);
    
    res.json({ events, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('vendorId', 'profile.fullName profile.academyName profile.rating')
      .select('-__v');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Create new event (vendors only)
router.post('/', authenticate, requireVendor, async (req, res) => {
  try {
    const { title, startsAt, endsAt } = req.body;
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
    // Set the vendorId to the authenticated user's ID
    const eventData = {
      ...req.body,
      title,
      startsAt: start,
      endsAt: end,
      vendorId: req.user._id
    };
    
    const event = new Event(eventData);
    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('vendorId', 'profile.fullName profile.academyName profile.rating profile.verificationStatus');
    
    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/events/:id - Update event (vendor who created it only)
router.put('/:id', authenticate, requireVendor, async (req, res) => {
  try {
    // First check if event exists and belongs to this vendor
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (existingEvent.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Access denied. You can only update your own events.',
        code: 'UNAUTHORIZED_UPDATE'
      });
    }
    
    const update = { ...req.body };
    if (update.startsAt || update.endsAt) {
      const start = update.startsAt ? new Date(update.startsAt) : new Date(existingEvent.startsAt);
      const end = update.endsAt ? new Date(update.endsAt) : new Date(existingEvent.endsAt);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format for startsAt or endsAt' });
      }
      if (end <= start) {
        return res.status(400).json({ error: 'endsAt must be after startsAt' });
      }
      update.startsAt = start;
      update.endsAt = end;
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    )
    .populate('vendorId', 'profile.fullName profile.academyName profile.rating profile.verificationStatus')
    .select('-__v');
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/events/:id - Delete event (vendor who created it only)
router.delete('/:id', authenticate, requireVendor, async (req, res) => {
  try {
    // First check if event exists and belongs to this vendor
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (existingEvent.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Access denied. You can only delete your own events.',
        code: 'UNAUTHORIZED_DELETE'
      });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
