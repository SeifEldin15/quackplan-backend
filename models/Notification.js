import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  kind: { type: String, enum: ["email","push","sms"], required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  scheduledFor: { type: Date, index: true },
  sentAt: Date
}, { timestamps: true });

NotificationSchema.index({ scheduledFor: 1, sentAt: 1 });

export default mongoose.models.Notification ?? mongoose.model("Notification", NotificationSchema);