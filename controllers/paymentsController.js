import Stripe from 'stripe';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import SeatHold from '../models/SeatHold.js';
import { config } from '../config/index.js';
import { bookEvent } from '../services/bookEvent.js';

const stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2023-10-16' });

export async function createCheckoutSession(req, res) {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    const event = await Event.findById(eventId).select('title description priceCents capacity status');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'published') return res.status(400).json({ error: 'Event unavailable' });

    const priceCents = event.priceCents ?? 0;
    if (priceCents <= 0) {
      // Free event: use normal booking logic (respects capacity/waitlist)
      const booking = await bookEvent({ eventId, userId: req.user._id, paymentRef: null });
      return res.status(200).json({ free: true, bookingId: booking._id, status: booking.status });
    }

    // For paid events, create a temporary seat hold if capacity allows
    const sessionDb = await mongoose.startSession();
    let checkoutSession;
    await sessionDb.withTransaction(async () => {
      const confirmedCount = await Booking.countDocuments({ eventId, status: 'confirmed' }).session(sessionDb);
      const activeHolds = await SeatHold.countDocuments({ eventId, status: 'active', expiresAt: { $gt: new Date() } }).session(sessionDb);
      const totalReserved = confirmedCount + activeHolds;
      if (totalReserved >= (event.capacity ?? Infinity)) {
        throw new Error('Event at capacity');
      }

      const holdMinutes = config.seatHoldMinutes;
      const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

      // Ensure single active hold per user/event
      await SeatHold.findOneAndUpdate(
        { eventId, userId: req.user._id, status: 'active' },
        { $setOnInsert: { expiresAt } },
        { upsert: true, new: true, session: sessionDb, setDefaultsOnInsert: true }
      );

      // Create Stripe session within the same flow
      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: config.stripe.currency,
              product_data: {
                name: event.title,
                description: event.description?.slice(0, 200) || undefined
              },
              unit_amount: priceCents
            },
            quantity: 1
          }
        ],
        metadata: {
          eventId: String(eventId),
          userId: String(req.user._id)
        },
        success_url: config.stripe.successUrl,
        cancel_url: config.stripe.cancelUrl,
      });

      // Attach the checkout session id to the active hold
      await SeatHold.findOneAndUpdate(
        { eventId, userId: req.user._id, status: 'active' },
        { checkoutSessionId: checkoutSession.id },
        { new: true, session: sessionDb }
      );
    }).finally(() => sessionDb.endSession());

    res.json({ id: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    const status = error.message === 'Event at capacity' || error.message === 'Event unavailable' ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
}

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    if (!config.stripe.webhookSecret) {
      return res.status(500).send('Webhook secret not configured');
    }
    event = stripe.webhooks.constructEvent(req.rawBody, sig, config.stripe.webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const eventId = session.metadata?.eventId;
        const userId = session.metadata?.userId;
        if (eventId && userId) {
          const dbSession = await mongoose.startSession();
          await dbSession.withTransaction(async () => {
            // Mark hold as consumed if present and active
            const hold = await SeatHold.findOne({ eventId, userId, status: 'active', checkoutSessionId: session.id }).session(dbSession);
            if (hold) {
              hold.status = 'consumed';
              await hold.save({ session: dbSession });
            }

            // Create booking with core logic to respect capacity and waitlist
            const booking = await bookEvent({ eventId, userId, paymentRef: session.id });
            return booking;
          }).finally(() => dbSession.endSession());
        }
        break;
      }
      case 'checkout.session.expired': {
        const sessionObj = event.data.object;
        const sessionId = sessionObj.id;
        await SeatHold.updateMany(
          { checkoutSessionId: sessionId, status: 'active' },
          { status: 'expired' }
        );
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


