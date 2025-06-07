const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const electronLog = require('electron-log');
const Store = require('electron-store');
const path = require('path');
const isDev = require('electron-is-dev');

// Import services
const TallyService = require('./src/services/TallyService');
const WebSocketClient = require('./src/services/WebSocketClient');
const SyncManager = require('./src/services/SyncManager');
const ConfigManager = require('./src/services/ConfigManager');
const SystemMonitor = require('./src/services/SystemMonitor');
const UpdateManager = require('./src/services/UpdateManager');

// Configure logging
electronLog.transports.file.level = 'info';
electronLog.transports.console.level = 'debug';

// Initialize store
const store = new Store();

class DesktopAgent {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.isQuitting = false;
    
    // Initialize services
    this.tallyService = new TallyService();
    this.webSocketClient = new WebSocketClient();
    this.syncManager = new SyncManager();
    this.configManager = new ConfigManager();
    this.systemMonitor = new SystemMonitor();
    this.updateManager = new UpdateManager();
    
    this.setupApp();
  }

  setupApp() {
    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.finsync360.desktop-agent');
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
  }

  async onReady() {
    try {
      electronLog.info('FinSync360 Desktop Agent starting...');
      
      // Create main window
      await this.createMainWindow();
      
      // Create system tray
      this.createTray();
      
      // Initialize services
      await this.initializeServices();
      
      // Check for updates
      if (!isDev) {
        this.updateManager.checkForUpdates();
      }
      
      electronLog.info('FinSync360 Desktop Agent started successfully');
    } catch (error) {
      electronLog.error('Failed to start Desktop Agent:', error);
      this.showErrorDialog('Startup Error', 'Failed to start FinSync360 Desktop Agent');
    }
  }

  async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, 'assets/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      },
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // Load the app
    const startUrl = isDev
      ? 'http://localhost:3001'
      : `file://${path.join(__dirname, 'renderer/dist/index.html')}`;

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
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow.hide();
        
        if (process.platform === 'darwin') {
          app.dock.hide();
        }
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
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    this.tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show FinSync360 Agent',
        click: () => this.showMainWindow()
      },
      { type: 'separator' },
      {
        label: 'Sync Status',
        submenu: [
          { label: 'Last Sync: Never', enabled: false },
          { label: 'Status: Disconnected', enabled: false },
          { type: 'separator' },
          { label: 'Force Sync', click: () => this.forcSync() }
        ]
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => this.showSettings()
      },
      {
        label: 'Check for Updates',
        click: () => this.updateManager.checkForUpdates()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => this.quit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('FinSync360 Desktop Agent');
    
    this.tray.on('double-click', () => {
      this.showMainWindow();
    });
  }

  async initializeServices() {
    try {
      // Initialize configuration
      await this.configManager.initialize();
      
      // Initialize Tally service
      await this.tallyService.initialize();
      
      // Initialize WebSocket client
      await this.webSocketClient.initialize();
      
      // Initialize sync manager
      await this.syncManager.initialize();
      
      // Start system monitoring
      this.systemMonitor.start();
      
      electronLog.info('All services initialized successfully');
    } catch (error) {
      electronLog.error('Failed to initialize services:', error);
      throw error;
    }
  }

  setupAutoUpdater() {
    autoUpdater.logger = electronLog;
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('checking-for-update', () => {
      electronLog.info('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
      electronLog.info('Update available:', info);
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
      autoUpdater.quitAndInstall();
    });
  }

  setupIpcHandlers() {
    // Configuration handlers
    ipcMain.handle('get-config', () => this.configManager.getConfig());
    ipcMain.handle('set-config', (event, config) => this.configManager.setConfig(config));
    
    // Tally service handlers
    ipcMain.handle('tally-test-connection', () => this.tallyService.testConnection());
    ipcMain.handle('tally-get-companies', () => this.tallyService.getCompanies());
    
    // Sync handlers
    ipcMain.handle('sync-start', () => this.syncManager.startSync());
    ipcMain.handle('sync-stop', () => this.syncManager.stopSync());
    ipcMain.handle('sync-status', () => this.syncManager.getStatus());
    
    // System handlers
    ipcMain.handle('get-system-info', () => this.systemMonitor.getSystemInfo());
    ipcMain.handle('show-notification', (event, title, body) => {
      this.showNotification(title, body);
    });
    
    // Window handlers
    ipcMain.handle('minimize-to-tray', () => this.mainWindow.hide());
    ipcMain.handle('quit-app', () => this.quit());
  }

  showMainWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
      
      if (process.platform === 'darwin') {
        app.dock.show();
      }
    }
  }

  showSettings() {
    this.showMainWindow();
    // Send message to renderer to show settings
    if (this.mainWindow) {
      this.mainWindow.webContents.send('show-settings');
    }
  }

  async forcSync() {
    try {
      await this.syncManager.forceSync();
      this.showNotification('Sync Started', 'Manual sync initiated successfully');
    } catch (error) {
      electronLog.error('Force sync failed:', error);
      this.showNotification('Sync Failed', 'Failed to start manual sync');
    }
  }

  showNotification(title, body) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('show-notification', { title, body });
    }
  }

  showErrorDialog(title, content) {
    dialog.showErrorBox(title, content);
  }

  onWindowAllClosed() {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
      this.quit();
    }
  }

  onActivate() {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }

  onBeforeQuit() {
    this.isQuitting = true;
  }

  async quit() {
    this.isQuitting = true;
    
    try {
      // Cleanup services
      await this.syncManager.stop();
      await this.webSocketClient.disconnect();
      await this.tallyService.disconnect();
      this.systemMonitor.stop();
      
      electronLog.info('FinSync360 Desktop Agent shutting down...');
    } catch (error) {
      electronLog.error('Error during shutdown:', error);
    }
    
    app.quit();
  }
}

// Create and start the desktop agent
const desktopAgent = new DesktopAgent();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  electronLog.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  electronLog.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
