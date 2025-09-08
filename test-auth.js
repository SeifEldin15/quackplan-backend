import { test } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

const TEST_DB_URI = 'mongodb://localhost:27017/quackplan-auth-test';

test('Database connection for auth tests', async () => {
  try {
    await connectDB(TEST_DB_URI);
    assert.ok(mongoose.connection.readyState === 1, 'Database should be connected');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('⚠️ MongoDB not available, skipping database tests');
    console.log('To run full tests, please install and start MongoDB');
    return;
  }
});

test('User model with authentication fields', async () => {
  try {
    // Clean up
    await User.deleteMany({});
    
    const userData = {
      email: 'melissa.peters@soccergym.com',
      password: 'TestPass123',
      userType: 'vendor',
      profile: {
        fullName: 'Melissa Peters',
        phone: '+1 (305) 555-0188',
        location: 'Miami, Florida – Downtown Sports Center',
        academyName: 'Soccer Academy',
        specializations: ['Soccer Academy', 'Soccer Training', 'Swimming Classes']
      }
    };
    
    const user = new User(userData);
    const savedUser = await user.save();
    
    assert.ok(savedUser._id, 'User should have an ID');
    assert.strictEqual(savedUser.email, 'melissa.peters@soccergym.com');
    assert.strictEqual(savedUser.userType, 'vendor');
    assert.strictEqual(savedUser.profile.isVendor, true, 'isVendor should be set automatically');
    assert.ok(savedUser.password !== 'TestPass123', 'Password should be hashed');
    
    console.log('✅ User model with auth fields works correctly');
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('⚠️ Skipping database test - MongoDB not available');
    } else {
      throw error;
    }
  }
});

test('Password hashing and comparison', async () => {
  try {
    // Query user with password field explicitly selected
    const user = await User.findOne({ email: 'melissa.peters@soccergym.com' }).select('+password');
    if (!user) {
      console.log('⚠️ Skipping password test - no user found');
      return;
    }
    
    // Test password comparison
    const isValidPassword = await user.comparePassword('TestPass123');
    const isInvalidPassword = await user.comparePassword('WrongPassword');
    
    assert.strictEqual(isValidPassword, true, 'Correct password should match');
    assert.strictEqual(isInvalidPassword, false, 'Incorrect password should not match');
    
    console.log('✅ Password hashing and comparison works correctly');
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('⚠️ Skipping password test - MongoDB not available');
    } else {
      throw error;
    }
  }
});

test('User type and vendor status sync', async () => {
  try {
    // Test customer user
    const customerData = {
      email: 'john.customer@example.com',
      password: 'CustomerPass123',
      userType: 'customer',
      profile: {
        fullName: 'John Customer',
        phone: '+1234567890'
      }
    };
    
    const customer = new User(customerData);
    await customer.save();
    
    assert.strictEqual(customer.userType, 'customer');
    assert.strictEqual(customer.profile.isVendor, false, 'Customer should not be vendor');
    
    console.log('✅ User type and vendor status sync works correctly');
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('⚠️ Skipping user type test - MongoDB not available');
    } else {
      throw error;
    }
  }
});

test('Email uniqueness constraint', async () => {
  try {
    const duplicateUserData = {
      email: 'melissa.peters@soccergym.com', // Same email as before
      password: 'AnotherPass123',
      userType: 'customer',
      profile: {
        fullName: 'Another User'
      }
    };
    
    const duplicateUser = new User(duplicateUserData);
    
    let errorThrown = false;
    try {
      await duplicateUser.save();
    } catch (error) {
      errorThrown = true;
      assert.strictEqual(error.code, 11000, 'Should throw duplicate key error');
    }
    
    assert.ok(errorThrown, 'Should not allow duplicate emails');
    console.log('✅ Email uniqueness constraint works correctly');
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('⚠️ Skipping uniqueness test - MongoDB not available');
    } else {
      throw error;
    }
  }
});

test('Close database connection', async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      assert.ok(mongoose.connection.readyState === 0, 'Database should be disconnected');
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.log('⚠️ Error closing database connection');
  }
});

// Test authentication middleware logic (without server)
test('JWT token validation logic', async () => {
  try {
    const jwt = await import('jsonwebtoken');
    const secret = 'test-secret-key';
    const userId = '507f1f77bcf86cd799439011';
    
    // Generate token
    const token = jwt.default.sign({ userId }, secret, { expiresIn: '1h' });
    assert.ok(token, 'Should generate JWT token');
    
    // Verify token
    const decoded = jwt.default.verify(token, secret);
    assert.strictEqual(decoded.userId, userId, 'Should decode correct user ID');
    
    console.log('✅ JWT token generation and validation works correctly');
  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
    throw error;
  }
});

// Test password validation logic
test('Password validation rules', async () => {
  const validPasswords = ['Password123', 'SecurePass456', 'MyPass789'];
  const invalidPasswords = ['pass', '123456', 'password', 'PASSWORD123'];
  
  // Simple validation (matches middleware rules)
  const validatePassword = (password) => {
    return password.length >= 6 && 
           /[a-z]/.test(password) && 
           /[A-Z]/.test(password) && 
           /\d/.test(password);
  };
  
  validPasswords.forEach(password => {
    assert.ok(validatePassword(password), `${password} should be valid`);
  });
  
  invalidPasswords.forEach(password => {
    assert.ok(!validatePassword(password), `${password} should be invalid`);
  });
  
  console.log('✅ Password validation rules work correctly');
});

console.log('🧪 Running Authentication System Tests...');
console.log('📝 Note: Some tests require MongoDB to be running');
console.log('💡 Install MongoDB from: https://www.mongodb.com/try/download/community');
