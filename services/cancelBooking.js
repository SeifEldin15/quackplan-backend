import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import PersonalEvent from "../models/PersonalEvent.js";

export async function cancelBooking({ bookingId, byUserId }) {
  const session = await mongoose.startSession();
  return await session.withTransaction(async () => {
    const b = await Booking.findById(bookingId).session(session);
    if (!b) throw new Error("Not found");

    b.status = "cancelled";
    await b.save({ session });

    // Remove user's personal event for this booking if it exists
    const evt = await Event.findById(b.eventId).session(session);
    if (evt) {
      await PersonalEvent.findOneAndDelete(
        { userId: b.userId, title: evt.title, startsAt: evt.startsAt, endsAt: evt.endsAt },
        { session }
      );
    }

    const candidate = await Booking.findOne({
      eventId: b.eventId, status: "waitlisted"
    }).sort({ createdAt: 1 }).session(session);

    if (candidate) {
      candidate.status = "confirmed";
      await candidate.save({ session });

      // Create personal event for promoted user
      if (evt) {
        await PersonalEvent.findOneAndUpdate(
          { userId: candidate.userId, title: evt.title, startsAt: evt.startsAt, endsAt: evt.endsAt },
          { $setOnInsert: { notes: undefined } },
          { upsert: true, new: true, session, setDefaultsOnInsert: true }
        );
      }
    }
    return { cancelled: b, promoted: candidate ?? null };
  }).finally(() => session.endSession());
}