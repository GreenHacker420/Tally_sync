# FinSync360 Development Guide

This guide covers the development workflow, architecture, and best practices for contributing to FinSync360.

## Project Architecture

### Overview
FinSync360 follows a microservices architecture with the following components:

```
FinSync360/
├── backend/                 # Node.js + Express API server
├── frontend/               # React.js web application
├── mobile/                 # React Native mobile apps
├── desktop/                # Electron desktop application
├── desktop-agent/          # Electron Tally sync agent
├── ml-service/             # Python FastAPI for AI/ML
├── shared/                 # Shared utilities and types
├── docs/                   # Documentation
└── deployment/             # Docker, CI/CD configurations
```

### Technology Stack

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Authentication**: JWT with bcrypt
- **File Upload**: Multer with Sharp
- **PDF Generation**: PDFKit, PDF-lib
- **Validation**: Joi, express-validator
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI

#### Frontend
- **Framework**: React 18 with Hooks
- **Routing**: React Router v6
- **State Management**: Context API + useReducer
- **Data Fetching**: React Query
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Charts**: Recharts
- **Testing**: Jest, React Testing Library

#### Mobile
- **Framework**: React Native
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit
- **UI Library**: NativeBase or React Native Elements
- **Platform**: iOS and Android

#### Desktop
- **Framework**: Electron
- **Renderer**: React (shared with web)
- **Main Process**: Node.js
- **Auto-updater**: electron-updater
- **Packaging**: electron-builder

## Development Workflow

### 1. Environment Setup

#### Prerequisites
```bash
# Install Node.js 18+
nvm install 18
nvm use 18

# Install global dependencies
npm install -g nodemon pm2 electron

# Clone repository
git clone <repository-url>
cd FinSync360

# Install dependencies
npm run install:all
```

#### Environment Configuration
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure your settings
nano .env
```

### 2. Development Commands

```bash
# Start all services
npm run dev

# Individual services
npm run backend:dev     # Backend API server
npm run frontend:dev    # Frontend web app
npm run mobile:dev      # Mobile development
npm run desktop:dev     # Desktop app
npm run ml-service:dev  # ML service

# Build commands
npm run build           # Build all
npm run backend:build   # Build backend
npm run frontend:build  # Build frontend

# Testing
npm test               # Run all tests
npm run backend:test   # Backend tests
npm run frontend:test  # Frontend tests

# Linting
npm run lint           # Lint all
npm run lint:fix       # Fix linting issues
```

### 3. Code Structure

#### Backend Structure
```
backend/src/
├── controllers/        # Route handlers
├── models/            # Mongoose models
├── routes/            # Express routes
├── middleware/        # Custom middleware
├── services/          # Business logic
├── utils/             # Utility functions
├── config/            # Configuration files
├── validators/        # Input validation
└── scripts/           # Database scripts
```

#### Frontend Structure
```
frontend/src/
├── components/        # Reusable components
│   ├── common/       # Common UI components
│   ├── forms/        # Form components
│   └── layout/       # Layout components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── services/         # API services
├── context/          # React context providers
├── utils/            # Utility functions
└── types/            # TypeScript types
```

### 4. Coding Standards

#### JavaScript/TypeScript
```javascript
// Use ES6+ features
const fetchUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Use destructuring
const { name, email, phone } = user;

// Use template literals
const message = `Welcome ${name}!`;

// Use arrow functions for short functions
const isActive = (user) => user.status === 'active';
```

#### React Components
```jsx
// Use functional components with hooks
const UserList = ({ users, onUserSelect }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  
  const handleUserClick = useCallback((user) => {
    setSelectedUser(user);
    onUserSelect?.(user);
  }, [onUserSelect]);

  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          isSelected={selectedUser?.id === user.id}
          onClick={handleUserClick}
        />
      ))}
    </div>
  );
};
```

#### CSS/Tailwind
```jsx
// Use Tailwind utility classes
<div className="bg-white shadow rounded-lg p-6">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">
    User Profile
  </h2>
  <button className="btn-primary">
    Save Changes
  </button>
