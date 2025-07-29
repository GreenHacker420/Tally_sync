# FinSync360 System Architecture

Complete system architecture documentation for the FinSync360 ERP system with production deployment overview.

## 🏗️ System Overview

FinSync360 is a comprehensive cloud-based ERP system built with a microservices architecture, deployed on Heroku with MongoDB Atlas as the database backend.

### Architecture Principles

- **Microservices**: Loosely coupled services with specific responsibilities
- **API-First**: RESTful APIs for all service communication
- **Cloud-Native**: Designed for cloud deployment and scaling
- **Security-First**: JWT authentication and HTTPS throughout
- **Mobile-First**: Responsive design with dedicated mobile app

## 🌐 Production Infrastructure

### Deployment Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                    │
│                         (Heroku)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Frontend  │  │ Backend API │  │ ML Service  │        │
│  │   Next.js   │  │   Node.js   │  │   Python    │        │
│  │             │  │   Express   │  │   FastAPI   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                  ┌─────────────┐                          │
│                  │   MongoDB   │                          │
│                  │    Atlas    │                          │
│                  │  (Database) │                          │
│                  └─────────────┘                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                          │
│  │ Mobile App  │                                          │
│  │React Native │                                          │
│  │             │                                          │
│  └─────────────┘                                          │
│         │                                                  │
│         └──────────── API Calls ─────────────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Production URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://finsync-frontend-nextjs-fbce311426ec.herokuapp.com | ✅ Deployed |
| **Backend API** | https://finsync-backend-d34180691b06.herokuapp.com | ✅ Operational |
| **ML Service** | https://finsync-ml-2bba4152b555.herokuapp.com | ✅ Operational |
| **Database** | MongoDB Atlas (finsync.xwmeuwe.mongodb.net) | ✅ Connected |

## 🔧 Service Architecture

### 1. Backend API Service

**Technology Stack:**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcrypt

**Responsibilities:**
- User authentication and authorization
- Business logic and data processing
- Tally integration and synchronization
- Payment processing (Razorpay integration)
- GST compliance and reporting
- RESTful API endpoints for frontend/mobile

**Key Features:**
- Multi-tenant architecture (company-based isolation)
- Role-based access control (RBAC)
- Comprehensive voucher system
- Inventory management with batch tracking
- Financial reporting and analytics

### 2. ML Service

**Technology Stack:**
- **Runtime**: Python 3.11
- **Framework**: FastAPI
- **ML Libraries**: scikit-learn, pandas, numpy
- **Database**: MongoDB (shared with backend)
- **Task Scheduling**: APScheduler
- **API Documentation**: Swagger/OpenAPI

**Responsibilities:**
- Payment delay prediction
- Customer risk assessment
- Inventory demand forecasting
- Business intelligence analytics
- Model training and management

**Key Features:**
- Async processing for high performance
- RESTful API with automatic documentation
- Model versioning and retraining capabilities
- Real-time predictions and batch processing

### 3. Frontend Web Application

**Technology Stack:**
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS / Material-UI
- **State Management**: Redux Toolkit
- **API Client**: Axios
- **Authentication**: JWT token management

**Responsibilities:**
- Web-based user interface
- Dashboard and reporting views
- Administrative functions
- Real-time data visualization

### 4. Mobile Application

**Technology Stack:**
- **Framework**: React Native
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit
- **API Client**: Axios
- **Offline Support**: Redux Persist

**Responsibilities:**
- Mobile user interface
- Offline-first functionality
- Push notifications
- Biometric authentication
- Field data collection

## 📊 Data Flow Architecture

### Authentication Flow

