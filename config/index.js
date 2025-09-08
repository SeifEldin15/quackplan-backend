export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/quackplan',
  jwtSecret: process.env.JWT_SECRET ?? 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigins: (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*']).map(o => o.trim())
};
