# FinSync360 - Comprehensive Cloud-Based ERP System

A full-stack ERP solution with seamless Tally integration, designed for modern businesses requiring comprehensive financial management, inventory control, and business intelligence.

## 🌐 Production Deployment

**FinSync360 is now live in production!** All services are deployed and operational with 100% integration test success.

### Live Production URLs
- **Backend API**: https://finsync-backend-d34180691b06.herokuapp.com
- **ML Service**: https://finsync-ml-2bba4152b555.herokuapp.com
- **Frontend Web App**: https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com
- **Mobile App**: Ready for development testing with production API connectivity

### Production Status
- ✅ Backend API: 100% operational (7/7 endpoints working)
- ✅ ML Service: 100% operational (3/3 endpoints working)
- ✅ Database: MongoDB Atlas connected and operational
- ✅ Integration Tests: 11/11 tests passing (100% success rate)
- ✅ Authentication: JWT-based security implemented across all endpoints

## 🚀 Features

### Core Modules
- **Tally Integration Engine** - Bidirectional XML-based synchronization
- **Comprehensive Accounting System** - All voucher types with PDF generation
- **Digital Payment Integration** - UPI, QR codes, payment reconciliation
- **Automated Communication** - WhatsApp/Email reminders and notifications
- **GST Compliance Portal** - GSTN integration and reconciliation
- **AI-Powered Business Intelligence** - Payment predictions and risk assessment
- **Multi-Tenant Architecture** - Role-based access control
- **Advanced Inventory Management** - Multi-godown, batch tracking, pricing
- **Cross-Platform Support** - Web, Mobile, Desktop applications

### Technical Stack
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React.js with responsive design
- **Mobile**: React Native (iOS/Android)
- **Desktop**: Electron applications
- **AI/ML**: Python FastAPI microservice
- **Integrations**: Razorpay, GSTN, Twilio, Email services

## 📁 Project Structure

```
FinSync360/
├── backend/                 # Node.js API server
├── frontend/               # React.js web application
├── mobile/                 # React Native mobile apps
├── desktop/                # Electron desktop application
├── desktop-agent/          # Electron Tally sync agent
├── ml-service/             # Python FastAPI for AI/ML
├── shared/                 # Shared utilities and types
├── docs/                   # Documentation
└── deployment/             # Docker, CI/CD configurations
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+ (or use production MongoDB Atlas)
- Python 3.9+ (for ML service development)
- React Native CLI (for mobile development)

### Production Environment Setup

**For production testing and development:**

1. **Clone the repository**
```bash
git clone <repository-url>
cd FinSync360
```

2. **Configure for production environment**
```bash
# Mobile app - use production APIs
cp mobile/.env.production mobile/.env
# Backend - for local development with production database
cp backend/.env.example backend/.env
```

3. **Install dependencies**
```bash
# Install mobile app dependencies
cd mobile && npm install

# Install backend dependencies (for local development)
cd ../backend && npm install

# Install ML service dependencies (for local development)
cd ../ml-service && pip install -r requirements.txt
```

### Local Development Setup

1. **Start development servers**
```bash
npm run dev
```

This will start:
- Backend API server on http://localhost:5000
- Frontend web app on http://localhost:3000
- MongoDB connection
- Hot reload for development

### Individual Services

```bash
# Backend only
npm run backend:dev

# Frontend only
npm run frontend:dev

# Mobile development
npm run mobile:dev

# Desktop application
npm run desktop:dev

# Desktop agent (Tally sync)
npm run desktop-agent:dev

# ML service
npm run ml-service:dev
```

## 🔧 Configuration

### Production Environment Variables

**Mobile App (.env.production)**
```bash
# Production Backend API
REACT_APP_API_URL=https://finsync-backend-d34180691b06.herokuapp.com/api
REACT_APP_ML_SERVICE_URL=https://finsync-ml-2bba4152b555.herokuapp.com/api/v1

