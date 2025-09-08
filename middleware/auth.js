import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid token or user account deactivated.',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    res.status(500).json({ error: 'Authentication error.' });
  }
};

// Authorization middleware for vendors
export const requireVendor = (req, res, next) => {
  if (req.user.userType !== 'vendor') {
    return res.status(403).json({ 
      error: 'Access denied. Vendor privileges required.',
      code: 'VENDOR_REQUIRED'
    });
  }
  next();
};

// Authorization middleware for verified vendors
export const requireVerifiedVendor = (req, res, next) => {
  if (req.user.userType !== 'vendor') {
    return res.status(403).json({ 
      error: 'Access denied. Vendor privileges required.',
      code: 'VENDOR_REQUIRED'
    });
  }
  
  if (req.user.profile.verificationStatus !== 'verified') {
    return res.status(403).json({ 
      error: 'Access denied. Verified vendor status required.',
      code: 'VERIFICATION_REQUIRED'
    });
  }
  
  next();
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
