# FinSync360 - Comprehensive Cloud-Based ERP System

[![Hacktoberfest 2025](https://img.shields.io/badge/Hacktoberfest-2025-orange.svg)](https://hacktoberfest.com/)
[![Contributors Welcome](https://img.shields.io/badge/contributors-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A full-stack ERP solution with seamless Tally integration, designed for modern businesses requiring comprehensive financial management, inventory control, and business intelligence.

## 🎃 Hacktoberfest 2025

**FinSync360 is participating in Hacktoberfest 2025!** We welcome contributions from developers of all skill levels.

- 🏷️ Look for issues labeled [`hacktoberfest`](https://github.com/your-username/Tally_sync/labels/hacktoberfest) and [`good-first-issue`](https://github.com/your-username/Tally_sync/labels/good-first-issue)
- 📖 Read our [Contributing Guide](CONTRIBUTING.md) to get started
- 🤝 Join our community and help improve FinSync360
- 🎯 Areas to contribute: Backend API, Frontend UI, Mobile App, ML Service, Documentation

## 📋 Table of Contents

- [System Status](#-system-status)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Quick Start](#️-quick-start)
- [Configuration](#-configuration)
- [Platform-Specific Features](#-platform-specific-features)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Contributors](#-contributors)
- [License](#-license)
- [Support & Contact](#-support--contact)

## ✨ System Status

- ✅ **Backend API**: Fully operational with comprehensive REST endpoints
- ✅ **ML Service**: AI-powered predictions and analytics
- ✅ **Database**: MongoDB with robust data models
- ✅ **Integration Tests**: 100% test coverage across all services
- ✅ **Authentication**: JWT-based security with role-based access control
- ✅ **Multi-Platform**: Web, Mobile, and Desktop applications

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
- **Node.js** 18+ and npm
- **MongoDB** 6.0+ (local installation or MongoDB Atlas)
- **Python** 3.9+ (for ML service)
- **React Native CLI** (for mobile development)
- **Git** for version control

### Automated Setup (Recommended)

Run the quick setup script to automatically configure all services:

```bash
# Clone the repository
git clone <repository-url>
cd FinSync360

# Run automated setup
chmod +x quick-setup.sh
./quick-setup.sh
```

This script will:
- Install all dependencies for backend, frontend, mobile, and ML services
- Set up environment configuration files
- Initialize the database with sample data
- Verify all services are ready to run

### Manual Setup

If you prefer manual setup or need to configure individual services:

1. **Clone and navigate to the repository**
```bash
git clone <repository-url>
cd FinSync360
```

2. **Configure environment variables**
```bash
# Copy example environment files
cp backend/.env.example backend/.env
cp mobile/.env.development mobile/.env
cp ml-service/.env.example ml-service/.env

# Edit the .env files with your configuration
```

3. **Install dependencies**
```bash
# Backend
cd backend && npm install

# Frontend (Next.js)
cd ../frontend-nextjs && npm install

# Mobile
cd ../mobile && npm install

# ML Service
cd ../ml-service && pip install -r requirements.txt
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod --dbpath /path/to/your/data/directory

# Or configure MongoDB Atlas connection in .env files
```

### Running the Application

**Start all services:**
```bash
npm run dev
```

This starts:
- Backend API on `http://localhost:5000`
- Frontend web app on `http://localhost:3000`
- ML service on `http://localhost:8000`
- MongoDB connection

**Start individual services:**

```bash
# Backend API only
npm run backend:dev

# Frontend web app only
npm run frontend:dev

# Mobile app (React Native)
npm run mobile:dev

# Desktop application
npm run desktop:dev

# Desktop agent (Tally sync)
npm run desktop-agent:dev

# ML service
npm run ml-service:dev
```

## 🔧 Configuration

### Environment Variables

All services use environment variables for configuration. Example `.env.example` files are provided in each service directory.

**Backend (.env)**
```bash
# Server Configuration
NODE_ENV=development
PORT=5002

# Database
MONGODB_URI=mongodb://localhost:27017/finsync360
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/finsync360

# Security
JWT_SECRET=your-secure-jwt-secret-key
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=your-32-character-encryption-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Communication Services
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# GST Integration
GSTN_API_KEY=your-gstn-api-key
GSTN_USERNAME=your-gstn-username

# Email Service
EMAIL_SERVICE_API_KEY=your-email-service-key
EMAIL_FROM=noreply@finsync360.com
```

**ML Service (.env)**
```bash
# Database
MONGODB_URL=mongodb://localhost:27017/finsync360
DATABASE_NAME=finsync360

# Backend API
BACKEND_API_URL=http://localhost:5002/api

# Security
SECRET_KEY=your-ml-service-secret-key

# Model Configuration
MODEL_PATH=./models
TRAINING_DATA_PATH=./data
```

**Mobile App (.env)**
```bash
# API Endpoints
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ML_SERVICE_URL=http://localhost:8000/api/v1

# Environment
NODE_ENV=development

# Features
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_OFFLINE_MODE=true
```

**Frontend (.env)**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000/api/v1

# Environment
NODE_ENV=development
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

### Running Tests

```bash
# Run all tests
npm test

# Backend API tests
npm run backend:test

# Frontend tests
npm run frontend:test

# Mobile app tests
npm run mobile:test

# Integration tests
npm run test:integration
```

### Test Coverage

The project includes comprehensive test coverage:
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and service integration testing
- **E2E Tests**: End-to-end user workflow testing

### Running Integration Tests

```bash
# Run comprehensive integration tests
cd mobile && node test-full-integration.js

# Run backend integration tests
cd backend && npm run test:integration
```

## 🚀 Deployment

### Docker Deployment (Recommended)

Deploy all services using Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual Deployment

**Backend API:**
```bash
cd backend
npm install --production
npm run build
npm start
```

**Frontend (Next.js):**
```bash
cd frontend-nextjs
npm install --production
npm run build
npm start
```

**ML Service:**
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Production Build

```bash
# Build all services
npm run build

# Build individual services
npm run backend:build
npm run frontend:build
npm run mobile:build
```

### Environment-Specific Configuration

For production deployment, ensure you:
1. Set `NODE_ENV=production` in environment variables
2. Use strong, unique secrets for `JWT_SECRET` and `ENCRYPTION_KEY`
3. Configure MongoDB Atlas or a production MongoDB instance
4. Set up SSL/TLS certificates for HTTPS
5. Configure proper CORS settings
6. Enable rate limiting and security headers
7. Set up monitoring and logging services

## 📚 Documentation

### Core Documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete REST API reference and endpoints
- **[System Architecture](docs/ARCHITECTURE.md)** - System design, data flow, and architecture diagrams
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions and best practices
- **[Development Guide](docs/DEVELOPMENT.md)** - Development setup and coding standards

### Service-Specific Documentation
- **[Backend API](backend/README.md)** - Backend service architecture and API endpoints
- **[Mobile App](mobile/README.md)** - React Native mobile app setup and configuration
- **[ML Service](ml-service/README.md)** - Machine learning service and model training
- **[Desktop App](desktop/README.md)** - Electron desktop application
- **[Desktop Agent](desktop-agent/README.md)** - Tally synchronization agent

### Integration Guides
- **Tally Integration** - XML-based bidirectional sync with Tally ERP
- **Payment Gateway** - Razorpay integration for digital payments
- **GST Portal** - GSTN API integration for tax compliance
- **Communication Services** - WhatsApp and Email notification setup

### Additional Resources
- **[Admin Testing Guide](ADMIN_TESTING_GUIDE.md)** - Admin panel testing procedures
- **[Mobile Setup Guide](MOBILE_SETUP_GUIDE.md)** - Mobile app development setup
- **[Desktop Setup Guide](DESKTOP_SETUP_GUIDE.md)** - Desktop application setup
- **[MongoDB Atlas Setup](MONGODB_ATLAS_SETUP.md)** - Cloud database configuration

## 🤝 Contributing

We welcome contributions to FinSync360! Here's how you can help:

### Getting Started
1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/your-username/FinSync360.git
   cd FinSync360
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit them
   ```bash
   git commit -m 'Add: Brief description of your feature'
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** on GitHub

### Contribution Guidelines
- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep PRs focused on a single feature or fix

### Code Standards
- **JavaScript/Node.js**: Follow ESLint configuration
- **Python**: Follow PEP 8 style guide
- **React/React Native**: Use functional components and hooks
- **Git Commits**: Use conventional commit format

## 👥 Contributors

We thank all the contributors who have helped make FinSync360 better! 🙏

### 🎃 Hacktoberfest Contributors

Special thanks to our Hacktoberfest 2025 contributors:

<!-- Contributors will be automatically added here -->
<a href="https://github.com/your-username/Tally_sync/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=your-username/Tally_sync" />
</a>

### How to Become a Contributor

1. 🍴 Fork the repository
2. 🔍 Find an issue labeled `good-first-issue` or `hacktoberfest`
3. 💻 Make your contribution
4. 📝 Submit a pull request
5. 🎉 Get your contribution merged and be recognized!

### Contribution Areas

- **Backend Development** - Node.js, Express, MongoDB
- **Frontend Development** - React, Next.js, UI/UX
- **Mobile Development** - React Native, iOS/Android
- **ML/AI Development** - Python, FastAPI, Machine Learning
- **Documentation** - Guides, tutorials, API docs
- **Testing** - Unit tests, integration tests, E2E tests
- **DevOps** - Docker, CI/CD, deployment scripts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Contact

### Getting Help
- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check the `/docs` directory for detailed guides
- **Email**: harsh@greenhacker.tech

### Community
- Star ⭐ this repository if you find it helpful
- Share your feedback and suggestions
- Contribute to make FinSync360 better

### Reporting Issues
When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots or error logs if applicable

---

**Built with ❤️ for modern businesses seeking comprehensive ERP solutions**
