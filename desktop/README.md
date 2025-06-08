# FinSync360 Desktop Application

A comprehensive ERP desktop application built with Electron, React, and Vite, featuring full offline capabilities and seamless integration with the FinSync360 ecosystem.

## 🚀 Features

### Core Functionality
- **Full ERP Suite**: Complete accounting, inventory, and business management
- **Offline-First**: Works seamlessly without internet connection
- **Real-time Sync**: Automatic synchronization with backend when online
- **Multi-Database**: MongoDB for online, SQLite for offline operations
- **Import/Export**: Support for JSON, CSV, and Excel formats
- **Backup & Restore**: Comprehensive data backup and recovery

### Technical Features
- **Modern Stack**: Electron + React + Vite + Tailwind CSS
- **State Management**: Zustand for efficient state handling
- **Secure Architecture**: Context isolation and secure IPC communication
- **Role-based Access**: Comprehensive permission system
- **Auto-updates**: Built-in update mechanism
- **Cross-platform**: Windows, macOS, and Linux support

## 📁 Project Structure

```
desktop/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.js             # Application entry point
│   │   ├── preload.js          # Secure IPC bridge
│   │   └── services/           # Backend services
│   │       ├── DatabaseService.js      # Database management
│   │       ├── SyncService.js          # Data synchronization
│   │       ├── AuthService.js          # Authentication
│   │       ├── BackupService.js        # Backup operations
│   │       ├── OfflineQueueService.js  # Offline queue
│   │       └── NotificationService.js  # System notifications
│   └── renderer/               # React frontend (Vite)
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── pages/         # Application pages
│       │   ├── stores/        # Zustand state stores
│       │   ├── hooks/         # Custom React hooks
│       │   └── utils/         # Utility functions
│       ├── index.html
│       ├── vite.config.js
│       └── package.json
├── package.json               # Main package configuration
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (for online mode)
- FinSync360 Backend API running

### 1. Install Dependencies

```bash
# Install main dependencies
npm install

# Install renderer dependencies
cd src/renderer
npm install
cd ../..
```

### 2. Environment Setup

Create `.env` file in the root directory:

```env
# Database Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=finsync360

# Backend API
BACKEND_API_URL=http://localhost:5000
ML_SERVICE_URL=http://localhost:8001

# Security
JWT_SECRET=your-secret-key-here

# Development
NODE_ENV=development
```

### 3. Development Mode

```bash
# Start the development environment
npm run dev

# This will:
# 1. Start Vite dev server (React frontend)
# 2. Launch Electron with hot reload
# 3. Open developer tools
```

### 4. Production Build

```bash
# Build the application
npm run build

# Create distributable packages
npm run dist

# Platform-specific builds
npm run build:win    # Windows
npm run build:mac    # macOS  
npm run build:linux  # Linux
```

## 🔧 Configuration

### Database Configuration

The application supports dual database modes:

**Online Mode (MongoDB)**
- Connects to shared MongoDB database
- Real-time synchronization with backend
- Collaborative features enabled

**Offline Mode (SQLite)**
- Local SQLite database
- Queue-based sync when reconnected
- Full functionality without internet

### Sync Configuration

```javascript
// Auto-sync settings
{
  autoSync: true,
  syncInterval: 300000,  // 5 minutes
  offlineMode: false,
  conflictResolution: 'server-wins'
}
```

## 📊 Architecture

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │◄──►│   Electron IPC   │◄──►│  Main Process   │
│   (Renderer)    │    │   (Preload)      │    │   (Services)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Database Layer │
                                               │  MongoDB/SQLite │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Backend API    │
                                               │  Sync Service   │
                                               └─────────────────┘
```

### Security Model

- **Context Isolation**: Renderer process isolated from Node.js
- **Secure IPC**: All communication through preload script
- **Permission System**: Role-based access control
- **Data Encryption**: Passwords hashed with bcrypt
- **Token Management**: JWT-based authentication

## 🔌 API Integration

### Backend Compatibility

The desktop app integrates with all existing backend endpoints:

- **Companies**: `/api/companies/*`
- **Vouchers**: `/api/vouchers/*`
- **Parties**: `/api/parties/*`
- **Inventory**: `/api/inventory/*`
- **Reports**: `/api/reports/*`
- **Users**: `/api/users/*`

### ML Service Integration

- **Predictions**: Payment delay, risk assessment
- **Analytics**: Business metrics, customer insights
- **Forecasting**: Inventory demand, revenue projections

## 💾 Offline Capabilities

### Local Storage

```sql
-- SQLite schema mirrors MongoDB structure
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  companyName TEXT NOT NULL,
  -- ... other fields
  syncStatus TEXT DEFAULT 'pending'
);
```

### Sync Queue

```javascript
// Operations queued when offline
{
  operation: 'create|update|delete',
  tableName: 'vouchers',
  recordId: 'voucher-123',
  data: { /* record data */ },
  timestamp: '2024-01-01T00:00:00Z',
  status: 'pending|synced|failed'
}
```

## 📱 User Interface

### Modern Design
- **Tailwind CSS**: Utility-first styling
- **Responsive Layout**: Adapts to window size
- **Dark/Light Theme**: User preference support
- **Accessibility**: WCAG 2.1 compliant

### Key Components
- **Dashboard**: Business overview and metrics
- **Voucher Management**: Create, edit, approve vouchers
- **Party Management**: Customer and supplier records
- **Inventory Control**: Stock management and tracking
- **Reports**: Financial and business reports
- **Settings**: Application configuration

## 🔄 Synchronization

### Conflict Resolution

1. **Server Wins**: Server data takes precedence
2. **Client Wins**: Local changes override server
3. **Manual Resolution**: User chooses resolution
4. **Merge Strategy**: Intelligent field-level merging

### Sync Process

```javascript
// Sync workflow
1. Check connectivity
2. Upload pending changes
3. Download server updates
4. Resolve conflicts
5. Update local database
6. Notify user of completion
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📦 Distribution

### Auto-updater

The application includes built-in auto-update functionality:

```javascript
// Update configuration
{
  provider: 'github',
  repo: 'finsync360',
  owner: 'your-org',
  private: false
}
```

### Packaging

```bash
# Create installers
npm run dist

# Output files:
# - Windows: FinSync360-Setup-1.0.0.exe
# - macOS: FinSync360-1.0.0.dmg
# - Linux: FinSync360-1.0.0.AppImage
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MongoDB service
   mongod --version
   
   # Verify connection string
   mongodb://localhost:27017/finsync360
   ```

2. **Sync Errors**
   ```bash
   # Check backend API status
   curl http://localhost:5000/api/health
   
   # Review sync logs
   tail -f logs/sync.log
   ```

3. **Build Issues**
   ```bash
   # Clear node modules
   rm -rf node_modules
   npm install
   
   # Rebuild native dependencies
   npm run rebuild
   ```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.finsync360.com](https://docs.finsync360.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/finsync360/issues)
- **Email**: support@finsync360.com
- **Discord**: [FinSync360 Community](https://discord.gg/finsync360)
