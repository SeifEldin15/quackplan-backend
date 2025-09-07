import express from 'express';
import PersonalEvent from '../models/PersonalEvent.js';

const router = express.Router();

// GET /api/personal-events - Get personal events for a user
router.get('/', async (req, res) => {
  try {
    const { userId, startDate, endDate, limit = 20, page = 1 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const filter = { userId };
    
    if (startDate || endDate) {
      filter.startsAt = {};
      if (startDate) filter.startsAt.$gte = new Date(startDate);
      if (endDate) filter.startsAt.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    const events = await PersonalEvent.find(filter)
      .populate('userId', 'profile.fullName profile.email')
      .select('-__v')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ startsAt: 1 });
    
    const total = await PersonalEvent.countDocuments(filter);
    
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

// GET /api/personal-events/:id - Get personal event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await PersonalEvent.findById(req.params.id)
      .populate('userId', 'profile.fullName profile.email')
      .select('-__v');
    
    if (!event) {
      return res.status(404).json({ error: 'Personal event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/personal-events - Create new personal event
router.post('/', async (req, res) => {
  try {
    const event = new PersonalEvent(req.body);
    await event.save();
    
    const populatedEvent = await PersonalEvent.findById(event._id)
      .populate('userId', 'profile.fullName profile.email');
    
    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/personal-events/:id - Update personal event
router.put('/:id', async (req, res) => {
  try {
    const event = await PersonalEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('userId', 'profile.fullName profile.email')
    .select('-__v');
    
    if (!event) {
      return res.status(404).json({ error: 'Personal event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/personal-events/:id - Delete personal event
router.delete('/:id', async (req, res) => {
  try {
    const event = await PersonalEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Personal event not found' });
    }
    res.json({ message: 'Personal event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