# Environment
NODE_ENV=production
```

**Backend (Production - Heroku Config)**
```bash
NODE_ENV=development
MONGODB_URI=mongodb+srv://hhirawat5:R79fVWIVMLY1BSUh@finsync.xwmeuwe.mongodb.net/finsync360?retryWrites=true&w=majority&authSource=admin
JWT_SECRET=jFVdOwGOOHRA0716lvQ0F1PlY1GFbXZNxE5mtgZvPs8=
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=frbcHZWNefSNvpn70bEVJw35JhPnN3+o
FRONTEND_URL=https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com
RAZORPAY_KEY_ID=dummy_key_for_development
RAZORPAY_KEY_SECRET=dummy_secret_for_development
```

**ML Service (Production - Heroku Config)**
```bash
MONGODB_URL=mongodb+srv://hhirawat5:R79fVWIVMLY1BSUh@finsync.xwmeuwe.mongodb.net/finsync360?retryWrites=true&w=majority&authSource=admin
DATABASE_NAME=finsync360
BACKEND_API_URL=https://finsync-backend-d34180691b06.herokuapp.com/api
SECRET_KEY=ml-service-secret-key-for-production
```

### Local Development Environment Variables

**Backend (.env)**
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finsync360
JWT_SECRET=your-jwt-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
GSTN_API_KEY=your-gstn-api-key
EMAIL_SERVICE_API_KEY=your-email-api-key
```

## 📱 Platform-Specific Features

### Web Application
- Full ERP functionality
- Responsive design for tablets and desktops
- Tally-style keyboard shortcuts
- Real-time data synchronization

### Mobile Apps
- Sales and purchase voucher entry
- Payment collection with QR codes
- Inventory management
- Push notifications for reminders

### Desktop Application
- Complete ERP functionality
- Offline capabilities
- Native OS integration
- Advanced reporting and analytics

### Desktop Agent
- Background Tally synchronization
- Offline data sync capabilities
- System tray integration
- Automatic sync scheduling

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
npm run backend:test

# Frontend tests
npm run frontend:test
```

## 🚀 Deployment

### Production Deployment (Heroku)

**Current Production Status: ✅ DEPLOYED & OPERATIONAL**

All services are deployed on Heroku with the following configuration:

1. **Backend API** - `finsync-backend` app
   - URL: https://finsync-backend-d34180691b06.herokuapp.com
   - Database: MongoDB Atlas
   - Status: ✅ 100% operational (7/7 endpoints working)

2. **ML Service** - `finsync-ml` app
   - URL: https://finsync-ml-2bba4152b555.herokuapp.com
   - Database: MongoDB Atlas (shared with backend)
   - Status: ✅ 100% operational (3/3 endpoints working)

3. **Frontend** - `finsync-frontend-nextjs` app
   - URL: https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com
   - Status: ✅ Deployed and accessible

### Deployment Commands

```bash
# Deploy backend to Heroku
git push heroku-backend `git subtree split --prefix=backend HEAD`:refs/heads/master --force

# Deploy ML service to Heroku
git push heroku-ml `git subtree split --prefix=ml-service HEAD`:refs/heads/master --force

# Deploy frontend to Heroku
git push heroku-frontend `git subtree split --prefix=frontend HEAD`:refs/heads/master --force
```

### Integration Testing

```bash
# Run comprehensive integration tests
cd mobile && node test-full-integration.js

# Expected result: 11/11 tests passing (100% success rate)
```

### Local Development Build
```bash
npm run build
```

## 📚 Documentation

### Production Documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference with production endpoints
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Heroku deployment process and configuration
- **[System Architecture](docs/ARCHITECTURE.md)** - Complete system architecture and data flow

### Service-Specific Documentation
- **[Backend API](backend/README.md)** - Backend service setup and API endpoints
- **[Mobile App](mobile/README.md)** - React Native mobile app configuration
- **[ML Service](ml-service/README.md)** - Machine learning service deployment and usage

### Development Documentation
- [Tally Integration Guide](./docs/tally-integration.md) - Tally software integration
- [Mobile App Guide](./docs/mobile-guide.md) - Mobile development guide
- [Desktop Agent Setup](./docs/desktop-agent.md) - Desktop agent configuration

### Quick Links
- **Production Backend**: https://finsync-backend-d34180691b06.herokuapp.com
- **Production ML Service**: https://finsync-ml-2bba4152b555.herokuapp.com
- **Production Frontend**: https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com
- **Integration Tests**: Run `cd mobile && node test-full-integration.js`
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@finsync360.com
- Documentation: [docs.finsync360.com](https://docs.finsync360.com)
