/**
 * FinSync360 Desktop Application - Main Process
 * Full ERP Desktop Application with Offline Capabilities
 */

const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const electronLog = require('electron-log');
const Store = require('electron-store');
const path = require('path');
const isDev = require('electron-is-dev');

// Import services
const DatabaseService = require('./services/DatabaseService');
const SyncService = require('./services/SyncService');
const AuthService = require('./services/AuthService');
const BackupService = require('./services/BackupService');
const OfflineQueueService = require('./services/OfflineQueueService');
const NotificationService = require('./services/NotificationService');

// Configure logging
electronLog.transports.file.level = 'info';
electronLog.transports.console.level = 'debug';

class FinSync360Desktop {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.isQuitting = false;
    
    // Initialize store
    this.store = new Store({
      defaults: {
        windowBounds: { width: 1400, height: 900 },
        theme: 'light',
        autoSync: true,
        syncInterval: 300000, // 5 minutes
        offlineMode: false,
        lastSync: null,
        serverUrl: 'http://localhost:5000',
        mlServiceUrl: 'http://localhost:8001',
        mongoUrl: 'mongodb://localhost:27017/finsync360'
      }
    });
    
    // Initialize services
    this.databaseService = new DatabaseService();
    this.syncService = new SyncService(this.store);
    this.authService = new AuthService();
    this.backupService = new BackupService();
    this.offlineQueueService = new OfflineQueueService();
    this.notificationService = new NotificationService();
    
