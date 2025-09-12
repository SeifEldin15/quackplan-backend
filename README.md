# QuackPlan API 🦆

A comprehensive event planning and booking system built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Management**: Create and manage user profiles with vendor capabilities
- **Event Management**: Create, update, and manage events with capacity limits
- **Smart Booking System**: Automatic capacity management with waitlisting
- **Personal Calendar**: Private events and scheduling for users
- **Notification System**: Email, SMS, and push notification scheduling
- **Advanced Filtering**: Search and filter events by various criteria

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd d:\Projects\quackplan
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   # Allow your frontend origin(s), comma-separated. Use * only for local dev.
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/quackplan
   JWT_SECRET=replace-with-a-strong-secret
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

4. **Start MongoDB** (if using local installation):
   ```bash
   mongod
   ```

5. **Start the server**:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

### Frontend Quickstart (test and integrate fast)

Use this minimal flow to create a user, log in, and call protected APIs from your frontend.

1) Start the API and MongoDB
```bash
npm run dev
# API will print Health URL and port; default http://localhost:3000
```

2) Register a user (customer or vendor)
```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "Str0ngP@ss1",
    "userType": "customer",
    "profile": {"fullName": "User One"}
  }'
```

3) Login and get JWT
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com", "password": "Str0ngP@ss1"}' \
  | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d.toString()).token)}catch(e){}})")
echo $TOKEN
```

4) Call an authenticated endpoint
```bash
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

5) Typical frontend request example (fetch)
```js
// Login
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user1@example.com', password: 'Str0ngP@ss1' })
});
const { token, user } = await res.json();

// Use token for protected calls
const me = await fetch('http://localhost:3000/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());
```

6) Creating events (vendor only)
- Register/login as `userType: "vendor"`
- Use the token to create an event:
```bash
curl -s -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Yoga",
    "startsAt": "2025-09-15T08:00:00Z",
    "endsAt": "2025-09-15T09:00:00Z",
    "capacity": 20,
    "visibility": "public",
    "status": "published"
  }'
```

7) Booking an event (customer)
```bash
curl -s -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId": "<EVENT_ID_FROM_PREVIOUS_RESPONSE>"}'
```

Notes:
- Set `CORS_ORIGINS` to your frontend dev URL (e.g., http://localhost:5173).
- All protected routes require `Authorization: Bearer <JWT>`.
- Profile images are served from `/uploads`.

### Quick test with api.js

`api.js` provides a minimal boot for local testing (mounts all routes and serves `/uploads`).

1. Create `.env` (optional; defaults used if missing):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/quackplan
JWT_SECRET=dev_secret_change_me
JWT_EXPIRES_IN=7d
```

2. Run:
```bash
node api.js
```

3. Health:
```http
GET /health
```

> Note: Bookings use MongoDB transactions. Ensure MongoDB runs as a replica set (even single-node RS) for `bookEvent` and `cancelBooking` to work reliably.

## 🧪 Testing

### Schema Tests (No MongoDB required)
```bash
node test-schemas.js
```

### Full Integration Tests (MongoDB required)
```bash
npm test
```

### Test Server (API endpoints without database)
```bash
node server-test.js
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /health
```

## 🔗 API Endpoints

### Users API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users with optional filtering |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/auth/register` | Register new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

#### Query Parameters for GET /api/users:
- `isVendor`: Filter by vendor status (true/false)
- `limit`: Number of results per page (default: 20)
- `page`: Page number (default: 1)

#### Example Registration:
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
    "specializations": ["fitness", "yoga", "pilates"]
  }
}
```

### Events API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events with filtering |
| GET | `/api/events/:id` | Get event by ID |
| POST | `/api/events` | Create new event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |

#### Query Parameters for GET /api/events:
- `vendorId`: Filter by vendor ID
- `status`: Filter by status (draft/published/cancelled)
- `visibility`: Filter by visibility (public/unlisted/private)
- `tags`: Filter by tags (comma-separated)
- `search`: Text search in title, description, and tags
- `startDate`: Filter events starting after this date
- `endDate`: Filter events starting before this date
- `limit`: Number of results per page (default: 20)
- `page`: Page number (default: 1)

#### Example Event Creation:
```json
{
  "vendorId": "vendor-id-here",
  "title": "Morning Yoga Session",
  "description": "Start your day with a relaxing yoga session",
  "location": "Central Park, New York",
  "startsAt": "2025-09-15T08:00:00Z",
  "endsAt": "2025-09-15T09:30:00Z",
  "capacity": 25,
  "priceCents": 3000,
  "visibility": "public",
  "status": "published",
  "tags": ["yoga", "morning", "beginner-friendly"]
}
```

### Bookings API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | Get all bookings with filtering |
| GET | `/api/bookings/:id` | Get booking by ID |
| POST | `/api/bookings` | Book an event (uses smart booking service) |
| PUT | `/api/bookings/:id` | Update booking status |
| DELETE | `/api/bookings/:id` | Cancel booking (promotes waitlisted users) |

#### Smart Booking Features:
- **Automatic Capacity Management**: Bookings are confirmed if space available, waitlisted if at capacity
- **Waitlist Promotion**: When a booking is cancelled, the oldest waitlisted user is automatically promoted
- **Duplicate Prevention**: Users cannot book the same event multiple times

#### Query Parameters for GET /api/bookings:
- `eventId`: Filter by event ID
- `userId`: Filter by user ID
- `status`: Filter by status (confirmed/waitlisted/cancelled/noshow/checked_in)
- `limit`: Number of results per page (default: 20)
- `page`: Page number (default: 1)

#### Example Booking Creation:
```json
{
  "eventId": "event-id-here",
  "userId": "user-id-here"
}
```

### Personal Events API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/personal-events` | Get personal events (JWT; owner-only) |
| GET | `/api/personal-events/:id` | Get personal event by ID |
| POST | `/api/personal-events` | Create new personal event |
| PUT | `/api/personal-events/:id` | Update personal event |
| DELETE | `/api/personal-events/:id` | Delete personal event |

