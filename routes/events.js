import express from 'express';
import Event from '../models/Event.js';

const router = express.Router();

// GET /api/events - Get all events with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      vendorId, 
      status = 'published', 
      visibility = 'public', 
      tags, 
      search, 
      startDate, 
      endDate,
      limit = 20, 
      page = 1 
    } = req.query;
    
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
    
    const skip = (page - 1) * limit;
    const events = await Event.find(filter)
      .populate('vendorId', 'profile.fullName profile.academyName profile.rating')
      .select('-__v')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ startsAt: 1 });
    
    const total = await Event.countDocuments(filter);
    
    res.json({
      events,
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

// GET /api/events/:id - Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('vendorId', 'profile.fullName profile.academyName profile.email profile.phone profile.rating')
      .select('-__v');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Create new event
router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('vendorId', 'profile.fullName profile.academyName profile.rating');
    
    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('vendorId', 'profile.fullName profile.academyName profile.rating')
    .select('-__v');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
