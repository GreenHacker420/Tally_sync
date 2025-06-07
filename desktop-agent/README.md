# FinSync360 Desktop Agent

A React-based desktop application for integrating Tally ERP with the FinSync360 system, built with Electron.

## Features

- **Modern React UI**: Built with React 18, Vite, and Tailwind CSS
- **Real-time Sync**: Bidirectional data synchronization between Tally ERP and FinSync360
- **System Monitoring**: Real-time performance monitoring and system health checks
- **Offline Support**: Queue-based offline synchronization with automatic retry
- **Secure Communication**: IPC-based communication between Electron and React
- **Auto Updates**: Built-in update mechanism with user notifications
- **Comprehensive Logging**: Detailed application logs with filtering and export

## Architecture

### Frontend (React)
- **Framework**: React 18 with functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for global state management
- **Routing**: React Router for navigation
- **Icons**: Heroicons for consistent iconography
- **Notifications**: React Hot Toast for user feedback

### Backend (Electron)
- **Main Process**: Electron main process with IPC handlers
- **Services**: Modular service architecture for different functionalities
- **Data Storage**: Electron Store for configuration persistence
- **System Integration**: Native OS integration for tray, notifications, etc.

## Project Structure

```
desktop-agent/
├── main.js                 # Electron main process
├── preload.js             # Electron preload script (IPC bridge)
├── package.json           # Main package configuration
├── src/                   # Electron services
│   └── services/          # Core services (Tally, WebSocket, Sync, etc.)
└── renderer/              # React application
    ├── package.json       # React app dependencies
    ├── vite.config.js     # Vite configuration
    ├── tailwind.config.js # Tailwind CSS configuration
    ├── src/               # React source code
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page components
    │   ├── hooks/         # Custom React hooks
    │   ├── stores/        # Zustand stores
    │   ├── types/         # Type definitions and constants
    │   └── utils/         # Utility functions
    └── dist/              # Built React app (production)
```

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Tally ERP 9 (for testing integration)

### Installation

1. **Install main dependencies**:
   ```bash
   cd desktop-agent
   npm install
   ```

2. **Install React dependencies**:
   ```bash
   cd renderer
   npm install
   ```

### Development

1. **Start development server**:
   ```bash
   npm run dev
   ```
   This will:
   - Start the React development server on http://localhost:3001
   - Launch Electron with hot reloading enabled
   - Enable React DevTools and Electron DevTools

2. **React-only development**:
   ```bash
   cd renderer
   npm run dev
   ```

### Building

1. **Build React app**:
   ```bash
   npm run build
   ```

2. **Package Electron app**:
   ```bash
   npm run electron:pack
   ```

3. **Create distributable**:
   ```bash
   npm run electron:dist
   ```

## Configuration

### Tally ERP Setup
1. Enable ODBC Server in Tally ERP 9
2. Configure port (default: 9000)
3. Ensure companies are loaded

### FinSync360 Server
1. Configure WebSocket server URL
2. Set API key for authentication
3. Configure sync intervals and data types

## Key Components

### React Components

#### Common Components
- **Button**: Reusable button with variants and states
- **Card**: Container component with header, body, and footer
- **Input**: Form input with validation and styling
- **Select**: Dropdown select with options
- **Checkbox**: Checkbox with label and description
- **ProgressBar**: Progress indicator with variants
- **Badge**: Status and category indicators

#### Layout Components
- **Header**: Application header with connection status
- **Sidebar**: Navigation sidebar with menu items

#### Page Components
- **Dashboard**: Overview with quick actions and statistics
- **SyncStatus**: Sync management and progress tracking
- **TallyConnection**: Tally ERP configuration and testing
- **SystemMonitor**: Performance monitoring and system info
- **Logs**: Application logs with filtering and export
- **Settings**: Application configuration and preferences

### Electron Services

#### Core Services
- **TallyService**: Tally ERP communication and data extraction
- **WebSocketClient**: Real-time server communication
- **SyncManager**: Data synchronization orchestration
- **ConfigManager**: Configuration management and persistence
- **SystemMonitor**: System performance monitoring
- **UpdateManager**: Application update handling

## State Management

### Zustand Store Structure
```javascript
{
  connectionStatus: {
    server: 'connected' | 'disconnected' | 'connecting' | 'error',
    tally: 'connected' | 'disconnected' | 'connecting' | 'error'
  },
  syncStatus: {
    status: 'idle' | 'running' | 'completed' | 'failed',
    progress: number,
    history: SyncSession[]
  },
  systemPerformance: {
    cpu: { usage: number, temperature: number },
    memory: { usage: number, total: number, used: number },
    disk: DiskInfo[]
  },
  config: AppConfiguration,
  appState: {
    logs: LogEntry[],
    notifications: Notification[],
    tallyCompanies: Company[]
  }
}
```

## IPC Communication

### Available IPC Channels
- `get-config` / `set-config`: Configuration management
- `tally-test-connection` / `tally-get-companies`: Tally operations
- `sync-start` / `sync-stop` / `sync-status`: Sync operations
- `get-system-info`: System information
- `show-notification`: Display notifications
- `minimize-to-tray` / `quit-app`: Window management

### Event Listeners
- `sync-status-update`: Real-time sync progress
- `tally-connection-update`: Tally connection changes
- `websocket-update`: Server connection changes
- `show-notification`: System notifications

## Styling Guidelines

### Tailwind CSS Usage
- Use utility classes for consistent spacing and sizing
- Follow the established color palette (primary, success, warning, error)
- Implement responsive design with breakpoint prefixes
- Use custom components for complex UI patterns

### Design System
- **Colors**: Primary (blue), Success (green), Warning (yellow), Error (red)
- **Typography**: System font stack with consistent sizing
- **Spacing**: 4px base unit with consistent scale
- **Shadows**: Subtle shadows for depth and hierarchy
- **Animations**: Smooth transitions and micro-interactions

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:coverage
```

### Manual Testing
1. Test Tally ERP connection
2. Verify sync operations
3. Check system monitoring
4. Validate configuration persistence
5. Test offline/online scenarios

## Deployment

### Development Build
- React development server with hot reloading
- Electron with DevTools enabled
- Source maps and debugging enabled

### Production Build
- Optimized React bundle with code splitting
- Minified and compressed assets
- Electron packaged with auto-updater
- Code signing for distribution

## Troubleshooting

### Common Issues
1. **Tally Connection Failed**: Check Tally ODBC server settings
2. **React App Not Loading**: Verify Vite dev server is running
3. **IPC Communication Issues**: Check preload script and context bridge
4. **Build Failures**: Ensure all dependencies are installed

### Debug Mode
Set `NODE_ENV=development` to enable:
- Detailed logging
- React DevTools
- Electron DevTools
- Source maps

## Contributing

1. Follow React and Electron best practices
2. Use TypeScript for type safety
3. Write comprehensive tests
4. Follow the established code style
5. Update documentation for new features

## License

MIT License - see LICENSE file for details