</div>

// Use custom CSS classes for complex styles
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Title</h3>
  </div>
  <div className="card-body">
    Content
  </div>
</div>
```

### 5. API Development

#### Route Structure
```javascript
// routes/users.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getUsers, createUser } = require('../controllers/users');

const router = express.Router();

router.use(protect); // All routes require authentication

router
  .route('/')
  .get(getUsers)
  .post(authorize('admin'), createUser);

module.exports = router;
```

#### Controller Pattern
```javascript
// controllers/users.js
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  
  const query = search 
    ? { name: { $regex: search, $options: 'i' } }
    : {};

  const users = await User.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

module.exports = { getUsers };
```

#### Model Definition
```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+$/, 'Please add a valid email']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
UserSchema.index({ email: 1 });

// Pre-save middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance methods
UserSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
```

### 6. Testing

#### Backend Testing
```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });
  });
});
```

#### Frontend Testing
```javascript
// components/__tests__/UserCard.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import UserCard from '../UserCard';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active'
};

describe('UserCard', () => {
  it('renders user information', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<UserCard user={mockUser} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(mockUser);
  });
});
```

### 7. Git Workflow

#### Branch Naming
```bash
# Feature branches
feature/user-management
feature/voucher-creation
feature/tally-integration

# Bug fixes
bugfix/login-validation
bugfix/payment-calculation

# Hotfixes
hotfix/security-patch
hotfix/critical-bug
```

#### Commit Messages
```bash
# Format: type(scope): description
feat(auth): add two-factor authentication
fix(vouchers): correct tax calculation logic
docs(api): update authentication endpoints
style(frontend): improve responsive design
refactor(backend): optimize database queries
test(auth): add unit tests for login flow
```

#### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation
4. Create pull request to `develop`
5. Code review and approval
6. Merge to `develop`
7. Deploy to staging for testing
8. Merge to `main` for production

### 8. Debugging

#### Backend Debugging
```javascript
// Use debug module
const debug = require('debug')('finsync360:auth');

debug('User login attempt:', { email, timestamp: new Date() });

// Use Winston logger
const logger = require('../utils/logger');

logger.info('User registered', { userId, email });
logger.error('Database connection failed', error);
```

#### Frontend Debugging
```javascript
// Use React Developer Tools
// Use browser debugger
debugger;

// Use console methods
console.log('Component rendered:', { props, state });
console.table(users);
console.group('API Call');
console.log('Request:', request);
console.log('Response:', response);
console.groupEnd();
```

### 9. Performance Optimization

#### Backend Optimization
```javascript
// Database optimization
const users = await User.find(query)
  .select('name email status') // Select only needed fields
  .populate('company', 'name') // Populate only needed fields
  .lean(); // Return plain objects

// Caching
const redis = require('redis');
const client = redis.createClient();

const getCachedUsers = async () => {
  const cached = await client.get('users');
  if (cached) return JSON.parse(cached);
  
  const users = await User.find();
  await client.setex('users', 300, JSON.stringify(users));
  return users;
};
```

#### Frontend Optimization
```javascript
// Use React.memo for expensive components
const UserCard = React.memo(({ user, onClick }) => {
  return (
    <div onClick={() => onClick(user)}>
      {user.name}
    </div>
  );
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return users.reduce((sum, user) => sum + user.score, 0);
}, [users]);

// Use useCallback for event handlers
const handleUserClick = useCallback((user) => {
  onUserSelect(user);
}, [onUserSelect]);
```

## Contributing Guidelines

1. **Follow coding standards**
2. **Write comprehensive tests**
3. **Update documentation**
4. **Use meaningful commit messages**
5. **Create detailed pull requests**
6. **Review code thoroughly**
7. **Test on multiple environments**

## Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Best Practices](https://react.dev/learn)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