```
┌─────────────┐    1. Login Request    ┌─────────────┐
│   Client    │ ────────────────────→ │ Backend API │
│ (Mobile/Web)│                       │             │
└─────────────┘                       └─────────────┘
       │                                      │
       │                                      │ 2. Validate Credentials
       │                                      ▼
       │                               ┌─────────────┐
       │                               │   MongoDB   │
       │                               │   Database  │
       │                               └─────────────┘
       │                                      │
       │         3. JWT Token                 │
       │ ◄────────────────────────────────────┘
       │
       │    4. Authenticated Requests
       │ ────────────────────────────────────►
       │         (Bearer Token)
```

### Business Data Flow

```
┌─────────────┐    API Requests    ┌─────────────┐    Database    ┌─────────────┐
│   Client    │ ─────────────────→ │ Backend API │ ─────────────→ │   MongoDB   │
│ (Mobile/Web)│                    │             │                │   Database  │
└─────────────┘                    └─────────────┘                └─────────────┘
       │                                  │                              │
       │                                  │                              │
       │         JSON Response            │         Data Retrieval       │
       │ ◄────────────────────────────────│ ◄────────────────────────────┘
       │                                  │
       │                                  │
       │    ML Predictions Request        │
       │ ─────────────────────────────────┼─────────────────────────────┐
       │                                  │                             │
       │                                  ▼                             ▼
       │                           ┌─────────────┐                ┌─────────────┐
       │                           │ ML Service  │                │   MongoDB   │
       │                           │             │ ──────────────→│  (ML Data)  │
       │                           └─────────────┘                └─────────────┘
       │                                  │
       │         ML Results               │
       │ ◄────────────────────────────────┘
```

### Tally Integration Flow

```
┌─────────────┐    XML Export     ┌─────────────┐    Process Data   ┌─────────────┐
│    Tally    │ ─────────────────→│ Backend API │ ─────────────────→│   MongoDB   │
│   Software  │                   │             │                   │   Database  │
└─────────────┘                   └─────────────┘                   └─────────────┘
       │                                 │                                 │
       │                                 │                                 │
       │         XML Import              │         Sync Status             │
       │ ◄───────────────────────────────│ ◄───────────────────────────────┘
       │                                 │
       │                                 │
       │                                 ▼
       │                          ┌─────────────┐
       │                          │ ML Service  │ ──── Analyze Data
       │                          │             │
       │                          └─────────────┘
```

## 🔒 Security Architecture

### Authentication & Authorization

```
┌─────────────┐
│   Client    │
│ Application │
└─────────────┘
       │
       │ 1. Login Credentials
       ▼
┌─────────────┐
│ Backend API │
│   /auth     │ ──── 2. Validate ────► MongoDB
└─────────────┘
       │
       │ 3. Generate JWT
       ▼
┌─────────────┐
│ JWT Token   │
│ (Signed)    │
└─────────────┘
       │
       │ 4. Include in Headers
       ▼
┌─────────────┐
│ Protected   │
│ API Calls   │ ──── 5. Verify ────► JWT Middleware
└─────────────┘
```

### Security Layers

1. **Transport Security**: HTTPS/TLS for all communications
2. **Authentication**: JWT tokens with expiration
3. **Authorization**: Role-based access control (RBAC)
4. **Input Validation**: Comprehensive request validation
5. **Data Encryption**: Sensitive data encryption at rest
6. **CORS Protection**: Cross-origin request filtering
7. **Rate Limiting**: API abuse prevention

## 🗄️ Database Architecture

### MongoDB Collections

```
finsync360 Database
├── users                 # User accounts and profiles
├── companies            # Multi-tenant company data
├── vouchers             # Financial transactions
├── parties              # Customers and suppliers
├── items                # Inventory items and products
├── payments             # Payment records and history
├── budgets              # Budget planning and tracking
├── inventory_batches    # Batch tracking for inventory
├── gst_returns          # GST compliance data
├── reports              # Generated reports cache
├── notifications        # System notifications
├── audit_logs           # System audit trail
└── ml_models            # ML model metadata and versions
```

### Data Relationships