    this.setupApp();
  }
  
  setupApp() {
    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.finsync360.desktop');
    }
    
    // App event handlers
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', () => this.onWindowAllClosed());
    app.on('activate', () => this.onActivate());
    app.on('before-quit', () => this.onBeforeQuit());
    
    // Auto updater events
    this.setupAutoUpdater();
    
    // IPC handlers
    this.setupIpcHandlers();
    
    // Protocol handler for deep links
    this.setupProtocolHandler();
  }
  
  async onReady() {
    try {
      electronLog.info('FinSync360 Desktop starting...');
      
      // Initialize database
      await this.databaseService.initialize();
      
      // Create main window
      await this.createMainWindow();
      
      // Create system tray
      this.createTray();
      
      // Initialize services
      await this.initializeServices();
      
      // Set up menu
      this.createMenu();
      
      // Check for updates
      if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
      }
      
      electronLog.info('FinSync360 Desktop started successfully');
    } catch (error) {
      electronLog.error('Failed to start FinSync360 Desktop:', error);
      this.showErrorDialog('Startup Error', 'Failed to start FinSync360 Desktop');
    }
  }
  
  async createMainWindow() {
    const bounds = this.store.get('windowBounds');
    
    this.mainWindow = new BrowserWindow({
      width: bounds.width,
      height: bounds.height,
      minWidth: 1000,
      minHeight: 700,
      icon: path.join(__dirname, '../assets/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: !isDev
      },
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      frame: true
    });
    
    // Load the app
    const startUrl = isDev
      ? 'http://localhost:3002'
      : `file://${path.join(__dirname, '../renderer/dist/index.html')}`;
    
    await this.mainWindow.loadURL(startUrl);
    
    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      if (isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });
    
    // Handle window events
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow.hide();
      } else {
        // Save window bounds
        this.store.set('windowBounds', this.mainWindow.getBounds());
      }
    });
    
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
    
    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }
  
  createTray() {
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    this.tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show FinSync360',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Sync Now',
        click: () => this.syncService.syncNow()
      },
      {
        label: 'Offline Mode',
        type: 'checkbox',
        checked: this.store.get('offlineMode'),
        click: (item) => {
          this.store.set('offlineMode', item.checked);
          this.syncService.setOfflineMode(item.checked);
        }
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
            this.mainWindow.webContents.send('navigate-to', '/settings');
          }
        }
      },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('FinSync360 Desktop');
    
    this.tray.on('double-click', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });
  }
  
  async initializeServices() {
    try {
      // Initialize authentication service
      await this.authService.initialize();
      
      // Initialize sync service
      await this.syncService.initialize();
      
      // Initialize offline queue service
      await this.offlineQueueService.initialize();
      
      // Initialize notification service
      await this.notificationService.initialize();
      
      // Start auto sync if enabled
      if (this.store.get('autoSync')) {
        this.syncService.startAutoSync();
      }
      
      electronLog.info('All services initialized successfully');
    } catch (error) {
      electronLog.error('Failed to initialize services:', error);
      throw error;
    }
  }
  
  setupAutoUpdater() {
    autoUpdater.logger = electronLog;
    autoUpdater.logger.transports.file.level = 'info';
    
    autoUpdater.on('checking-for-update', () => {
      electronLog.info('Checking for update...');
    });
    
    autoUpdater.on('update-available', (info) => {
      electronLog.info('Update available:', info);
      this.notificationService.showNotification('Update Available', 'A new version is being downloaded.');
    });
    
    autoUpdater.on('update-not-available', (info) => {
      electronLog.info('Update not available:', info);
    });
    
    autoUpdater.on('error', (err) => {
      electronLog.error('Error in auto-updater:', err);
    });
    
    autoUpdater.on('download-progress', (progressObj) => {
      let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
      logMessage += ` - Downloaded ${progressObj.percent}%`;
      logMessage += ` (${progressObj.transferred}/${progressObj.total})`;
      electronLog.info(logMessage);
    });
    
    autoUpdater.on('update-downloaded', (info) => {
      electronLog.info('Update downloaded:', info);
      this.notificationService.showNotification('Update Ready', 'Update will be installed on restart.');
    });
  }
  
  setupProtocolHandler() {
    // Register protocol for deep links
    if (!app.isDefaultProtocolClient('finsync360')) {
      app.setAsDefaultProtocolClient('finsync360');
    }
    
    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleDeepLink(url);
    });
  }
  
  handleDeepLink(url) {
    electronLog.info('Deep link received:', url);
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.webContents.send('deep-link', url);
    }
  }
  
  setupIpcHandlers() {
    // Database operations
    ipcMain.handle('db-query', async (event, query, params) => {
      return await this.databaseService.query(query, params);
    });
    
    ipcMain.handle('db-run', async (event, query, params) => {
      return await this.databaseService.run(query, params);
    });
    
    // Authentication
    ipcMain.handle('auth-login', async (event, credentials) => {
      return await this.authService.login(credentials);
    });
    
    ipcMain.handle('auth-logout', async (event) => {
      return await this.authService.logout();
    });
    
    ipcMain.handle('auth-get-user', async (event) => {
      return await this.authService.getCurrentUser();
    });
    
    // Sync operations
    ipcMain.handle('sync-now', async (event) => {
      return await this.syncService.syncNow();
    });
    
    ipcMain.handle('sync-status', async (event) => {
      return await this.syncService.getStatus();
    });
    
    // Settings
    ipcMain.handle('settings-get', (event, key) => {
      return this.store.get(key);
    });
    
    ipcMain.handle('settings-set', (event, key, value) => {
      this.store.set(key, value);
      return true;
    });
    
    // File operations
    ipcMain.handle('show-save-dialog', async (event, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow, options);
      return result;
    });
    
    ipcMain.handle('show-open-dialog', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow, options);
      return result;
    });
    
    // Notifications
    ipcMain.handle('show-notification', (event, title, body, options = {}) => {
      this.notificationService.showNotification(title, body, options);
    });
  }
  
  createMenu() {
    // Menu implementation will be added in the next part
  }
  
  onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
  
  onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }
  
  onBeforeQuit() {
    this.isQuitting = true;
  }
  
  showErrorDialog(title, content) {
    dialog.showErrorBox(title, content);
  }
}

// Create and start the desktop application
const desktopApp = new FinSync360Desktop();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  electronLog.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  electronLog.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
