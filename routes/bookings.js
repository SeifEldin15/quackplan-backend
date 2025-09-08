import express from 'express';
import Booking from '../models/Booking.js';
import { bookEvent } from '../services/bookEvent.js';
import { cancelBooking } from '../services/cancelBooking.js';
import { authenticate, requireVendor, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bookings - Get all bookings with filtering (authenticated users only)
router.get('/', authenticate, async (req, res) => {
  try {
    const { eventId, userId, status, limit = 20, page = 1 } = req.query;
    const filter = {};
    
    if (eventId) filter.eventId = eventId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    const bookings = await Booking.find(filter)
      .populate('eventId', 'title startsAt endsAt location priceCents')
      .populate('userId', 'profile.fullName profile.email profile.phone')
      .select('-__v')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Booking.countDocuments(filter);
    
    res.json({
      bookings,
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

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title startsAt endsAt location priceCents vendorId')
      .populate('userId', 'profile.fullName profile.email profile.phone')
      .select('-__v');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bookings - Create new booking (book an event)
router.post('/', authenticate, async (req, res) => {
  try {
    const { eventId, paymentRef } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ 
        error: 'eventId is required' 
      });
    }
    
    // Use authenticated user's ID
    const userId = req.user._id;
    
    const booking = await bookEvent({ eventId, userId, paymentRef });
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('eventId', 'title startsAt endsAt location priceCents')
      .populate('userId', 'profile.fullName profile.email');
    
    res.status(201).json(populatedBooking);
  } catch (error) {
    if (error.message === 'Event unavailable') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/bookings/:id - Update booking status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
    .populate('eventId', 'title startsAt endsAt location')
    .populate('userId', 'profile.fullName profile.email')
    .select('-__v');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', async (req, res) => {
  try {
    const { byUserId } = req.body;
    const result = await cancelBooking({ 
      bookingId: req.params.id, 
      byUserId 
    });
    
    res.json({
      message: 'Booking cancelled successfully',
      cancelled: result.cancelled,
      promoted: result.promoted
    });
  } catch (error) {
    if (error.message === 'Not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
