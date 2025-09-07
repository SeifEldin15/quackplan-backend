import mongoose from "mongoose";
import Booking from "../models/Booking.js";

export async function cancelBooking({ bookingId, byUserId }) {
  const session = await mongoose.startSession();
  return await session.withTransaction(async () => {
    const b = await Booking.findById(bookingId).session(session);
    if (!b) throw new Error("Not found");

    b.status = "cancelled";
    await b.save({ session });

    const candidate = await Booking.findOne({
      eventId: b.eventId, status: "waitlisted"
    }).sort({ createdAt: 1 }).session(session);

    if (candidate) {
      candidate.status = "confirmed";
      await candidate.save({ session });
    }
    return { cancelled: b, promoted: candidate ?? null };
  }).finally(() => session.endSession());
}