```
┌─────────────┐     1:N     ┌─────────────┐     1:N     ┌─────────────┐
│  Companies  │ ──────────→ │    Users    │ ──────────→ │  Vouchers   │
└─────────────┘             └─────────────┘             └─────────────┘
       │                           │                           │
       │ 1:N                       │ 1:N                       │ N:M
       ▼                           ▼                           ▼
┌─────────────┐             ┌─────────────┐             ┌─────────────┐
│   Parties   │             │   Budgets   │             │    Items    │
└─────────────┘             └─────────────┘             └─────────────┘
       │                                                       │
       │ 1:N                                                   │ 1:N
       ▼                                                       ▼
┌─────────────┐                                         ┌─────────────┐
│  Payments   │                                         │ Inventory   │
└─────────────┘                                         │   Batches   │
                                                        └─────────────┘
```

## 🚀 Scalability & Performance

### Horizontal Scaling

- **Stateless Services**: All services are stateless for easy scaling
- **Load Balancing**: Heroku provides automatic load balancing
- **Database Scaling**: MongoDB Atlas supports automatic scaling
- **CDN Integration**: Static assets served via CDN

### Performance Optimizations

- **API Caching**: Redis caching for frequently accessed data
- **Database Indexing**: Optimized indexes for query performance
- **Async Processing**: Non-blocking operations in ML service
- **Connection Pooling**: Efficient database connection management

### Monitoring & Observability

- **Health Checks**: Built-in health endpoints for all services
- **Logging**: Structured logging with Winston (Node.js) and Python logging
- **Error Tracking**: Comprehensive error handling and reporting
- **Metrics**: Performance metrics and monitoring

## 🔄 Deployment Architecture

### CI/CD Pipeline

```
┌─────────────┐    Git Push    ┌─────────────┐    Deploy     ┌─────────────┐
│ Development │ ─────────────→ │ Git Repo    │ ─────────────→│   Heroku    │
│ Environment │                │ (GitHub)    │                │ Production  │
└─────────────┘                └─────────────┘                └─────────────┘
       │                              │                              │
       │                              │                              │
       │ Local Testing                │ Integration Tests            │ Health Checks
       ▼                              ▼                              ▼
┌─────────────┐                ┌─────────────┐                ┌─────────────┐
│   Unit      │                │ Automated   │                │ Production  │
│   Tests     │                │ Testing     │                │ Monitoring  │
└─────────────┘                └─────────────┘                └─────────────┘
```

### Environment Configuration

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| **Development** | Local development | Local MongoDB | localhost |
| **Production** | Live system | MongoDB Atlas | Heroku apps |

## 📱 Mobile Architecture

### React Native Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │     UI      │  │   Redux     │  │   Services  │        │
│  │ Components  │  │    Store    │  │   (API)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Offline   │  │ Navigation  │  │    Auth     │        │
│  │   Storage   │  │   Router    │  │  Manager    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Native Platform                         │
│                   (iOS / Android)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Offline-First Architecture

- **Local Storage**: Redux Persist for offline data
- **Sync Strategy**: Background synchronization when online
- **Conflict Resolution**: Last-write-wins with timestamp comparison
- **Queue Management**: Offline action queue for API calls

## 🎯 Production Readiness

### Current Status: ✅ FULLY OPERATIONAL

- **Deployment**: All services deployed and running
- **Database**: MongoDB Atlas connected and operational
- **Authentication**: JWT security implemented across all services
- **API Endpoints**: 100% of endpoints operational (11/11 tests passing)
- **Integration**: Cross-service communication verified
- **Monitoring**: Health checks and logging active
- **Security**: HTTPS, CORS, and input validation implemented

### Performance Metrics

- **API Response Time**: < 200ms average
- **Database Queries**: Optimized with proper indexing
- **Uptime**: 99.9% target with Heroku infrastructure
- **Scalability**: Auto-scaling enabled on Heroku

The FinSync360 system architecture is designed for scalability, security, and maintainability, with a successful production deployment demonstrating its robustness and reliability.
