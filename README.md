# FinSync360 - Comprehensive Cloud-Based ERP System

A full-stack ERP solution with seamless Tally integration, designed for modern businesses requiring comprehensive financial management, inventory control, and business intelligence.

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
- MongoDB 6.0+
- Python 3.9+ (for ML service)
- React Native CLI (for mobile development)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd FinSync360
npm run install:all
```

2. **Set up environment variables**
```bash
cp backend/.env.example backend/.env
# Configure your database, API keys, and other settings
```

3. **Start development servers**
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

### Environment Variables

Create `.env` files in respective directories:

**Backend (.env)**
```
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

### Docker Deployment
```bash
# Build and start all services
npm run docker:build
npm run docker:up
```

### Production Build
```bash
npm run build
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Tally Integration Guide](./docs/tally-integration.md)
- [Mobile App Guide](./docs/mobile-guide.md)
- [Desktop Agent Setup](./docs/desktop-agent.md)
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
