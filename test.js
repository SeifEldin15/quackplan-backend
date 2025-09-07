import { test } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import User from './models/User.js';
import Event from './models/Event.js';
import Booking from './models/Booking.js';
import { bookEvent } from './services/bookEvent.js';
import { cancelBooking } from './services/cancelBooking.js';

const TEST_DB_URI = 'mongodb://localhost:27017/evently-test';

test('Database connection', async () => {
  await connectDB(TEST_DB_URI);
  assert.ok(mongoose.connection.readyState === 1, 'Database should be connected');
});

test('User model validation', async () => {
  // Clean up
  await User.deleteMany({});
  
  const userData = {
    authProviderId: 'test-123',
    profile: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      isVendor: true,
      academyName: 'John\'s Academy',
      specializations: ['fitness', 'yoga']
    }
  };
  
  const user = new User(userData);
  const savedUser = await user.save();
  
  assert.ok(savedUser._id, 'User should have an ID');
  assert.strictEqual(savedUser.profile.fullName, 'John Doe');
  assert.strictEqual(savedUser.profile.isVendor, true);
});

test('Event model validation', async () => {
  // Clean up and create test user
  await Event.deleteMany({});
  await User.deleteMany({});
  
  const user = await User.create({
    authProviderId: 'vendor-123',
    profile: {
      fullName: 'Jane Vendor',
      email: 'jane@example.com',
      isVendor: true,
      academyName: 'Jane\'s Studio'
    }
  });
  
  const eventData = {
    vendorId: user._id,
    title: 'Morning Yoga Class',
    description: 'Relaxing yoga session for beginners',
    location: '123 Main St',
    startsAt: new Date('2025-09-15T09:00:00Z'),
    endsAt: new Date('2025-09-15T10:00:00Z'),
    capacity: 20,
    priceCents: 2500,
    status: 'published',
    tags: ['yoga', 'beginner']
  };
  
  const event = new Event(eventData);
  const savedEvent = await event.save();
  
  assert.ok(savedEvent._id, 'Event should have an ID');
  assert.strictEqual(savedEvent.title, 'Morning Yoga Class');
  assert.strictEqual(savedEvent.capacity, 20);
});

test('Booking service - successful booking', async () => {
  // Clean up and create test data
  await Booking.deleteMany({});
  await Event.deleteMany({});
  await User.deleteMany({});
  
  const vendor = await User.create({
    authProviderId: 'vendor-123',
    profile: { fullName: 'Vendor', email: 'vendor@example.com', isVendor: true }
  });
  
  const customer = await User.create({
    authProviderId: 'customer-123',
    profile: { fullName: 'Customer', email: 'customer@example.com' }
  });
  
  const event = await Event.create({
    vendorId: vendor._id,
    title: 'Test Event',
    startsAt: new Date('2025-09-15T10:00:00Z'),
    endsAt: new Date('2025-09-15T11:00:00Z'),
    capacity: 2,
    status: 'published'
  });
  
  const booking = await bookEvent({
    eventId: event._id,
    userId: customer._id,
    paymentRef: 'payment-123'
  });
  
  assert.ok(booking._id, 'Booking should have an ID');
  assert.strictEqual(booking.status, 'confirmed');
  assert.strictEqual(booking.paymentRef, 'payment-123');
});

test('Booking service - waitlist when at capacity', async () => {
  // Use existing event from previous test
  const event = await Event.findOne({ title: 'Test Event' });
  const customer2 = await User.create({
    authProviderId: 'customer2-123',
    profile: { fullName: 'Customer 2', email: 'customer2@example.com' }
  });
  
  const customer3 = await User.create({
    authProviderId: 'customer3-123',
    profile: { fullName: 'Customer 3', email: 'customer3@example.com' }
  });
  
  // Book second slot (should be confirmed)
  const booking2 = await bookEvent({
    eventId: event._id,
    userId: customer2._id
  });
  
  assert.strictEqual(booking2.status, 'confirmed');
  
  // Book third slot (should be waitlisted)
  const booking3 = await bookEvent({
    eventId: event._id,
    userId: customer3._id
  });
  
  assert.strictEqual(booking3.status, 'waitlisted');
});

test('Cancel booking service', async () => {
  const booking = await Booking.findOne({ status: 'confirmed' });
  const waitlistedBooking = await Booking.findOne({ status: 'waitlisted' });
  
  const result = await cancelBooking({
    bookingId: booking._id,
    byUserId: booking.userId
  });
  
  assert.strictEqual(result.cancelled.status, 'cancelled');
  assert.ok(result.promoted, 'Should promote waitlisted booking');
  assert.strictEqual(result.promoted.status, 'confirmed');
});

test('Close database connection', async () => {
  await mongoose.connection.close();
  assert.ok(mongoose.connection.readyState === 0, 'Database should be disconnected');
});
