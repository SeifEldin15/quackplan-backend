import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const ProfileSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  phone: String,
  dob: Date,
  location: String,
  rating: { type: Number, min: 0, max: 5, default: 0 },
  profilePicture: String,
  bio: String,
  // Vendor-specific fields
  isVendor: { type: Boolean, default: false },
  academyName: String,
  specializations: { type: [String], default: [] },
  businessAddress: String,
  businessPhone: String,
  businessWebsite: String,
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
}, { _id: false });

const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    index: true 
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  userType: { 
    type: String, 
    enum: ['customer', 'vendor'], 
    required: true,
    default: 'customer'
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  isActive: { type: Boolean, default: true },
  
  profile: ProfileSchema,
}, { timestamps: true });

// Index for efficient queries
UserSchema.index({ email: 1, userType: 1 });
UserSchema.index({ 'profile.isVendor': 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update profile.isVendor based on userType
UserSchema.pre('save', function(next) {
  if (this.isModified('userType')) {
    this.profile.isVendor = this.userType === 'vendor';
  }
  next();
});

export default mongoose.models.User ?? mongoose.model("User", UserSchema);