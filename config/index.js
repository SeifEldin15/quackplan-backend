export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
<<<<<<< HEAD
  mongoUri: process.env.MONGODB_URI ?? 'mongodb+srv://quackplan1_db_user:ZxbFz6ZnEVkKJZ2g@cluster0.qw8ugxe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
=======
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/quackplan',
>>>>>>> b59362a7322d1e813d3d6ff22e5a1faa5eb2bb95
  jwtSecret: process.env.JWT_SECRET ?? 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigins: (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*']).map(o => o.trim()),
  // payments removed
};
