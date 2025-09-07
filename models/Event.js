import mongoose, { Schema } from "mongoose";

const EventSchema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: String,
  location: String,
  startsAt: { type: Date, required: true, index: true },
  endsAt:   { type: Date, required: true },
  capacity: { type: Number, default: 20, min: 0 },
  priceCents: { type: Number, default: 0, min: 0 },
  visibility: { type: String, enum: ["public","unlisted","private"], default: "public", index: true },
  status: { type: String, enum: ["draft","published","cancelled"], default: "draft", index: true },
  tags: { type: [String], default: [], index: true },
  coverUrl: String,
}, { timestamps: true });

EventSchema.index({ vendorId: 1, startsAt: 1 });
EventSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.models.Event ?? mongoose.model("Event", EventSchema);