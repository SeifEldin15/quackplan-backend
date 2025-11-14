import mongoose from "mongoose";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import PersonalEvent from "../models/PersonalEvent.js";

export async function bookEvent({ eventId, userId }) {
  const session = await mongoose.startSession();
  return await session.withTransaction(async () => {
    const event = await Event.findById(eventId).session(session).exec();
    if (!event || event.status !== "published") throw new Error("Event unavailable");

    const existing = await Booking.findOne({ eventId, userId }).session(session);
    if (existing && existing.status !== "cancelled") {
      if (existing.status === "confirmed") {
        // Ensure a matching personal event exists for confirmed bookings
        await PersonalEvent.findOneAndUpdate(
          { userId, title: event.title, startsAt: event.startsAt, endsAt: event.endsAt },
          { $setOnInsert: { notes: undefined } },
          { upsert: true, new: true, session, setDefaultsOnInsert: true }
        );
      }
      return existing;
    }

    const confirmedCount = await Booking.countDocuments({ eventId, status: "confirmed" }).session(session);
    const status = confirmedCount < event.capacity ? "confirmed" : "waitlisted";

    const booking = await Booking.create([{ eventId, userId, status }], { session });

    if (status === "confirmed") {
      await PersonalEvent.findOneAndUpdate(
        { userId, title: event.title, startsAt: event.startsAt, endsAt: event.endsAt },
        { $setOnInsert: { notes: undefined } },
        { upsert: true, new: true, session, setDefaultsOnInsert: true }
      );
    }

    return booking[0];
  }).finally(() => session.endSession());
}