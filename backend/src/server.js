const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');
const tallyWebSocketService = require('./services/tallyWebSocketService');
const tallySyncService = require('./services/tallySyncService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const voucherRoutes = require('./routes/vouchers');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const inventoryRoutes = require('./routes/inventory');
const paymentRoutes = require('./routes/payments');
const gstRoutes = require('./routes/gst');
const tallyRoutes = require('./routes/tally');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          'https://finsync-frontend-62084a54426d.herokuapp.com',
          'https://finsync-frontend-nextjs.herokuapp.com',
          'https://your-domain.com',
          process.env.FRONTEND_URL,
          ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
        ].filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

    if (allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization
app.use(mongoSanitize());
app.use(hpp());

// Compression
app.use(compression());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/tally', tallyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`FinSync360 Backend Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Initialize Tally WebSocket service
    tallyWebSocketService.initialize(server, '/tally-agent');
    logger.info('Tally WebSocket service initialized');

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Shutting down gracefully...');

      // Stop Tally sync service
      tallySyncService.stopAllJobs();

      // Close WebSocket connections
      tallyWebSocketService.shutdown();

      server.close(() => {
        logger.info('HTTP server closed');
        mongoose.connection.close(() => {
          logger.info('Database connection closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      gracefulShutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      gracefulShutdown();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown();
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
