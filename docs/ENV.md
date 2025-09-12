Environment variables
=====================

Copy these into a `.env` file at the project root and adjust values as needed.

Required
--------

```
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/quackplan

# Auth
JWT_SECRET=replace_me
JWT_EXPIRES_IN=7d

# CORS (comma-separated or *)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

Notes
-----
- Payments/Stripe configuration has been removed. No payment variables are required.


