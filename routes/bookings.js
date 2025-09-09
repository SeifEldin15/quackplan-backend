import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { bookingsWriteLimiter, listBookings, getBooking, createBooking, updateBooking, deleteBooking } from '../controllers/bookingsController.js';
import Booking from '../models/Booking.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const router = express.Router();

// Rate limiter is provided by controller module

// GET /api/bookings/mine - Get bookings for the authenticated user
router.get('/mine', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const { limit, page, skip } = parsePagination(req.query);
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('eventId', 'title startsAt endsAt location priceCents')
      .select('-__v')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);
    res.json({ bookings, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings - Get all bookings with filtering (authenticated users only)
router.get('/', authenticate, listBookings);

// GET /api/bookings/:id - Get booking by ID (authenticated)
router.get('/:id', authenticate, getBooking);

// POST /api/bookings - Create new booking (book an event)
router.post('/', authenticate, bookingsWriteLimiter, createBooking);

// PUT /api/bookings/:id - Update booking status
router.put('/:id', authenticate, bookingsWriteLimiter, updateBooking);

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', authenticate, bookingsWriteLimiter, deleteBooking);

export default router;
