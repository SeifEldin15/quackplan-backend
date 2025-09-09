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

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CURRENCY=usd
STRIPE_SUCCESS_URL=http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:3000/payment/cancel
```

Notes
-----
- Obtain `STRIPE_SECRET_KEY` from your Stripe dashboard.
- Generate `STRIPE_WEBHOOK_SECRET` by running a local webhook forwarder, e.g. `stripe listen --forward-to localhost:3000/webhooks/stripe`.
- `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` should point to frontend routes.


