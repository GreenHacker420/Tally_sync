# 🚀 Heroku Deployment Guide for FinSync360 (Tally_sync)

This guide provides step-by-step instructions for deploying your FinSync360 application to Heroku using the Heroku CLI.

## 📋 Prerequisites

### 1. Install Heroku CLI

**macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**Windows:**
```bash
# Using Chocolatey
choco install heroku-cli

# Or download installer from: https://devcenter.heroku.com/articles/heroku-cli
```

**Linux:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2. Install Required Tools
```bash
# Install jq for JSON parsing (used in deployment script)
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows
choco install jq
```

### 3. Login to Heroku
```bash
heroku login
```

## 🏗️ Project Structure Overview

Your FinSync360 application consists of:
- **Backend**: Node.js/Express API server (`/backend`)
- **Frontend**: React web application (`/frontend`) 
- **Mobile**: React Native app (`/mobile`)
- **Desktop**: Electron app (`/desktop`)
- **ML Service**: Python FastAPI service (`/ml-service`)

## 🚀 Quick Deployment (Automated)

### Option 1: Use the Automated Script

1. **Make the deployment script executable:**
```bash
chmod +x heroku-deploy.sh
```

2. **Run the deployment script:**
```bash
./heroku-deploy.sh
```

The script will:
- Create three Heroku apps (backend, frontend, ML service)
- Configure addons (MongoDB, Redis)
- Set environment variables
- Deploy all services
- Provide you with the URLs

## 🔧 Manual Deployment (Step by Step)

### Step 1: Deploy Backend

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Initialize git repository (if not already done):**
```bash
git init
git add .
git commit -m "Initial backend commit"
```

3. **Create Heroku app:**
```bash
heroku create your-app-name-backend
```

4. **Add MongoDB addon:**
```bash
heroku addons:create mongolab:sandbox
```

5. **Add Redis addon:**
```bash
heroku addons:create heroku-redis:mini
```

6. **Set environment variables:**
```bash
# Required environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set ENCRYPTION_KEY=$(openssl rand -base64 32 | cut -c1-32)
heroku config:set BCRYPT_ROUNDS=12
heroku config:set LOG_LEVEL=info

# Optional: Add external service keys
heroku config:set RAZORPAY_KEY_ID=your-razorpay-key
heroku config:set RAZORPAY_KEY_SECRET=your-razorpay-secret
heroku config:set TWILIO_ACCOUNT_SID=your-twilio-sid
heroku config:set TWILIO_AUTH_TOKEN=your-twilio-token
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password
```

7. **Deploy backend:**
```bash
git push heroku main
```

8. **Scale the application:**
```bash
heroku ps:scale web=1
```

9. **Get your backend URL:**
```bash
heroku apps:info --json | jq -r '.app.web_url'
```

### Step 2: Deploy Frontend

1. **Navigate to frontend directory:**
```bash
cd ../frontend
```

2. **Initialize git repository:**
```bash
git init
git add .
git commit -m "Initial frontend commit"
```

3. **Create Heroku app:**
```bash
heroku create your-app-name-frontend
```

4. **Set environment variables:**
```bash
# Replace with your actual backend URL
heroku config:set REACT_APP_API_URL=https://your-app-name-backend.herokuapp.com/api
heroku config:set REACT_APP_APP_NAME="FinSync360"
heroku config:set REACT_APP_VERSION="1.0.0"
```

5. **Add Node.js buildpack:**
```bash
heroku buildpacks:set heroku/nodejs
```

6. **Deploy frontend:**
```bash
git push heroku main
```

### Step 3: Deploy ML Service

1. **Navigate to ML service directory:**
```bash
cd ../ml-service
```

2. **Initialize git repository:**
```bash
git init
git add .
git commit -m "Initial ML service commit"
```

3. **Create Heroku app:**
```bash
heroku create your-app-name-ml
```

4. **Set Python buildpack:**
```bash
heroku buildpacks:set heroku/python
```

5. **Set environment variables:**
```bash
heroku config:set DEBUG=false
heroku config:set HOST=0.0.0.0
heroku config:set SECRET_KEY=$(openssl rand -base64 32)
heroku config:set MONGODB_URL=$(heroku config:get MONGODB_URI -a your-app-name-backend)
heroku config:set BACKEND_API_URL=https://your-app-name-backend.herokuapp.com/api
```

6. **Deploy ML service:**
```bash
git push heroku main
```

