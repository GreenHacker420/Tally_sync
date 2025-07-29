# FinSync360 Backend API

Node.js Express backend API server for the FinSync360 ERP system with comprehensive financial management, inventory control, and Tally integration capabilities.

## 🌐 Production Deployment

**Status: ✅ DEPLOYED & OPERATIONAL**

- **Production URL**: https://finsync-backend-d34180691b06.herokuapp.com
- **Health Check**: https://finsync-backend-d34180691b06.herokuapp.com/health
- **Database**: MongoDB Atlas (shared cluster)
- **Integration Tests**: 7/7 endpoints passing (100% success rate)

## 🚀 Features

- **Authentication & Authorization**: JWT-based security with role-based access control
- **Tally Integration**: Bidirectional XML-based synchronization
- **Financial Management**: Complete voucher system (sales, purchase, payment, receipt, etc.)
- **Inventory Management**: Multi-godown support with batch tracking
- **Payment Processing**: Razorpay integration with UPI/QR code support
- **GST Compliance**: GSTN integration and reconciliation
- **Communication**: WhatsApp/Email notifications and reminders
- **Reporting**: Advanced financial and inventory reports
- **Multi-tenant**: Company-based data isolation

## 📋 API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires auth)

### Core Business Endpoints
- `GET|POST|PUT|DELETE /api/transactions` - Transaction management (vouchers)
- `GET|POST|PUT|DELETE /api/budgets` - Budget management
- `GET|POST|PUT|DELETE /api/vouchers` - Voucher operations
- `GET|POST|PUT|DELETE /api/inventory` - Inventory management
- `GET|POST|PUT|DELETE /api/payments` - Payment processing
- `GET|POST|PUT|DELETE /api/parties` - Customer/Supplier management

### System Endpoints
- `GET /health` - Health check endpoint
- `GET /api/companies` - Company management
- `GET /api/users` - User management
- `GET /api/reports` - Report generation
- `GET /api/notifications` - Notification management

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 6.0+ (or use production MongoDB Atlas)
- npm or yarn

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Environment configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development server**
```bash
npm run dev
```

The server will start on http://localhost:5000

### Environment Variables

**Development (.env)**
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finsync360
JWT_SECRET=your-jwt-secret-key
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=your-32-character-encryption-key

# Payment Integration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Communication Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
EMAIL_SERVICE_API_KEY=your-email-api-key

# External APIs
GSTN_API_KEY=your-gstn-api-key
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
```

**Production (Heroku Config Vars)**
```bash
NODE_ENV=development
MONGODB_URI=mongodb+srv://hhirawat5:R79fVWIVMLY1BSUh@finsync.xwmeuwe.mongodb.net/finsync360?retryWrites=true&w=majority&authSource=admin
JWT_SECRET=jFVdOwGOOHRA0716lvQ0F1PlY1GFbXZNxE5mtgZvPs8=
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=frbcHZWNefSNvpn70bEVJw35JhPnN3+o
FRONTEND_URL=https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com
RAZORPAY_KEY_ID=dummy_key_for_development
RAZORPAY_KEY_SECRET=dummy_secret_for_development
REDIS_URL=rediss://:p0ebd99f9f300dac913073c895f7acb6dfca3af58be5791df4823f62bc4a82c18@ec2-52-200-79-251.compute-1.amazonaws.com:26720
LOG_LEVEL=info
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Specific test suites
npm run test:auth
npm run test:vouchers
npm run test:inventory
npm run test:payments
```

### Integration Testing
```bash
# Test production API endpoints
cd ../mobile
node test-production-api.js
```

## 🚀 Deployment

### Heroku Deployment

1. **Add Heroku remote**
```bash
heroku git:remote -a finsync-backend -r heroku-backend
```

2. **Deploy to production**
```bash
git push heroku-backend `git subtree split --prefix=backend HEAD`:refs/heads/master --force
```

3. **Configure environment variables**
```bash
heroku config:set MONGODB_URI="your-mongodb-connection-string" --app finsync-backend
heroku config:set JWT_SECRET="your-jwt-secret" --app finsync-backend
# ... other environment variables
```

### Health Check
```bash
curl https://finsync-backend-d34180691b06.herokuapp.com/health
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication, validation, error handling
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── server.js        # Express app setup
├── tests/               # Test suites
├── logs/                # Application logs
├── scripts/             # Database scripts and utilities
├── package.json
├── Procfile            # Heroku deployment configuration
└── README.md
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Data Encryption**: AES encryption for sensitive data
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers and protection
- **MongoDB Sanitization**: NoSQL injection prevention

## 📊 Monitoring & Logging

- **Structured Logging**: Winston-based logging system
- **Health Monitoring**: Built-in health check endpoints
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance Metrics**: Request timing and performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
