import mongoose, { Schema } from "mongoose";

const PersonalEventSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title:    { type: String, required: true },
  startsAt: { type: Date, required: true, index: true },
  endsAt:   { type: Date, required: true },
  notes: String,
}, { timestamps: true });

export default mongoose.models.PersonalEvent ?? mongoose.model("PersonalEvent", PersonalEventSchema);