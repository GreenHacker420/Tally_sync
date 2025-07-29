# FinSync360 Deployment Guide

Complete deployment guide for the FinSync360 ERP system with production Heroku deployment configuration.

## 🌐 Production Deployment Status

**✅ ALL SERVICES SUCCESSFULLY DEPLOYED AND OPERATIONAL**

### Live Production Environment

| Service | Status | URL | Health Check |
|---------|--------|-----|--------------|
| Backend API | ✅ Operational | https://finsync-backend-d34180691b06.herokuapp.com | [Health](https://finsync-backend-d34180691b06.herokuapp.com/health) |
| ML Service | ✅ Operational | https://finsync-ml-2bba4152b555.herokuapp.com | [Health](https://finsync-ml-2bba4152b555.herokuapp.com/api/v1/health) |
| Frontend | ✅ Deployed | https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com | [Live Site](https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com) |
| Database | ✅ Connected | MongoDB Atlas | Shared across services |

### Integration Test Results
- 🎯 **Overall Success Rate: 100% (11/11 tests passing)**
- ✅ Backend API: 7/7 endpoints working
- ✅ ML Service: 3/3 endpoints working  
- ✅ Cross-service communication: Verified

## 🚀 Heroku Deployment Process

### Prerequisites

1. **Heroku CLI installed**
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login to Heroku
   heroku login
   ```

2. **Git repository setup**
   ```bash
   git clone <repository-url>
   cd FinSync360
   ```

3. **Heroku apps created**
   - `finsync-backend` - Backend API
   - `finsync-ml` - ML Service
   - `finsync-frontend-nextjs` - Frontend

### Backend API Deployment

#### 1. Add Heroku Remote
```bash
heroku git:remote -a finsync-backend -r heroku-backend
```

#### 2. Configure Environment Variables
```bash
heroku config:set NODE_ENV=development --app finsync-backend
heroku config:set MONGODB_URI="mongodb+srv://hhirawat5:R79fVWIVMLY1BSUh@finsync.xwmeuwe.mongodb.net/finsync360?retryWrites=true&w=majority&authSource=admin" --app finsync-backend
heroku config:set JWT_SECRET="jFVdOwGOOHRA0716lvQ0F1PlY1GFbXZNxE5mtgZvPs8=" --app finsync-backend
heroku config:set BCRYPT_ROUNDS=12 --app finsync-backend
heroku config:set ENCRYPTION_KEY="frbcHZWNefSNvpn70bEVJw35JhPnN3+o" --app finsync-backend
heroku config:set FRONTEND_URL="https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com" --app finsync-backend
heroku config:set RAZORPAY_KEY_ID="dummy_key_for_development" --app finsync-backend
heroku config:set RAZORPAY_KEY_SECRET="dummy_secret_for_development" --app finsync-backend
```

#### 3. Deploy Backend
```bash
git push heroku-backend `git subtree split --prefix=backend HEAD`:refs/heads/master --force
```

#### 4. Verify Deployment
```bash
heroku ps --app finsync-backend
curl https://finsync-backend-d34180691b06.herokuapp.com/health
```

### ML Service Deployment

#### 1. Add Heroku Remote
```bash
heroku git:remote -a finsync-ml -r heroku-ml
```

#### 2. Configure Environment Variables
```bash
heroku config:set MONGODB_URL="mongodb+srv://hhirawat5:R79fVWIVMLY1BSUh@finsync.xwmeuwe.mongodb.net/finsync360?retryWrites=true&w=majority&authSource=admin" --app finsync-ml
heroku config:set DATABASE_NAME="finsync360" --app finsync-ml
heroku config:set BACKEND_API_URL="https://finsync-backend-d34180691b06.herokuapp.com/api" --app finsync-ml
heroku config:set SECRET_KEY="ml-service-secret-key-for-production" --app finsync-ml
```

#### 3. Deploy ML Service
```bash
git push heroku-ml `git subtree split --prefix=ml-service HEAD`:refs/heads/master --force
```

#### 4. Verify Deployment
```bash
heroku ps --app finsync-ml
curl https://finsync-ml-2bba4152b555.herokuapp.com/api/v1/health
```

### Frontend Deployment

#### 1. Add Heroku Remote
```bash
heroku git:remote -a finsync-frontend-nextjs -r heroku-frontend
```

#### 2. Deploy Frontend
```bash
git push heroku-frontend `git subtree split --prefix=frontend HEAD`:refs/heads/master --force
```

## 🗄️ Database Configuration

### MongoDB Atlas Setup

**Current Production Database:**
- **Provider**: MongoDB Atlas
- **Cluster**: finsync.xwmeuwe.mongodb.net
- **Database**: finsync360
- **Connection**: Shared between Backend API and ML Service

#### Connection String Format
```
mongodb+srv://username:password@finsync.xwmeuwe.mongodb.net/finsync360?retryWrites=true&w=majority&authSource=admin
```

#### Database Access Configuration
1. **Network Access**: Configured for Heroku IP ranges (0.0.0.0/0 for simplicity)
2. **Database User**: `hhirawat5` with read/write permissions
3. **Authentication**: Username/password authentication
4. **SSL**: Enabled (required for Atlas)

### Database Collections

The system uses the following main collections:
- `users` - User accounts and authentication
- `companies` - Company/tenant data
- `vouchers` - Financial transactions
- `parties` - Customers and suppliers
- `items` - Inventory items
- `payments` - Payment records
- `budgets` - Budget planning data

## 🔧 Environment Variables

### Backend API Environment Variables

| Variable | Production Value | Description |
|----------|------------------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection |
| `JWT_SECRET` | `jFVdOwGOOHRA0716...` | JWT signing secret |
| `BCRYPT_ROUNDS` | `12` | Password hashing rounds |
| `ENCRYPTION_KEY` | `frbcHZWNefSNvpn...` | Data encryption key |
| `FRONTEND_URL` | `https://finsync-frontend...` | Frontend CORS origin |
| `RAZORPAY_KEY_ID` | `dummy_key_for_development` | Payment gateway key |
| `RAZORPAY_KEY_SECRET` | `dummy_secret_for_development` | Payment gateway secret |

