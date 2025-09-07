import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'QuackPlan API is running!',
    timestamp: new Date().toISOString(),
    environment: 'test'
  });
});

// Mock route for testing
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API endpoints are working!',
    availableRoutes: [
      'GET /health',
      'GET /api/users',
      'POST /api/users',
      'GET /api/events',
      'POST /api/events',
      'GET /api/bookings',
      'POST /api/bookings'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: err.message || 'Something went wrong!',
    status: 'error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    status: 'error'
  });
});

console.log('🚀 Starting test server...');
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log('📝 Note: Full database functionality requires MongoDB');
});

export default app;
