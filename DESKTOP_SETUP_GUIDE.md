# 🖥️ Desktop App Setup Guide - FinSync360

This guide covers setting up, building, and distributing the Electron desktop application.

## 📋 Prerequisites

### 1. Development Environment

**Required Software:**
- Node.js 18+ 
- npm or yarn
- Git

**Platform-specific requirements:**

**Windows:**
- Visual Studio Build Tools or Visual Studio Community
- Windows SDK

**macOS:**
- Xcode Command Line Tools
```bash
xcode-select --install
```

**Linux:**
- Build essentials
```bash
sudo apt-get install build-essential
```

### 2. Install Dependencies

```bash
cd desktop
npm install

# Install renderer dependencies
cd src/renderer
npm install
cd ../..
```

## 🏗️ Project Structure

```
desktop/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.js     # Main entry point
│   │   ├── config.js   # Configuration
│   │   └── utils/      # Utilities
│   ├── renderer/       # Frontend (React/Vue/Vanilla)
│   │   ├── src/        # Source code
│   │   ├── public/     # Static assets
│   │   └── package.json
│   └── database/       # Local database schema
├── build/              # Build assets (icons, etc.)
├── dist/               # Built applications
├── package.json        # Main package.json
└── electron-builder.json # Build configuration
```

## 🔧 Configuration

### 1. API Configuration

Configure the backend API endpoint:

```javascript
// desktop/src/main/config.js
const isDev = require('electron-is-dev');

const CONFIG = {
  // API Configuration
  API_BASE_URL: isDev 
    ? 'http://localhost:5000/api'
    : 'https://your-app-name-backend.herokuapp.com/api',
    
  // WebSocket Configuration
  WS_URL: isDev 
    ? 'ws://localhost:5000'
    : 'wss://your-app-name-backend.herokuapp.com',
    
  // App Configuration
  APP_NAME: 'FinSync360 Desktop',
  APP_VERSION: '1.0.0',
  
  // Window Configuration
  WINDOW: {
    MIN_WIDTH: 1200,
    MIN_HEIGHT: 800,
    DEFAULT_WIDTH: 1400,
    DEFAULT_HEIGHT: 900,
  },
  
  // Database Configuration
  DATABASE: {
    NAME: 'finsync360_desktop.db',
    VERSION: '1.0',
    PATH: isDev ? './data' : process.env.APPDATA || process.env.HOME,
  },
  
  // Security
  SECURITY: {
    NODE_INTEGRATION: false,
    CONTEXT_ISOLATION: true,
    ENABLE_REMOTE_MODULE: false,
  },
};

module.exports = CONFIG;
```

### 2. Main Process Configuration

```javascript
// desktop/src/main/main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const CONFIG = require('./config');

class FinSync360Desktop {
  constructor() {
    this.mainWindow = null;
    this.isQuitting = false;
  }

  async initialize() {
    await app.whenReady();
    this.createMainWindow();
    this.setupEventHandlers();
    this.setupMenu();
    
    if (!isDev) {
      this.setupAutoUpdater();
    }
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: CONFIG.WINDOW.DEFAULT_WIDTH,
      height: CONFIG.WINDOW.DEFAULT_HEIGHT,
      minWidth: CONFIG.WINDOW.MIN_WIDTH,
      minHeight: CONFIG.WINDOW.MIN_HEIGHT,
      webPreferences: {
        nodeIntegration: CONFIG.SECURITY.NODE_INTEGRATION,
        contextIsolation: CONFIG.SECURITY.CONTEXT_ISOLATION,
        enableRemoteModule: CONFIG.SECURITY.ENABLE_REMOTE_MODULE,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
      icon: path.join(__dirname, '../../build/icon.png'),
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    });

    // Load the app
    const startUrl = isDev 
      ? 'http://localhost:3002' 
      : `file://${path.join(__dirname, '../renderer/dist/index.html')}`;
      
    this.mainWindow.loadURL(startUrl);

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      if (isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });
  }

  setupEventHandlers() {
    // App event handlers
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    // Window event handlers
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });
  }

  setupMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Company',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow.webContents.send('menu-action', 'new-company');
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Tally',
        submenu: [
          {
            label: 'Sync Now',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow.webContents.send('menu-action', 'sync-tally');
            }
          },
          {
            label: 'Sync Settings',
            click: () => {
              this.mainWindow.webContents.send('menu-action', 'sync-settings');
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About FinSync360',
            click: () => {
              this.mainWindow.webContents.send('menu-action', 'about');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupAutoUpdater() {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      this.mainWindow.webContents.send('update-available');
    });

    autoUpdater.on('update-downloaded', () => {
      this.mainWindow.webContents.send('update-downloaded');
    });
  }
}

