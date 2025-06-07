const { autoUpdater } = require('electron-updater');
const electronLog = require('electron-log');
const { dialog } = require('electron');
const EventEmitter = require('events');
const semver = require('semver');

class UpdateManager extends EventEmitter {
  constructor() {
    super();
    this.isChecking = false;
    this.isDownloading = false;
    this.updateAvailable = false;
    this.updateInfo = null;
    this.downloadProgress = null;
    
    this.config = {
      autoCheck: true,
      autoDownload: true,
      autoInstall: false,
      checkInterval: 3600000, // 1 hour
      allowPrerelease: false,
      allowDowngrade: false
    };
    
    this.logger = electronLog.scope('UpdateManager');
    this.checkInterval = null;
    
    this.setupAutoUpdater();
  }

  setupAutoUpdater() {
    // Configure auto updater
    autoUpdater.logger = this.logger;
    autoUpdater.autoDownload = this.config.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.config.autoInstall;
    autoUpdater.allowPrerelease = this.config.allowPrerelease;
    autoUpdater.allowDowngrade = this.config.allowDowngrade;

    // Set up event handlers
    autoUpdater.on('checking-for-update', () => {
      this.isChecking = true;
      this.logger.info('Checking for updates...');
      this.emit('checking-for-update');
    });

    autoUpdater.on('update-available', (info) => {
      this.isChecking = false;
      this.updateAvailable = true;
      this.updateInfo = info;
      
      this.logger.info('Update available:', {
        version: info.version,
        releaseDate: info.releaseDate,
        size: info.files?.[0]?.size
      });
      
      this.emit('update-available', info);
      
      if (!this.config.autoDownload) {
        this.showUpdateAvailableDialog(info);
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      this.isChecking = false;
      this.updateAvailable = false;
      this.updateInfo = null;
      
      this.logger.info('Update not available');
      this.emit('update-not-available', info);
    });

    autoUpdater.on('error', (error) => {
      this.isChecking = false;
      this.isDownloading = false;
      
      this.logger.error('Update error:', error);
      this.emit('update-error', error);
      
      this.showUpdateErrorDialog(error);
    });

    autoUpdater.on('download-progress', (progress) => {
      this.downloadProgress = progress;
      
      this.logger.debug('Download progress:', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond
      });
      
      this.emit('download-progress', progress);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.isDownloading = false;
      this.downloadProgress = null;
      
      this.logger.info('Update downloaded:', {
        version: info.version,
        releaseDate: info.releaseDate
      });
      
      this.emit('update-downloaded', info);
      
      if (!this.config.autoInstall) {
        this.showUpdateReadyDialog(info);
      }
    });
  }

  async initialize() {
    this.logger.info('Initializing Update Manager...');
    
    try {
      // Load configuration
      await this.loadConfig();
      
      // Start automatic checking if enabled
      if (this.config.autoCheck) {
        this.startAutoCheck();
      }
      
      this.logger.info('Update Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Update Manager:', error);
      throw error;
    }
  }

  async loadConfig() {
    const Store = require('electron-store');
    const store = new Store();
    
    const savedConfig = store.get('updateConfig', {});
    this.config = { ...this.config, ...savedConfig };
    
    // Apply configuration to auto updater
    autoUpdater.autoDownload = this.config.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.config.autoInstall;
    autoUpdater.allowPrerelease = this.config.allowPrerelease;
    autoUpdater.allowDowngrade = this.config.allowDowngrade;
    
    this.logger.info('Update configuration loaded');
  }

  async saveConfig() {
    const Store = require('electron-store');
    const store = new Store();
    
    store.set('updateConfig', this.config);
    this.logger.info('Update configuration saved');
  }

  startAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check after 30 seconds
    setTimeout(() => {
      this.checkForUpdates();
    }, 30000);

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.config.checkInterval);

    this.logger.info(`Auto update check started with ${this.config.checkInterval}ms interval`);
  }

  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.logger.info('Auto update check stopped');
  }

  async checkForUpdates() {
    if (this.isChecking) {
      this.logger.warn('Update check already in progress');
      return false;
    }

    try {
      this.logger.info('Manually checking for updates...');
      const result = await autoUpdater.checkForUpdatesAndNotify();
      return result !== null;
    } catch (error) {
      this.logger.error('Failed to check for updates:', error);
      this.emit('update-error', error);
      return false;
    }
  }

  async downloadUpdate() {
    if (!this.updateAvailable) {
      this.logger.warn('No update available to download');
      return false;
    }

    if (this.isDownloading) {
      this.logger.warn('Update download already in progress');
      return false;
    }

    try {
      this.isDownloading = true;
      this.logger.info('Starting update download...');
      await autoUpdater.downloadUpdate();
      return true;
    } catch (error) {
      this.isDownloading = false;
      this.logger.error('Failed to download update:', error);
      this.emit('update-error', error);
      return false;
    }
  }

  quitAndInstall() {
    this.logger.info('Quitting and installing update...');
    autoUpdater.quitAndInstall();
  }

  showUpdateAvailableDialog(info) {
    const currentVersion = require('../../package.json').version;
    const newVersion = info.version;
    
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `FinSync360 Desktop Agent ${newVersion} is available`,
      detail: `You are currently running version ${currentVersion}.\n\nWould you like to download the update now?`,
      buttons: ['Download Now', 'Download Later', 'Skip This Version'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      switch (result.response) {
        case 0: // Download Now
          this.downloadUpdate();
          break;
        case 1: // Download Later
          // Do nothing, user can manually check later
          break;
        case 2: // Skip This Version
          this.skipVersion(newVersion);
          break;
      }
    });
  }

  showUpdateReadyDialog(info) {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: `FinSync360 Desktop Agent ${info.version} has been downloaded`,
      detail: 'The update will be installed when you restart the application.\n\nWould you like to restart now?',
      buttons: ['Restart Now', 'Restart Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        this.quitAndInstall();
      }
    });
  }

  showUpdateErrorDialog(error) {
    dialog.showErrorBox(
      'Update Error',
      `Failed to check for updates:\n\n${error.message}\n\nPlease check your internet connection and try again later.`
    );
  }

  skipVersion(version) {
    const Store = require('electron-store');
    const store = new Store();
    
    store.set('skippedVersion', version);
    this.logger.info(`Skipped version: ${version}`);
  }

  isVersionSkipped(version) {
    const Store = require('electron-store');
    const store = new Store();
    
    const skippedVersion = store.get('skippedVersion');
    return skippedVersion === version;
  }

  getCurrentVersion() {
    return require('../../package.json').version;
  }

  getUpdateStatus() {
    return {
      currentVersion: this.getCurrentVersion(),
      isChecking: this.isChecking,
      isDownloading: this.isDownloading,
      updateAvailable: this.updateAvailable,
      updateInfo: this.updateInfo,
      downloadProgress: this.downloadProgress,
      config: this.config
    };
  }

  updateConfig(newConfig) {
    const oldAutoCheck = this.config.autoCheck;
    const oldInterval = this.config.checkInterval;
    
    this.config = { ...this.config, ...newConfig };
    
    // Apply configuration to auto updater
    autoUpdater.autoDownload = this.config.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.config.autoInstall;
    autoUpdater.allowPrerelease = this.config.allowPrerelease;
    autoUpdater.allowDowngrade = this.config.allowDowngrade;
    
    // Handle auto check changes
    if (oldAutoCheck !== this.config.autoCheck) {
      if (this.config.autoCheck) {
        this.startAutoCheck();
      } else {
        this.stopAutoCheck();
      }
    } else if (this.config.autoCheck && oldInterval !== this.config.checkInterval) {
      this.startAutoCheck(); // Restart with new interval
    }
    
    this.saveConfig();
    this.logger.info('Update configuration updated');
  }

  async getUpdateHistory() {
    // This would typically fetch from a server or local storage
    // For now, return basic information
    return [
      {
        version: this.getCurrentVersion(),
        releaseDate: new Date().toISOString(),
        installed: true,
        notes: 'Current version'
      }
    ];
  }

  async getReleaseNotes(version) {
    try {
      // This would typically fetch from GitHub releases or update server
      // For now, return placeholder
      return {
        version,
        releaseDate: new Date().toISOString(),
        notes: 'Release notes not available',
        features: [],
        bugFixes: [],
        breaking: []
      };
    } catch (error) {
      this.logger.error('Failed to get release notes:', error);
      return null;
    }
  }

  compareVersions(version1, version2) {
    try {
      return semver.compare(version1, version2);
    } catch (error) {
      this.logger.error('Failed to compare versions:', error);
      return 0;
    }
  }

  isNewerVersion(version) {
    try {
      return semver.gt(version, this.getCurrentVersion());
    } catch (error) {
      this.logger.error('Failed to check if version is newer:', error);
      return false;
    }
  }

  stop() {
    this.stopAutoCheck();
    this.logger.info('Update Manager stopped');
  }
}

module.exports = UpdateManager;
