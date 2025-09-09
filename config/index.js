export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/quackplan',
  jwtSecret: process.env.JWT_SECRET ?? 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigins: (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*']).map(o => o.trim()),
  seatHoldMinutes: parseInt(process.env.SEAT_HOLD_MINUTES ?? '15', 10),
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    currency: process.env.STRIPE_CURRENCY ?? 'usd',
    successUrl: process.env.STRIPE_SUCCESS_URL ?? 'http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}',
    cancelUrl: process.env.STRIPE_CANCEL_URL ?? 'http://localhost:3000/payment/cancel'
  }
};
