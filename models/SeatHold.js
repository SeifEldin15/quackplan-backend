import mongoose, { Schema } from "mongoose";

const SeatHoldSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  userId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status:  { type: String, enum: ["active","consumed","released","expired"], default: "active", index: true },
  checkoutSessionId: { type: String, index: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

// Unique active hold per (eventId, userId)
SeatHoldSchema.index({ eventId: 1, userId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "active" } });
// TTL on expiresAt to auto-delete expired holds
SeatHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.SeatHold ?? mongoose.model("SeatHold", SeatHoldSchema);