### Notifications API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications with filtering |
| GET | `/api/notifications/:id` | Get notification by ID |
| POST | `/api/notifications` | Create new notification |
| PUT | `/api/notifications/:id` | Update notification |
| POST | `/api/notifications/:id/mark-sent` | Mark as sent |
| DELETE | `/api/notifications/:id` | Delete notification |

#### Notification Types:
- `email`: Email notifications
- `push`: Push notifications
- `sms`: SMS notifications

## 📨 Postman Collection

If you prefer Postman, you can use the generated endpoints list from the helper below, or import your own collection.

1. **Collection**: `QuackPlan-API.postman_collection.json`
2. **Environment**: `QuackPlan-Environment.postman_environment.json`

### Alternative: Print endpoints with `api-guide.js`

You can list all available endpoints from the repo without opening Postman:
```bash
node api-guide.js
```
Set a base URL:
```bash
BASE_URL=http://localhost:3000 node api-guide.js
```

### How to Import Postman files:
1. Open Postman
2. Click "Import" button
3. Select both JSON files from the `postman/` folder
4. Set the "QuackPlan Environment" as your active environment
5. Update the environment variables with real IDs after creating test data

## 🗂️ Project Structure

```
quackplan/
├── models/                 # MongoDB schemas
│   ├── User.js            # User profiles and vendor info
│   ├── Event.js           # Event management
│   ├── Booking.js         # Booking system
│   ├── PersonalEvent.js   # Personal calendar events
│   └── Notification.js    # Notification system
├── services/              # Business logic
│   ├── bookEvent.js       # Smart booking service
│   └── cancelBooking.js   # Booking cancellation with waitlist promotion
├── routes/                # API endpoints
│   ├── users.js           # User management routes
│   ├── events.js          # Event management routes
│   ├── bookings.js        # Booking system routes
│   ├── personalEvents.js  # Personal calendar routes
│   └── notifications.js   # Notification routes
├── postman/               # API documentation
│   ├── QuackPlan-API.postman_collection.json
│   └── QuackPlan-Environment.postman_environment.json
├── db.js                  # Database connection
├── server.js              # Main application server
├── test.js                # Integration tests
├── test-schemas.js        # Schema validation tests
├── server-test.js         # Test server without database
└── package.json           # Dependencies and scripts
```

## 🔧 Key Services

### Book Event Service (`services/bookEvent.js`)
- Handles event booking with transaction support
- Automatically manages capacity and waitlisting
- Prevents duplicate bookings
- Returns appropriate status (confirmed/waitlisted)

### Cancel Booking Service (`services/cancelBooking.js`)
- Cancels existing bookings
- Automatically promotes waitlisted users
- Returns both cancelled and promoted booking information
- Maintains event capacity integrity

## 🚦 Error Handling

The API includes comprehensive error handling:
- **400 Bad Request**: Invalid input data or business logic violations
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server or database errors

## 🔐 Data Validation

All models include:
- Required field validation
- Data type validation
- Enum validation for status fields
- Custom validation rules
- Unique constraints where appropriate

## 📈 Performance Features

- Database indexing on frequently queried fields
- Pagination on all list endpoints
- Text search capabilities on events
- Efficient relationship population
- Connection pooling with MongoDB

## 🎯 Usage Examples

### Complete Workflow Example:

1. **Create a vendor user**:
   ```bash
   POST /api/users
   ```

2. **Create an event**:
   ```bash
   POST /api/events
   ```

3. **Create a customer user**:
   ```bash
   POST /api/users
   ```

4. **Book the event**:
   ```bash
   POST /api/bookings
   ```

5. **Check booking status**:
   ```bash
   GET /api/bookings?userId=customer-id
   ```

6. **Cancel if needed** (promotes waitlisted users):
   ```bash
   DELETE /api/bookings/booking-id
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

**Happy Planning! 🦆**
