# 🔐 Production Environment Configuration Guide

This guide covers production environment setup, security configurations, and deployment best practices for FinSync360.

## 🌐 Environment Variables Configuration

### Backend Production Environment

Create a production `.env` file for your backend:

```bash
# Production Environment
NODE_ENV=production
PORT=5000

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finsync360?retryWrites=true&w=majority
REDIS_URL=redis://username:password@hostname:port

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
ENCRYPTION_KEY=your-32-character-encryption-key-here
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-minimum-32-chars

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-app.herokuapp.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx,xls,xlsx

# Payment Gateway - Razorpay
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# WhatsApp Integration - Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-business-email@domain.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com

# GST Network (GSTN) API
GSTN_BASE_URL=https://api.gst.gov.in
GSTN_API_KEY=your_production_gstn_api_key
GSTN_CLIENT_ID=your_gstn_client_id
GSTN_CLIENT_SECRET=your_gstn_client_secret

# Tally Integration
TALLY_SERVER_HOST=your-tally-server.com
TALLY_SERVER_PORT=9000
TALLY_COMPANY_PATH=/path/to/tally/data
TALLY_SYNC_INTERVAL=300000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Monitoring and Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
NEW_RELIC_APP_NAME=FinSync360-Backend

# Backup Configuration
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_PATH=backups/
AWS_S3_BACKUP_BUCKET=your-backup-bucket

# External API Keys
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_api_secret

# Health Check Configuration
HEALTH_CHECK_ENDPOINT=/health
HEALTH_CHECK_TIMEOUT=5000

# SSL Configuration
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/private.key
FORCE_HTTPS=true
```

### Frontend Production Environment

```bash
# Frontend Production Environment
REACT_APP_API_URL=https://your-backend-domain.herokuapp.com/api
REACT_APP_WS_URL=wss://your-backend-domain.herokuapp.com
REACT_APP_APP_NAME=FinSync360
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_TRACKING=true
REACT_APP_ENABLE_CHAT_SUPPORT=true

# Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
REACT_APP_MIXPANEL_TOKEN=your_mixpanel_token

# Error Tracking
REACT_APP_SENTRY_DSN=https://your-frontend-sentry-dsn@sentry.io/project-id

# Payment Configuration
REACT_APP_RAZORPAY_KEY_ID=rzp_live_your_key_id

# Maps Integration
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Build Configuration
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
```

### ML Service Production Environment

```bash
# ML Service Production Environment
DEBUG=false
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=production

# Security
SECRET_KEY=your-ml-service-secret-key-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/finsync360
DATABASE_NAME=finsync360

# Backend API Integration
BACKEND_API_URL=https://your-backend-domain.herokuapp.com/api
BACKEND_API_KEY=your-backend-api-key

# CORS Settings
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-backend-domain.com
ALLOWED_HOSTS=your-ml-domain.herokuapp.com,localhost

# ML Model Configuration
MODEL_STORAGE_PATH=./models/saved
MODEL_RETRAIN_INTERVAL_HOURS=24
MIN_TRAINING_DATA_SIZE=100

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=https://your-ml-sentry-dsn@sentry.io/project-id
```

## 🔒 Security Configuration

### 1. SSL/TLS Configuration

**For Heroku (automatic SSL):**
```bash
# Enable automatic SSL
heroku certs:auto:enable -a your-app-name
```

**For custom domains:**
```bash
# Add custom domain
heroku domains:add your-domain.com -a your-app-name

# Configure DNS
# Add CNAME record: your-domain.com -> your-app-name.herokuapp.com
```

### 2. Security Headers Configuration

Update your backend to include security headers:

```javascript
// backend/src/middleware/security.js
const helmet = require('helmet');

const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
});

module.exports = securityMiddleware;
```

### 3. Database Security

**MongoDB Security:**
```javascript
// Secure MongoDB connection
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  ssl: true,
  sslValidate: true,
  authSource: 'admin',
  retryWrites: true,
  w: 'majority'
};
```

