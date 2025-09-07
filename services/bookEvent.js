import mongoose from "mongoose";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

export async function bookEvent({ eventId, userId, paymentRef }) {
  const session = await mongoose.startSession();
  return await session.withTransaction(async () => {
    const event = await Event.findById(eventId).session(session).exec();
    if (!event || event.status !== "published") throw new Error("Event unavailable");

    const existing = await Booking.findOne({ eventId, userId }).session(session);
    if (existing && existing.status !== "cancelled") return existing;

    const confirmedCount = await Booking.countDocuments({ eventId, status: "confirmed" }).session(session);
    const status = confirmedCount < event.capacity ? "confirmed" : "waitlisted";

    const booking = await Booking.create([{
      eventId, userId, status, paymentRef
    }], { session });

    return booking[0];
  }).finally(() => session.endSession());
}