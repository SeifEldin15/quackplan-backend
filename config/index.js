export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb+srv://quackplan1_db_user:ZxbFz6ZnEVkKJZ2g@cluster0.qw8ugxe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET ?? 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigins: (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*']).map(o => o.trim()),
  // payments removed
};
