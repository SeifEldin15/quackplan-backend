import express from 'express';
import User from '../models/User.js';
import { authenticate, requireVendor, optionalAuth } from '../middleware/auth.js';
import { isSameUserId } from '../utils/authz.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const router = express.Router();

// GET /api/users - Get all users (public endpoint for browsing vendors/users)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { userType, isVendor, verificationStatus, search } = req.query;
    const { limit, page, skip } = parsePagination(req.query);
    const filter = { isActive: true };
    
    // Filter by user type
    if (userType) {
      filter.userType = userType;
    }
    
    // Legacy support for isVendor
    if (isVendor !== undefined) {
      filter.userType = isVendor === 'true' ? 'vendor' : 'customer';
    }
    
    // Filter by verification status (vendors only)
    if (verificationStatus && (userType === 'vendor' || isVendor === 'true')) {
      filter['profile.verificationStatus'] = verificationStatus;
    }
    
    // Text search in name and academy name
    if (search) {
      filter.$or = [
        { 'profile.fullName': { $regex: search, $options: 'i' } },
        { 'profile.academyName': { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-password -__v -emailVerificationToken -passwordResetToken -authProviderId')
      .limit(limit)
      .skip(skip)
      .sort({ 'profile.rating': -1, createdAt: -1 });
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get user by ID (public profile view)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).select('-password -__v -emailVerificationToken -passwordResetToken -authProviderId');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Convert to plain object to safely remove fields
    const userObj = user.toObject();
    if (!req.user || req.user._id.toString() !== user._id.toString()) {
      delete userObj.email;
      if (userObj.profile) {
        delete userObj.profile.phone;
        delete userObj.profile.businessPhone;
      }
    }
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Removed deprecated POST /api/users. Please use /api/auth/register instead.

// PUT /api/users/:id - Update user (admin only or self)
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Users can only update their own profile, unless they're admin (future feature)
    if (!isSameUserId(req.user._id, req.params.id)) {
      return res.status(403).json({ 
        error: 'Access denied. You can only update your own profile.',
        code: 'UNAUTHORIZED_UPDATE'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password -__v -emailVerificationToken -passwordResetToken');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Deactivate user account (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Users can only deactivate their own account, unless they're admin (future feature)
    if (!isSameUserId(req.user._id, req.params.id)) {
      return res.status(403).json({ 
        error: 'Access denied. You can only deactivate your own account.',
        code: 'UNAUTHORIZED_DELETE'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
