import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { 
  validateRegister, 
  validateLogin, 
  validateProfileUpdate,
  validatePasswordChange 
} from '../middleware/validation.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// POST /api/auth/register - Register new user
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const { email, password, userType, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this email address',
        code: 'EMAIL_EXISTS'
      });
    }

    // Create new user
    const userData = {
      email,
      password,
      userType,
      profile: {
        ...profile,
        isVendor: userType === 'vendor'
      }
    };

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return user data without password
    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Email address already in use',
        code: 'DUPLICATE_EMAIL'
      });
    }
    res.status(500).json({
      error: 'Registration failed. Please try again.',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return user data without password
    const userResponse = await User.findById(user._id).select('-password');

    res.json({
      message: 'Login successful',
      token,
      user: userResponse,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.',
      code: 'LOGIN_ERROR'
    });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: req.user,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticate, validateProfileUpdate, async (req, res) => {
  try {
    const { profile } = req.body;
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          'profile': { ...req.user.profile.toObject(), ...profile }
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// PUT /api/auth/change-password - Change user password
router.put('/change-password', authenticate, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', authenticate, (req, res) => {
  res.json({
    message: 'Logged out successfully. Please remove the token from client storage.'
  });
});

// GET /api/auth/verify-token - Verify token validity
router.get('/verify-token', authenticate, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user,
    isValid: true
  });
});

export default router;

// Profile picture upload setup and route (placed after export for readability but executed before import consumers)
const uploadsRoot = path.resolve('uploads');
const profileDir = path.join(uploadsRoot, 'profiles');
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profileDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeOk = (file.mimetype || '').startsWith('image/');
  if (!allowed.includes(ext) || !isMimeOk) {
    return cb(new Error('Only image files are allowed (.png, .jpg, .jpeg, .webp)'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// PUT /api/auth/profile/picture - Upload or update profile picture
router.put('/profile/picture', authenticate, upload.single('picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = path.join('uploads', 'profiles', req.file.filename).replace(/\\/g, '/');
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'profile.profilePicture': `/${relativePath}` } },
      { new: true }
    ).select('-password');

    return res.json({
      message: 'Profile picture updated',
      user: updated,
      url: updated.profile?.profilePicture
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
