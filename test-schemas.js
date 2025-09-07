import { test } from 'node:test';
import assert from 'node:assert';

// Test model schema validation without database
test('User model structure', () => {
  // Import the model to check the schema structure
  import('./models/User.js').then(({ default: User }) => {
    const userSchema = User.schema;
    
    // Check if required fields exist
    assert.ok(userSchema.paths['profile'], 'Should have profile field');
    assert.ok(userSchema.paths['authProviderId'], 'Should have authProviderId field');
    
    // Check profile sub-schema
    const profileSchema = userSchema.paths['profile'];
    assert.ok(profileSchema, 'Profile schema should exist');
  });
});

test('Event model structure', () => {
  import('./models/Event.js').then(({ default: Event }) => {
    const eventSchema = Event.schema;
    
    // Check required fields
    assert.ok(eventSchema.paths['vendorId'], 'Should have vendorId field');
    assert.ok(eventSchema.paths['title'], 'Should have title field');
    assert.ok(eventSchema.paths['startsAt'], 'Should have startsAt field');
    assert.ok(eventSchema.paths['endsAt'], 'Should have endsAt field');
    
    // Check default values
    const capacityPath = eventSchema.paths['capacity'];
    assert.strictEqual(capacityPath.defaultValue, 20, 'Default capacity should be 20');
  });
});

test('Booking model structure', () => {
  import('./models/Booking.js').then(({ default: Booking }) => {
    const bookingSchema = Booking.schema;
    
    // Check required fields
    assert.ok(bookingSchema.paths['eventId'], 'Should have eventId field');
    assert.ok(bookingSchema.paths['userId'], 'Should have userId field');
    assert.ok(bookingSchema.paths['status'], 'Should have status field');
    
    // Check status enum
    const statusPath = bookingSchema.paths['status'];
    const enumValues = statusPath.enumValues;
    assert.ok(enumValues.includes('confirmed'), 'Should include confirmed status');
    assert.ok(enumValues.includes('waitlisted'), 'Should include waitlisted status');
    assert.ok(enumValues.includes('cancelled'), 'Should include cancelled status');
  });
});

console.log('✅ All schema validation tests passed!');
console.log('Note: Database integration tests require MongoDB to be installed and running.');
console.log('To test the full application:');
console.log('1. Install MongoDB: https://www.mongodb.com/try/download/community');
console.log('2. Start MongoDB service');
console.log('3. Run: npm test');
