import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';
import personalEventRoutes from './routes/personalEvents.js';
import notificationRoutes from './routes/notifications.js';
import path from 'path';
import { config } from './config/index.js';
// payments removed
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = config.port || 3000;

// Middleware
app.use(helmet());
const allowedOrigins = config.corsOrigins;
app.use(cors({
  origin: function(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: allowedOrigins.includes('*') ? false : true
}));
// Stripe webhooks removed

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded profile pictures statically
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/personal-events', personalEventRoutes);
app.use('/api/notifications', notificationRoutes);
// payments routes removed

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'QuackPlan API is running!' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    status: 'error'
  });
});

// Helper to listen on a port and resolve when bound, reject on error
const listenOnPort = (port) => new Promise((resolve, reject) => {
  const server = app.listen(port);
  server.once('listening', () => resolve(server));
  server.once('error', (err) => reject(err));
});

// Connect to MongoDB and start server with retry on EADDRINUSE
const startServer = async () => {
  let server;
  try {
    const mongoUri = config.mongoUri || 'mongodb://localhost:27017/quackplan';
    const maxDbAttempts = parseInt(process.env.DB_CONNECT_MAX_ATTEMPTS ?? '30', 10);
    let dbAttempt = 0;
    while (true) {
      try {
        await connectDB(mongoUri);
        console.log('Connected to MongoDB');
        break;
      } catch (err) {
        dbAttempt += 1;
        const backoffMs = Math.min(30000, 1000 * Math.pow(2, Math.max(0, dbAttempt - 1)));
        console.error(`MongoDB connection failed (attempt ${dbAttempt}/${maxDbAttempts}): ${err?.message || err}`);
        if (dbAttempt >= maxDbAttempts) {
          throw err;
        }
        console.log(`Retrying MongoDB connection in ${Math.round(backoffMs / 1000)}s...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    let port = Number(PORT) || 3000;
    const maxAttempts = 5;
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        server = await listenOnPort(port);
        console.log(`Server is running on port ${port}`);
        console.log(`Health check: http://localhost:${port}/health`);
        break;
      } catch (err) {
        if (err && err.code === 'EADDRINUSE') {
          attempt += 1;
          console.warn(`Port ${port} is in use. Retrying on port ${port + 1} (attempt ${attempt}/${maxAttempts})...`);
          port += 1;
          continue;
        }
        throw err;
      }
    }

    if (!server) {
      throw new Error(`Failed to bind to a port after ${maxAttempts} attempts`);
    }

    // Graceful shutdown
    const shutdown = () => {
      console.log('Shutting down server...');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