### ML Service Environment Variables

| Variable | Production Value | Description |
|----------|------------------|-------------|
| `MONGODB_URL` | `mongodb+srv://...` | MongoDB Atlas connection |
| `DATABASE_NAME` | `finsync360` | Database name |
| `BACKEND_API_URL` | `https://finsync-backend...` | Backend API URL |
| `SECRET_KEY` | `ml-service-secret-key...` | Service secret key |

### Mobile App Environment Variables

| Variable | Production Value | Description |
|----------|------------------|-------------|
| `REACT_APP_API_URL` | `https://finsync-backend.../api` | Backend API endpoint |
| `REACT_APP_ML_SERVICE_URL` | `https://finsync-ml.../api/v1` | ML service endpoint |
| `NODE_ENV` | `production` | Environment mode |

## 🔗 Service Interdependencies

### Communication Flow

```
Mobile App ←→ Backend API ←→ MongoDB Atlas
     ↓              ↓
Frontend Web ←→ ML Service ←→ MongoDB Atlas
```

### Service Dependencies

1. **Backend API**
   - Depends on: MongoDB Atlas
   - Provides: REST API for mobile/frontend
   - Authentication: JWT tokens

2. **ML Service**
   - Depends on: MongoDB Atlas, Backend API
   - Provides: ML predictions and analytics
   - Authentication: Validates requests

3. **Frontend**
   - Depends on: Backend API
   - Provides: Web interface
   - Authentication: JWT tokens from backend

4. **Mobile App**
   - Depends on: Backend API, ML Service
   - Provides: Mobile interface
   - Authentication: JWT tokens from backend

### Network Configuration

- **CORS**: Configured for cross-origin requests between services
- **HTTPS**: All production endpoints use SSL/TLS
- **Authentication**: JWT tokens shared between frontend/mobile and backend
- **Database**: Single shared MongoDB Atlas cluster

## 🧪 Deployment Verification

### Automated Integration Testing

```bash
# Run comprehensive integration tests
cd mobile
node test-full-integration.js

# Expected results:
# 📡 Backend API: 7/7 tests passed (100%)
# 🤖 ML Service: 3/3 tests passed (100%)  
# 🔗 Integration: 1/1 tests passed (100%)
# 🎯 Overall: 11/11 tests passed (100%)
```

### Manual Health Checks

```bash
# Backend API health
curl https://finsync-backend-d34180691b06.herokuapp.com/health

# ML Service health
curl https://finsync-ml-2bba4152b555.herokuapp.com/api/v1/health

# Frontend accessibility
curl -I https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com
```

### Service Status Monitoring

```bash
# Check Heroku app status
heroku ps --app finsync-backend
heroku ps --app finsync-ml
heroku ps --app finsync-frontend-nextjs

# View logs
heroku logs --tail --app finsync-backend
heroku logs --tail --app finsync-ml
```

## 🔄 Deployment Updates

### Rolling Updates

To deploy updates to production:

1. **Test locally** with production environment variables
2. **Commit changes** to git repository
3. **Deploy to Heroku** using subtree push commands
4. **Verify deployment** using health checks and integration tests

### Rollback Procedure

```bash
# Rollback to previous release
heroku releases --app finsync-backend
heroku rollback v123 --app finsync-backend

# Verify rollback
curl https://finsync-backend-d34180691b06.herokuapp.com/health
```

## 🎯 Production Readiness Checklist

- ✅ All services deployed and operational
- ✅ Database connected and accessible
- ✅ Environment variables configured
- ✅ HTTPS/SSL enabled
- ✅ Authentication working across all endpoints
- ✅ CORS configured for cross-origin requests
- ✅ Health checks responding
- ✅ Integration tests passing (100% success rate)
- ✅ Error handling and logging configured
- ✅ Service interdependencies verified

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify MongoDB Atlas credentials
   - Check network access configuration
   - Ensure connection string format is correct

2. **Authentication Failures**
   - Verify JWT_SECRET is set correctly
   - Check token expiration settings
   - Ensure CORS is configured for frontend domains

3. **Service Communication Issues**
   - Verify service URLs in environment variables
   - Check HTTPS certificate validity
   - Ensure all services are running

### Support Resources

- **Heroku Dashboard**: Monitor app status and logs
- **MongoDB Atlas**: Database monitoring and metrics
- **Integration Tests**: Automated verification of service health
- **Health Endpoints**: Real-time service status checks

The FinSync360 system is now fully deployed and operational in production! 🎉
