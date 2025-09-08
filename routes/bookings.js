import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { bookingsWriteLimiter, listBookings, getBooking, createBooking, updateBooking, deleteBooking } from '../controllers/bookingsController.js';

const router = express.Router();

// Rate limiter is provided by controller module

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
