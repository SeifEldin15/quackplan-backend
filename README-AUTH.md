# QuackPlan API - Complete Authentication System 🔐

## 🎉 **NEW: Authentication & User Management System**

QuackPlan now includes a complete authentication system with user registration, login, and role-based access control!

### 🆕 **What's New**

✅ **User Registration & Login** - Complete JWT-based authentication  
✅ **Role-Based Access** - Customer and Vendor user types with different permissions  
✅ **Secure Password Management** - Bcrypt hashing with strength requirements  
✅ **Profile Management** - Update profiles, change passwords, manage accounts  
✅ **Protected Routes** - API endpoints now require proper authentication  
✅ **Vendor Verification** - Enhanced vendor profiles with verification status  

---

## 🚀 **Quick Start with Authentication**

### 1. **Register as Vendor** (Using sample data from your attachment)
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "melissa.peters@soccergym.com",
  "password": "SecurePass123",
  "userType": "vendor",
  "profile": {
    "fullName": "Melissa Peters",
    "phone": "+1 (305) 555-0188",
    "location": "Miami, Florida – Downtown Sports Center",
    "dob": "1995-05-23",
    "academyName": "Soccer Academy",
    "specializations": ["Soccer Academy", "Soccer Training", "Swimming Classes"],
    "businessAddress": "Downtown Sports Center, Miami, FL",
    "businessPhone": "+1 (305) 555-0188",
    "bio": "Professional soccer trainer with 8+ years of experience"
  }
}
```

### 2. **Login & Get Token**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "melissa.peters@soccergym.com",
  "password": "SecurePass123"
}
```

### 3. **Use Token for Protected Requests**
```bash
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 🔒 **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user (customer or vendor) | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |
| GET | `/api/auth/verify-token` | Verify token validity | Yes |
| POST | `/api/auth/logout` | Logout (client removes token) | Yes |

---

## 👥 **User Types & Permissions**

### **Customer Users**
- ✅ Browse events and vendors
- ✅ Book events
- ✅ Manage personal calendar
- ✅ View booking history
- ❌ Create events
- ❌ Manage other users' bookings

### **Vendor Users**
- ✅ All customer permissions, plus:
- ✅ Create and manage events
- ✅ View event bookings
- ✅ Update business profile
- ✅ Manage academy information
- 🔄 Verification status (pending → verified → rejected)

---

## 🔐 **Security Features**

### **Password Requirements**
- Minimum 6 characters
- At least 1 lowercase letter
- At least 1 uppercase letter  
- At least 1 number
- Bcrypt hashing with salt rounds: 12

### **JWT Tokens**
- 7-day expiration (configurable)
- Secure signing with secret key
- Automatic user validation on protected routes

### **Rate Limiting**
- Authentication endpoints: 5 attempts per 15 minutes
- Prevents brute force attacks

### **Data Protection**
- Passwords never returned in API responses
- Email verification tokens hidden from public
- Sensitive user data filtered based on permissions

---

## 🗂️ **Updated API Endpoints**

### **Events** (Now with Authentication)
- `GET /api/events` - Public browsing (no auth required)
- `POST /api/events` - **Requires vendor authentication**
- `PUT /api/events/:id` - **Only event owner can update**
- `DELETE /api/events/:id` - **Only event owner can delete**

### **Bookings** (Now with Authentication)  
- `GET /api/bookings` - **Requires authentication** (shows user's bookings)
- `POST /api/bookings` - **Requires authentication** (uses authenticated user ID)
- Automatically uses logged-in user's ID (no need to specify userId)

### **Users** (Enhanced)
- `GET /api/users` - Public browsing with privacy controls
- `GET /api/users/:id` - Public profiles (sensitive data hidden)
- User management routes now require proper authentication

---

## 📱 **Postman Collection v2.0**

Import the new collection: `postman/QuackPlan-API-v2.postman_collection.json`

### **New Features:**
- ✅ **Automatic token management** - Login requests automatically set auth token
- ✅ **Pre-configured requests** - Sample data based on your attachment
- ✅ **Test scripts** - Automatically extract and store user/event IDs
- ✅ **Authentication flows** - Complete registration → login → protected requests

### **Collection Variables:**
- `authToken` - JWT token for authentication
- `vendorToken` - Separate token for vendor testing
- `currentUserId` - Logged-in user ID
- `vendorId` - Vendor user ID for testing

---

## 🧪 **Testing**

### **Quick Authentication Tests**
```bash
node test-auth.js
```
Tests authentication features without requiring server startup.

### **Full Integration Tests**  
```bash
npm test
```
Tests complete system including database integration.

### **Schema-Only Tests**
```bash
node test-schemas.js  
```
Tests data models without database connection.

---

## 🔄 **Migration from v1.0**

### **Breaking Changes:**
1. **User Creation**: Use `/api/auth/register` instead of `/api/users`
2. **Authentication Required**: Most endpoints now require JWT token
3. **User ID Automatic**: Bookings use authenticated user's ID automatically

### **Backward Compatibility:**
- ✅ Old user profiles still work (authProviderId field maintained)
- ✅ Existing data structure preserved
- ✅ All v1.0 endpoints still available with added security

---

## 🎯 **Real-World Usage Examples**

### **Complete User Journey:**

1. **Vendor registers** → Gets JWT token
2. **Vendor creates events** → Uses token for authentication  
3. **Customer registers** → Gets JWT token
4. **Customer books event** → System uses customer's authenticated ID
5. **Smart booking system** → Handles capacity and waitlists automatically
6. **Vendor manages bookings** → Views event attendance

### **Melissa Peters Example** (From your attachment):
```javascript
// 1. Register as vendor
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'melissa.peters@soccergym.com',
    password: 'SecurePass123',
    userType: 'vendor',
    profile: {
      fullName: 'Melissa Peters',
      academyName: 'Soccer Academy',
      specializations: ['Soccer Academy', 'Soccer Training', 'Swimming Classes'],
      // ... other profile data
    }
  })
});

const { token, user } = await registerResponse.json();

// 2. Use token for authenticated requests
const createEventResponse = await fetch('/api/events', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    title: 'Advanced Soccer Training',
    // ... event details
  })
});
```

---

## 🚦 **Production Deployment Notes**

### **Environment Variables:**
```env
JWT_SECRET=your-super-secure-secret-key-here
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/quackplan
NODE_ENV=production
```

### **Security Recommendations:**
1. 🔑 Use strong JWT_SECRET (32+ characters, random)
2. 🌐 Enable HTTPS in production
3. 🛡️ Add API rate limiting for all endpoints
4. 📊 Implement logging and monitoring
5. 🔒 Regular security audits

---

## 📈 **System Status**

✅ **Authentication System** - Fully implemented and tested  
✅ **User Registration** - Customer and Vendor support  
✅ **JWT Security** - Token-based authentication  
✅ **Role-Based Access** - Proper permission controls  
✅ **Password Security** - Bcrypt hashing with validation  
✅ **API Protection** - All endpoints secured appropriately  
✅ **Postman Documentation** - Complete v2.0 collection  
✅ **Test Coverage** - Authentication system fully tested  

---

## 🎉 **Ready for Production!**

Your QuackPlan API now has enterprise-grade authentication and is ready for real-world use! 🚀

The system is designed to scale from a simple booking app to a comprehensive event management platform with proper security, user management, and role-based access control.

**Happy Planning!** 🦆
