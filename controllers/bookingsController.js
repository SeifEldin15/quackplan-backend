import rateLimit from 'express-rate-limit';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import PersonalEvent from '../models/PersonalEvent.js';
import { bookEvent } from '../services/bookEvent.js';
import { cancelBooking } from '../services/cancelBooking.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { ensureOwnerOrVendor } from '../utils/authz.js';

export const bookingsWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false
});

export async function listBookings(req, res) {
  try {
    const { eventId, userId, status } = req.query;
    const { limit, page, skip } = parsePagination(req.query);
    const filter = {};
    if (eventId) filter.eventId = eventId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('eventId', 'title startsAt endsAt location priceCents')
      .populate('userId', 'profile.fullName')
      .select('-__v')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);
    res.json({ bookings, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title startsAt endsAt location priceCents vendorId')
      .populate('userId', 'profile.fullName')
      .select('-__v');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const allowed = ensureOwnerOrVendor(booking.userId?._id ?? booking.userId, booking.eventId?.vendorId, req.user._id);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createBooking(req, res) {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    const userId = req.user._id;
    const booking = await bookEvent({ eventId, userId });
    const populated = await Booking.findById(booking._id)
      .populate('eventId', 'title startsAt endsAt location priceCents')
      .populate('userId', 'profile.fullName');
    res.status(201).json(populated);
  } catch (error) {
    if (error.message === 'Event unavailable') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
}

export async function updateBooking(req, res) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const existing = await Booking.findById(req.params.id).populate('eventId', 'vendorId title startsAt endsAt');
    if (!existing) return res.status(404).json({ error: 'Booking not found' });

    const allowed = ensureOwnerOrVendor(existing.userId, existing.eventId?.vendorId, req.user._id);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('eventId', 'title startsAt endsAt location')
      .populate('userId', 'profile.fullName')
      .select('-__v');

    // Sync personal event according to status change
    try {
      const evt = await Event.findById(booking.eventId);
      if (evt) {
        if (status === 'confirmed') {
          await PersonalEvent.findOneAndUpdate(
            { userId: booking.userId, title: evt.title, startsAt: evt.startsAt, endsAt: evt.endsAt },
            { $setOnInsert: { notes: undefined } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } else if (['cancelled','waitlisted','noshow'].includes(status)) {
          await PersonalEvent.findOneAndDelete({ userId: booking.userId, title: evt.title, startsAt: evt.startsAt, endsAt: evt.endsAt });
        }
      }
    } catch (_) {
      // best-effort: do not fail booking update on personal event sync issues
    }

    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id).populate('eventId', 'vendorId');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const allowed = ensureOwnerOrVendor(booking.userId, booking.eventId?.vendorId, req.user._id);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const result = await cancelBooking({ bookingId: req.params.id, byUserId: req.user._id });
    res.json({ message: 'Booking cancelled successfully', cancelled: result.cancelled, promoted: result.promoted });
  } catch (error) {
    if (error.message === 'Not found') return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
}

