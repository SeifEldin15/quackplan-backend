// QuackPlan API Guide
// Usage: node api-guide.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const endpoints = [
  // Health
  {
    group: 'Health',
    method: 'GET',
    url: `${BASE_URL}/health`,
    auth: 'none',
    description: 'API health check',
  },

  // Payments
  {
    group: 'Payments',
    method: 'POST',
    url: `${BASE_URL}/api/payments/checkout`,
    auth: 'Bearer JWT',
    description: 'Create Stripe Checkout session (or immediate booking for free events)',
    body: { eventId: 'string (required)' }
  },
  {
    group: 'Payments',
    method: 'POST',
    url: `${BASE_URL}/webhooks/stripe`,
    auth: 'none',
    description: 'Stripe webhook endpoint (verifies signature and confirms booking)'
  },

  // Authentication
  {
    group: 'Auth',
    method: 'POST',
    url: `${BASE_URL}/api/auth/register`,
    auth: 'none',
    description: 'Register new user (customer or vendor)',
    body: {
      email: 'string (required)',
      password: 'string (required, min 6, A-Z, a-z, 0-9)',
      userType: "'customer' | 'vendor' (required)",
      profile: 'object (optional, merged to profile)'
    }
  },
  {
    group: 'Auth',
    method: 'POST',
    url: `${BASE_URL}/api/auth/login`,
    auth: 'none',
    description: 'Login and receive JWT',
    body: { email: 'string (required)', password: 'string (required)' }
  },
  {
    group: 'Auth',
    method: 'GET',
    url: `${BASE_URL}/api/auth/me`,
    auth: 'Bearer JWT',
    description: 'Get current authenticated user profile'
  },
  {
    group: 'Auth',
    method: 'PUT',
    url: `${BASE_URL}/api/auth/profile`,
    auth: 'Bearer JWT',
    description: 'Update authenticated user profile',
    body: { profile: 'object (partial profile fields)' }
  },
  {
    group: 'Auth',
    method: 'PUT',
    url: `${BASE_URL}/api/auth/change-password`,
    auth: 'Bearer JWT',
    description: 'Change password',
    body: { currentPassword: 'string', newPassword: 'string' }
  },
  {
    group: 'Auth',
    method: 'POST',
    url: `${BASE_URL}/api/auth/logout`,
    auth: 'Bearer JWT',
    description: 'Client-side logout (informational)'
  },
  {
    group: 'Auth',
    method: 'GET',
    url: `${BASE_URL}/api/auth/verify-token`,
    auth: 'Bearer JWT',
    description: 'Verify token validity'
  },
  {
    group: 'Auth',
    method: 'PUT',
    url: `${BASE_URL}/api/auth/profile/picture`,
    auth: 'Bearer JWT',
    description: 'Upload or update profile picture',
    body: { 'FormData': "picture: File (.png,.jpg,.jpeg,.webp)" }
  },

  // Users
  {
    group: 'Users',
    method: 'GET',
    url: `${BASE_URL}/api/users`,
    auth: 'optional',
    description: 'List users/vendors (public browsing)',
    query: {
      userType: "'customer' | 'vendor'",
      isVendor: "'true' | 'false' (legacy)",
      verificationStatus: "e.g. 'verified' (vendors)",
      search: 'text search in name/academy',
      limit: 'number (default 20)',
      page: 'number (default 1)'
    }
  },
  {
    group: 'Users',
    method: 'GET',
    url: `${BASE_URL}/api/users/:id`,
    auth: 'optional',
    description: 'Get public user profile by ID'
  },
  {
    group: 'Users',
    method: 'PUT',
    url: `${BASE_URL}/api/users/:id`,
    auth: 'Bearer JWT',
    description: 'Update own user (self only)',
    body: { '(varies)': 'partial fields allowed' }
  },
  {
    group: 'Users',
    method: 'DELETE',
    url: `${BASE_URL}/api/users/:id`,
    auth: 'Bearer JWT',
    description: 'Deactivate (soft delete) own account'
  },

  // Events
  {
    group: 'Events',
    method: 'GET',
    url: `${BASE_URL}/api/events`,
    auth: 'optional',
    description: 'List events with filtering',
    query: {
      vendorId: 'string',
      status: "e.g. 'published'",
      visibility: "e.g. 'public'",
      tags: 'comma-separated list',
      search: 'text search',
      startDate: 'ISO date',
      endDate: 'ISO date',
      limit: 'number (default 20)',
      page: 'number (default 1)'
    }
  },
  {
    group: 'Events',
    method: 'GET',
    url: `${BASE_URL}/api/events/:id`,
    auth: 'none',
    description: 'Get event by ID'
  },
  {
    group: 'Events',
    method: 'POST',
    url: `${BASE_URL}/api/events`,
    auth: 'Bearer JWT (vendor)',
    description: 'Create new event (vendor only)',
    body: {
      title: 'string (required)',
      startsAt: 'ISO date (required)',
      endsAt: 'ISO date (required)',
      '(...)': 'other event fields'
    }
  },
  {
    group: 'Events',
    method: 'PUT',
    url: `${BASE_URL}/api/events/:id`,
    auth: 'Bearer JWT (vendor & owner)',
    description: 'Update event'
  },
  {
    group: 'Events',
    method: 'DELETE',
    url: `${BASE_URL}/api/events/:id`,
    auth: 'Bearer JWT (vendor & owner)',
    description: 'Delete event'
  },

  // Bookings
  {
    group: 'Bookings',
    method: 'GET',
    url: `${BASE_URL}/api/bookings`,
    auth: 'Bearer JWT',
    description: 'List bookings with filtering',
    query: {
      eventId: 'string',
      userId: 'string',
      status: "'confirmed'|'waitlisted'|'cancelled'",
      limit: 'number (default 20)',
      page: 'number (default 1)'
    }
  },
  {
    group: 'Bookings',
    method: 'GET',
    url: `${BASE_URL}/api/bookings/:id`,
    auth: 'none',
    description: 'Get booking by ID'
  },
  {
    group: 'Bookings',
    method: 'POST',
    url: `${BASE_URL}/api/bookings`,
    auth: 'Bearer JWT',
    description: 'Create booking for authenticated user',
    body: { eventId: 'string (required)', paymentRef: 'string (optional)' }
  },
  {
    group: 'Bookings',
    method: 'PUT',
    url: `${BASE_URL}/api/bookings/:id`,
    auth: 'none',
    description: 'Update booking status',
    body: { status: "'confirmed'|'waitlisted'|'cancelled' (required)" }
  },
  {
    group: 'Bookings',
    method: 'DELETE',
    url: `${BASE_URL}/api/bookings/:id`,
    auth: 'none',
    description: 'Cancel booking',
    body: { byUserId: 'string (required for authorization in service)' }
  },

  // Personal Events
  {
    group: 'Personal Events',
    method: 'GET',
    url: `${BASE_URL}/api/personal-events`,
    auth: 'Bearer JWT',
    description: 'List personal events for authenticated user',
    query: { startDate: 'ISO date', endDate: 'ISO date', limit: 'number', page: 'number' }
  },
  {
    group: 'Personal Events',
    method: 'GET',
    url: `${BASE_URL}/api/personal-events/:id`,
    auth: 'Bearer JWT (owner only)',
    description: 'Get personal event by ID'
  },
  {
    group: 'Personal Events',
    method: 'POST',
    url: `${BASE_URL}/api/personal-events`,
    auth: 'Bearer JWT',
    description: 'Create personal event',
    body: { title: 'string', startsAt: 'ISO date', endsAt: 'ISO date', notes: 'string' }
  },
  {
    group: 'Personal Events',
    method: 'PUT',
    url: `${BASE_URL}/api/personal-events/:id`,
    auth: 'Bearer JWT (owner only)',
    description: 'Update personal event'
  },
  {
    group: 'Personal Events',
    method: 'DELETE',
    url: `${BASE_URL}/api/personal-events/:id`,
    auth: 'Bearer JWT (owner only)',
    description: 'Delete personal event'
  },

  // Notifications
  {
    group: 'Notifications',
    method: 'GET',
    url: `${BASE_URL}/api/notifications`,
    auth: 'none',
    description: 'List notifications with filtering',
    query: { userId: 'string', kind: 'string', sent: "'true'|'false'", limit: 'number', page: 'number' }
  },
  {
    group: 'Notifications',
    method: 'GET',
    url: `${BASE_URL}/api/notifications/:id`,
    auth: 'none',
    description: 'Get notification by ID'
  },
  {
    group: 'Notifications',
    method: 'POST',
    url: `${BASE_URL}/api/notifications`,
    auth: 'none',
    description: 'Create notification',
    body: { '(varies)': 'see Notification model' }
  },
  {
    group: 'Notifications',
    method: 'PUT',
    url: `${BASE_URL}/api/notifications/:id`,
    auth: 'none',
    description: 'Update notification (e.g., mark as sent)',
    body: { sentAt: 'ISO date (optional)', '(...)': 'other fields' }
  },
  {
    group: 'Notifications',
    method: 'DELETE',
    url: `${BASE_URL}/api/notifications/:id`,
    auth: 'none',
    description: 'Delete notification'
  },
  {
    group: 'Notifications',
    method: 'POST',
    url: `${BASE_URL}/api/notifications/:id/mark-sent`,
    auth: 'none',
    description: 'Mark notification as sent'
  }
];

function printGuide() {
  const byGroup = endpoints.reduce((acc, ep) => {
    acc[ep.group] = acc[ep.group] || [];
    acc[ep.group].push(ep);
    return acc;
  }, {});

  Object.keys(byGroup).sort().forEach((group) => {
    console.log(`\n=== ${group} ===`);
    byGroup[group].forEach((ep) => {
      console.log(`- ${ep.method} ${ep.url}`);
      console.log(`  auth: ${ep.auth}`);
      if (ep.description) console.log(`  desc: ${ep.description}`);
      if (ep.query) console.log(`  query: ${JSON.stringify(ep.query)}`);
      if (ep.body) console.log(`  body: ${JSON.stringify(ep.body)}`);
    });
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  printGuide();
}

export default endpoints;


