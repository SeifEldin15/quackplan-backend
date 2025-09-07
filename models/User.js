import mongoose, { Schema } from "mongoose";

const ProfileSchema = new Schema({
  fullName: String,
  email: { type: String, index: true, unique: true },
  phone: String,
  dob: Date,
  location: String,
  rating: { type: Number, min: 0, max: 5 },
  isVendor: { type: Boolean, default: false },
  academyName: String,
  specializations: { type: [String], default: [] },
}, { _id: false });

const UserSchema = new Schema({
  authProviderId: { type: String, index: true },
  profile: ProfileSchema,
}, { timestamps: true });

export default mongoose.models.User ?? mongoose.model("User", UserSchema);