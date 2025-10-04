import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import hpp from 'hpp';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import { connectDB } from './config/database.js';
import tallyWebSocketService from './services/tallyWebSocketService.js';
import tallySyncService from './services/tallySyncService.js';
import { swaggerUi, swaggerSpec } from './config/swagger.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import companyRoutes from './routes/companies.js';
import voucherRoutes from './routes/vouchers.js';
import transactionRoutes from './routes/transactions.js';
import inventoryRoutes from './routes/inventory.js';
import paymentRoutes from './routes/payments.js';
import tallyRoutes from './routes/tally.js';

// ES6 module routes will be loaded dynamically
let budgetRoutes, gstRoutes, reportRoutes, notificationRoutes;

// Initialize dotenv
dotenv.config();

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware - Configure Helmet to allow Swagger UI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
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

// Swagger API Documentation
// Serve OpenAPI spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FinSync360 API Documentation',
  customfavIcon: '/favicon.ico'
}));

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                 environment:
 *                   type: string
 *                   example: development
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes (CommonJS)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tally', tallyRoutes);

// ES6 module routes (loaded dynamically in startServer)

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

    // Load ES6 module routes dynamically
    try {
      const budgetModule = await import('./routes/budgets.mjs');
      const gstModule = await import('./routes/gst.mjs');
      const reportModule = await import('./routes/reports.mjs');
      const notificationModule = await import('./routes/notifications.mjs');
      
      budgetRoutes = budgetModule.default;
      gstRoutes = gstModule.default;
      reportRoutes = reportModule.default;
      notificationRoutes = notificationModule.default;
      
      // Mount ES6 module routes
      app.use('/api/budgets', budgetRoutes);
      app.use('/api/gst', gstRoutes);
      app.use('/api/reports', reportRoutes);
      app.use('/api/notifications', notificationRoutes);
      
      logger.info('ES6 module routes loaded successfully');
    } catch (error) {
      logger.error('Error loading ES6 module routes:', error);
      logger.warn('Continuing without ES6 module routes');
    }

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

export default app;