**Redis Security:**
```javascript
// Secure Redis connection
const redisOptions = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};
```

## 🚀 Deployment Configuration

### Heroku Configuration

**Procfile for backend:**
```
web: npm start
worker: node src/workers/backgroundJobs.js
```

**Heroku addons:**
```bash
# MongoDB
heroku addons:create mongolab:sandbox -a your-backend-app

# Redis
heroku addons:create heroku-redis:mini -a your-backend-app

# Logging
heroku addons:create papertrail:choklad -a your-backend-app

# Monitoring
heroku addons:create newrelic:wayne -a your-backend-app

# Scheduler (for cron jobs)
heroku addons:create scheduler:standard -a your-backend-app
```

**Heroku configuration:**
```bash
# Set production environment
heroku config:set NODE_ENV=production -a your-backend-app

# Configure dyno formation
heroku ps:scale web=1 worker=1 -a your-backend-app

# Configure auto-scaling (if needed)
heroku ps:autoscale:enable web --min=1 --max=3 -a your-backend-app
```

### Docker Production Configuration

**Production Dockerfile:**
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

CMD ["npm", "start"]
```

## 📊 Monitoring and Logging

### 1. Application Monitoring

**New Relic configuration:**
```javascript
// newrelic.js
'use strict'

exports.config = {
  app_name: ['FinSync360-Backend'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
}
```

**Sentry configuration:**
```javascript
// Sentry error tracking
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error handler middleware
const sentryErrorHandler = (err, req, res, next) => {
  Sentry.captureException(err);
  next(err);
};

module.exports = sentryErrorHandler;
```

### 2. Logging Configuration

**Winston production configuration:**
```javascript
// logger.js
const winston = require('winston');
const { combine, timestamp, errors, json } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'finsync360-backend' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## 🔄 Backup and Recovery

### Database Backup Strategy

**Automated MongoDB backups:**
```bash
#!/bin/bash
# backup-script.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="finsync360"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
mongodump --uri="$MONGODB_URI" --db=$DB_NAME --out=$BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.tar.gz s3://your-backup-bucket/mongodb/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

**Heroku Scheduler setup:**
```bash
# Add backup job to Heroku Scheduler
heroku addons:create scheduler:standard -a your-backend-app
heroku addons:open scheduler -a your-backend-app

# Add job: ./scripts/backup.sh (daily at 2 AM)
```

## 🔧 Performance Optimization

### 1. Caching Strategy

**Redis caching configuration:**
```javascript
// cache.js
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: process.env.NODE_ENV === 'production',
    rejectUnauthorized: false
  }
});

const cache = {
  async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
};

module.exports = cache;
```

### 2. Database Optimization

**MongoDB indexes:**
```javascript
// Create production indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.companies.createIndex({ userId: 1 });
db.vouchers.createIndex({ companyId: 1, date: -1 });
db.vouchers.createIndex({ voucherNumber: 1, companyId: 1 });
db.inventory.createIndex({ companyId: 1, category: 1 });
db.inventory.createIndex({ companyId: 1, name: "text" });
```

## 🚨 Health Checks and Monitoring

### Health Check Endpoint

```javascript
// healthcheck.js
const mongoose = require('mongoose');
const redis = require('redis');

const healthCheck = async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    services: {}
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      health.services.mongodb = 'connected';
    } else {
      health.services.mongodb = 'disconnected';
      health.status = 'error';
    }

    // Check Redis
    const redisClient = redis.createClient({ url: process.env.REDIS_URL });
    await redisClient.ping();
    health.services.redis = 'connected';
    await redisClient.quit();

  } catch (error) {
    health.services.redis = 'disconnected';
    health.status = 'error';
    health.error = error.message;
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
};

module.exports = healthCheck;
```

---

**🎉 Your production environment is now properly configured and secured!**

Remember to:
1. Regularly update dependencies
2. Monitor application performance
3. Review security configurations
4. Test backup and recovery procedures
5. Keep environment variables secure and up-to-date