## 🔐 Environment Variables Configuration

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production) | ✅ |
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `ENCRYPTION_KEY` | Data encryption key | ✅ |
| `BCRYPT_ROUNDS` | Password hashing rounds | ✅ |
| `RAZORPAY_KEY_ID` | Payment gateway key | ❌ |
| `RAZORPAY_KEY_SECRET` | Payment gateway secret | ❌ |
| `TWILIO_ACCOUNT_SID` | WhatsApp integration | ❌ |
| `TWILIO_AUTH_TOKEN` | WhatsApp integration | ❌ |
| `EMAIL_USER` | Email service username | ❌ |
| `EMAIL_PASS` | Email service password | ❌ |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | ✅ |
| `REACT_APP_APP_NAME` | Application name | ❌ |
| `REACT_APP_VERSION` | Application version | ❌ |

### ML Service Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEBUG` | Debug mode (false) | ✅ |
| `HOST` | Host address (0.0.0.0) | ✅ |
| `SECRET_KEY` | API secret key | ✅ |
| `MONGODB_URL` | MongoDB connection | ✅ |
| `BACKEND_API_URL` | Backend API URL | ✅ |

## 📱 Mobile App Setup

The mobile app (React Native) cannot be deployed to Heroku directly. Instead:

### Development Setup:

1. **Install dependencies:**
```bash
cd mobile
npm install
```

2. **Configure API endpoint:**
```bash
# Create or edit mobile/src/config/api.js
export const API_BASE_URL = 'https://your-app-name-backend.herokuapp.com/api';
```

3. **Run on iOS:**
```bash
npm run ios
```

4. **Run on Android:**
```bash
npm run android
```

### Production Build:

1. **For iOS (requires macOS and Xcode):**
```bash
cd ios
xcodebuild -workspace FinSync360Mobile.xcworkspace -scheme FinSync360Mobile -configuration Release archive
```

2. **For Android:**
```bash
cd android
./gradlew assembleRelease
```

## 🖥️ Desktop App Setup

The desktop app (Electron) runs locally and connects to your deployed backend:

### Development Setup:

1. **Install dependencies:**
```bash
cd desktop
npm install
cd src/renderer
npm install
cd ../..
```

2. **Configure API endpoint:**
```bash
# Edit desktop/src/main/config.js or similar
const API_BASE_URL = 'https://your-app-name-backend.herokuapp.com/api';
```

3. **Run in development:**
```bash
npm run dev
```

### Production Build:

1. **Build for current platform:**
```bash
npm run build
```

2. **Build for specific platforms:**
```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## 🔍 Monitoring and Troubleshooting

### View Logs
```bash
# Backend logs
heroku logs --tail -a your-app-name-backend

# Frontend logs
heroku logs --tail -a your-app-name-frontend

# ML service logs
heroku logs --tail -a your-app-name-ml
```

### Check App Status
```bash
heroku ps -a your-app-name-backend
```

### Restart Apps
```bash
heroku restart -a your-app-name-backend
```

### Database Access
```bash
# Connect to MongoDB
heroku config:get MONGODB_URI -a your-app-name-backend
```

## 🎯 Next Steps

1. **Configure Custom Domain:**
```bash
heroku domains:add your-domain.com -a your-app-name-frontend
```

2. **Set up SSL:**
```bash
heroku certs:auto:enable -a your-app-name-frontend
```

3. **Scale Applications:**
```bash
heroku ps:scale web=2 -a your-app-name-backend
```

4. **Set up Monitoring:**
- Add Heroku metrics
- Configure error tracking (Sentry)
- Set up uptime monitoring

5. **Backup Strategy:**
- Configure MongoDB backups
- Set up automated database dumps

## 🆘 Common Issues and Solutions

### Issue: Build Failures
**Solution:** Check build logs and ensure all dependencies are in package.json

### Issue: Environment Variables Not Set
**Solution:** Verify all required env vars are set using `heroku config -a app-name`

### Issue: Database Connection Errors
**Solution:** Check MongoDB addon status and connection string

### Issue: CORS Errors
**Solution:** Update CORS configuration in backend to include frontend URL

## 📞 Support

If you encounter issues:
1. Check Heroku status page
2. Review application logs
3. Verify environment variables
4. Check addon status
5. Consult Heroku documentation

---

**🎉 Congratulations!** Your FinSync360 application is now deployed on Heroku!