// Initialize the app
const finSync360 = new FinSync360Desktop();
finSync360.initialize();
```

### 3. Preload Script

```javascript
// desktop/src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File operations
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // Database operations
  executeQuery: (query, params) => ipcRenderer.invoke('db-query', query, params),
  
  // Tally integration
  connectToTally: (config) => ipcRenderer.invoke('tally-connect', config),
  syncWithTally: () => ipcRenderer.invoke('tally-sync'),
  
  // Menu actions
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  
  // Updates
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
});
```

## 🚀 Running the App

### Development Mode

1. **Start the renderer development server:**
```bash
cd desktop/src/renderer
npm run dev
```

2. **In another terminal, start Electron:**
```bash
cd desktop
npm run electron:dev
```

3. **Or use the combined command:**
```bash
cd desktop
npm run dev
```

### Production Mode

```bash
cd desktop
npm run build
npm run electron
```

## 🏗️ Building for Distribution

### Build Configuration

Update `desktop/package.json` build configuration:

```json
{
  "build": {
    "appId": "com.finsync360.desktop",
    "productName": "FinSync360 Desktop",
    "directories": {
      "output": "dist",
      "buildResources": "build"
    },
    "files": [
      "src/main/**/*",
      "src/renderer/dist/**/*",
      "src/database/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "src/database/schema.sql",
        "to": "database/schema.sql"
      }
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico"
    },
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        },
        {
          "target": "zip",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "build/icon.icns",
      "category": "public.app-category.business"
    },
    "linux": {
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        },
        {
          "target": "deb",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.png",
      "category": "Office"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "FinSync360"
    },
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "tally-sync"
    }
  }
}
```

### Build Commands

**Build for current platform:**
```bash
cd desktop
npm run build
```

**Build for specific platforms:**
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

**Build for all platforms:**
```bash
npm run build:all
```

## 📦 Distribution

### Code Signing

**Windows:**
```bash
# Install certificate
# Set environment variables
set CSC_LINK=path/to/certificate.p12
set CSC_KEY_PASSWORD=certificate_password

npm run build:win
```

**macOS:**
```bash
# Install certificate in Keychain
# Set environment variables
export CSC_NAME="Developer ID Application: Your Name"

npm run build:mac
```

### Auto-Updates

Configure auto-updates using electron-updater:

```javascript
// In main process
const { autoUpdater } = require('electron-updater');

// Configure update server
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-username',
  repo: 'tally-sync',
  private: false
});

// Check for updates
autoUpdater.checkForUpdatesAndNotify();
```

### Distribution Channels

1. **Direct Download:**
   - Host installers on your website
   - Use GitHub Releases
   - Use cloud storage (S3, etc.)

2. **App Stores:**
   - Microsoft Store (Windows)
   - Mac App Store (macOS)
   - Snap Store (Linux)

3. **Package Managers:**
   - Chocolatey (Windows)
   - Homebrew (macOS)
   - APT/YUM (Linux)

## 🔐 Security Best Practices

### 1. Secure Configuration

```javascript
// Secure webPreferences
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  enableRemoteModule: false,
  sandbox: true,
  preload: path.join(__dirname, 'preload.js'),
  webSecurity: true,
  allowRunningInsecureContent: false,
  experimentalFeatures: false
}
```

### 2. Content Security Policy

```html
<!-- In renderer HTML -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://your-api-domain.com wss://your-api-domain.com;
">
```

### 3. Validate All IPC Communications

```javascript
// In main process
ipcMain.handle('db-query', async (event, query, params) => {
  // Validate query and params
  if (!isValidQuery(query) || !isValidParams(params)) {
    throw new Error('Invalid query or parameters');
  }
  
  return await database.execute(query, params);
});
```

## 🧪 Testing

### Unit Tests
```bash
cd desktop
npm test
```

### E2E Tests with Spectron
```bash
npm install --save-dev spectron
npm run test:e2e
```

## 🚨 Troubleshooting

### Common Issues

**Build failures:**
```bash
# Clear cache
npm run clean
rm -rf node_modules
npm install
```

**Native dependencies issues:**
```bash
# Rebuild native modules
npm run rebuild
```

**Code signing issues:**
```bash
# Check certificate
security find-identity -v -p codesigning
```

## 📊 Performance Optimization

### 1. Bundle Size
- Use webpack-bundle-analyzer
- Implement code splitting
- Remove unused dependencies

### 2. Memory Usage
- Monitor with Chrome DevTools
- Implement proper cleanup
- Use weak references where appropriate

### 3. Startup Time
- Lazy load modules
- Optimize main process
- Use V8 snapshots

---

**🎉 Your desktop app is now ready for development and distribution!**

For additional resources:
- Electron Documentation: https://electronjs.org/
- Electron Builder: https://electron.build/
- Security Guide: https://electronjs.org/docs/tutorial/security
