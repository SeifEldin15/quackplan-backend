# QuackPlan API Guide

- Base URL: `http://localhost:3000`
- Auth: Bearer JWT in `Authorization: Bearer <token>` for protected routes
- Content-Type: `application/json` unless noted

## Health
- GET `/health` — API liveness probe

## Auth
- POST `/api/auth/register` — Register user
- POST `/api/auth/login` — Login and get JWT
- GET `/api/auth/me` — Current user profile
- PUT `/api/auth/profile` — Update profile
- PUT `/api/auth/change-password` — Change password
- PUT `/api/auth/profile/picture` — Upload profile picture (multipart/form-data; field: `picture`)
- POST `/api/auth/logout` — Client-side token removal helper
- GET `/api/auth/verify-token` — Validate token

### Register
POST `/api/auth/register`
Request body:
```json
{
  "email": "john.doe@example.com",
  "password": "Str0ngPass!",
  "userType": "vendor",
  "profile": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "dob": "1990-01-01",
    "location": "New York, NY",
    "academyName": "John's Fitness Studio",
    "specializations": ["fitness", "yoga"]
  }
}
```

### Login
POST `/api/auth/login`
Request body:
```json
{ "email": "john.doe@example.com", "password": "Str0ngPass!" }
```

### Update profile
PUT `/api/auth/profile`
Request body (partial):
```json
{
  "profile": {
    "fullName": "Johnathan Doe",
    "location": "NYC"
  }
}
```

### Change password
PUT `/api/auth/change-password`
```json
{ "currentPassword": "Str0ngPass!", "newPassword": "An0therStr0ngPass!" }
```

## Users
- GET `/api/users` — List users (public)
  - query: `userType`, `isVendor`, `verificationStatus`, `search`, `limit`, `page`
- GET `/api/users/:id` — Get user by id (public; sensitive fields hidden)
- PUT `/api/users/:id` — Update self (auth)
- DELETE `/api/users/:id` — Deactivate self (auth)

### List users example
GET `/api/users?userType=vendor&search=yoga&limit=10&page=1`

### Update self
PUT `/api/users/:id`
```json
{ "profile": { "bio": "Coach and trainer" } }
```

## Events
- GET `/api/events` — List events (public)
  - query: `vendorId`, `status`, `visibility`, `tags`, `search`, `startDate`, `endDate`, `limit`, `page`
- GET `/api/events/:id` — Get event by id (public)
- GET `/api/events/mine` — List events created by the authenticated vendor (auth vendor)
  - query: `status`, `visibility`, `tags`, `startDate`, `endDate`, `limit`, `page`
- POST `/api/events` — Create event (auth vendor)
- PUT `/api/events/:id` — Update event (auth vendor owner)
- DELETE `/api/events/:id` — Delete event (auth vendor owner)

### Create event
POST `/api/events`
```json
{
  "title": "Morning Yoga Session",
  "description": "Relaxing yoga",
  "location": "Central Park, New York",
  "startsAt": "2025-09-15T08:00:00.000Z",
  "endsAt": "2025-09-15T09:30:00.000Z",
  "capacity": 25,
  "priceCents": 3000,
  "visibility": "public",
  "status": "published",
  "tags": ["yoga", "morning"]
}
```

### Update event
PUT `/api/events/:id`
```json
{ "title": "Updated Yoga Session", "capacity": 30 }
```

### My vendor events
GET `/api/events/mine?status=published&startDate=2025-01-01&limit=20&page=1`

## Bookings
- GET `/api/bookings` — List bookings (auth)
  - query: `eventId`, `userId`, `status`, `limit`, `page`
- GET `/api/bookings/:id` — Get booking (auth)
- GET `/api/bookings/mine` — List bookings for the authenticated user (auth)
  - query: `status`, `limit`, `page`
- POST `/api/bookings` — Create booking (auth)
- PUT `/api/bookings/:id` — Update booking status (auth)
- DELETE `/api/bookings/:id` — Cancel booking (auth)

### Create booking
POST `/api/bookings`
```json
{ "eventId": "<eventId>", "userId": "<userId>", "paymentRef": "pay_123" }
```

### Update booking status
PUT `/api/bookings/:id`
```json
{ "status": "cancelled" }
```

### My bookings
GET `/api/bookings/mine?status=confirmed&limit=20&page=1`

## Personal Events
- GET `/api/personal-events` — List personal events (auth)
- GET `/api/personal-events/:id` — Get one (auth owner)
- POST `/api/personal-events` — Create (auth)
- POST `/api/personal-events/from-event` — Add a published Event to personal calendar (auth)
- GET `/api/personal-events/overview` — Unified personal view; includes vendor-created Events for vendors (auth)
- PUT `/api/personal-events/:id` — Update (auth owner)
- DELETE `/api/personal-events/:id` — Delete (auth owner)

### Create personal event
POST `/api/personal-events`
```json
{
  "title": "Dentist Appointment",
  "startsAt": "2025-09-15T13:00:00.000Z",
  "endsAt": "2025-09-15T14:00:00.000Z",
  "notes": "Bring insurance card"
}
```

### Add event to personal calendar
POST `/api/personal-events/from-event`
```json
{ "eventId": "<EVENT_ID>", "notes": "Optional note" }
```

### Personal overview (merged calendar)
GET `/api/personal-events/overview?startDate=2025-01-01&endDate=2025-12-31`

## Notifications
- GET `/api/notifications` — List notifications (auth owner)
- GET `/api/notifications/:id` — Get by id (auth owner)
- POST `/api/notifications` — Create (auth owner)
- PUT `/api/notifications/:id` — Update (auth owner)
- POST `/api/notifications/:id/mark-sent` — Mark as sent (auth owner)
- DELETE `/api/notifications/:id` — Delete (auth owner)

### Create notification
POST `/api/notifications`
```json
{
  "type": "email",
  "to": "john.doe@example.com",
  "subject": "Your booking is confirmed",
  "body": "Thanks for booking!",
  "sendAt": "2025-09-14T10:00:00.000Z",
  "metadata": { "bookingId": "<bookingId>" }
}
```

---

## Postman Guide

1. Import collection: `postman/QuackPlan-API.postman_collection.json`
2. Import environment: `postman/QuackPlan-Environment.postman_environment.json`
3. Set `baseUrl` and (after login) set `token`
4. For protected routes, the collection uses `Authorization: Bearer {{token}}`
5. Use folder order: Auth → Users → Events → Bookings → Personal Events → Notifications

## Export this guide to PDF
- Option A (VS Code/Browser): Open this file and Print to PDF
- Option B (CLI):
  - `npm i -D md-to-pdf`
  - `npx md-to-pdf docs/API-Guide.md docs/API-Guide.pdf`
