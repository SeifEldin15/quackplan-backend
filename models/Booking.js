import mongoose, { Schema } from "mongoose";

const BookingSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  userId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status:  { type: String, enum: ["confirmed","waitlisted","cancelled","noshow","checked_in"], default: "confirmed", index: true },
}, { timestamps: true });

BookingSchema.index({ eventId: 1, userId: 1 }, { unique: true });
BookingSchema.index({ eventId: 1, status: 1, createdAt: 1 });

export default mongoose.models.Booking ?? mongoose.model("Booking", BookingSchema);