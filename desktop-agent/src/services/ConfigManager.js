const Store = require('electron-store');
const electronLog = require('electron-log');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto-js');

class ConfigManager {
  constructor() {
    this.store = new Store({
      name: 'finsync360-agent-config',
      defaults: this.getDefaultConfig()
    });
    
    this.logger = electronLog.scope('ConfigManager');
    this.configPath = path.join(require('os').homedir(), '.finsync360-agent', 'config.json');
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  getDefaultConfig() {
    return {
      // Server Configuration
      server: {
        url: 'ws://localhost:5000/tally-agent',
        apiUrl: 'http://localhost:5000/api',
        apiKey: '',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 5000
      },
      
      // Tally Configuration
      tally: {
        host: 'localhost',
        port: 9000,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 5000,
        companies: []
      },
      
      // Sync Configuration
      sync: {
        autoSync: true,
        syncInterval: '*/5 * * * *', // Every 5 minutes
        batchSize: 100,
        maxRetries: 3,
        retryDelay: 5000,
        offlineMode: false,
        syncTypes: {
          vouchers: true,
          items: true,
          parties: true,
          companies: true
        },
        dateRange: {
          vouchers: 30, // Last 30 days
          items: 0, // All items
          parties: 0 // All parties
        }
      },
      
      // Agent Configuration
      agent: {
        id: '',
        name: '',
        version: '1.0.0',
        autoStart: true,
        minimizeToTray: true,
        startMinimized: false,
        checkUpdates: true,
        logLevel: 'info',
        maxLogFiles: 10,
        maxLogSize: '10m'
      },
      
      // Security Configuration
      security: {
        encryptSensitiveData: true,
        sessionTimeout: 3600000, // 1 hour
        maxLoginAttempts: 5,
        lockoutDuration: 300000 // 5 minutes
      },
      
      // UI Configuration
      ui: {
        theme: 'light',
        language: 'en',
        notifications: {
          syncComplete: true,
          syncError: true,
          connectionLost: true,
          updates: true
        },
        dashboard: {
          refreshInterval: 30000, // 30 seconds
          showCharts: true,
          showLogs: true
        }
      }
    };
  }

  async initialize() {
    this.logger.info('Initializing Configuration Manager...');
    
    try {
      // Ensure config directory exists
      await fs.ensureDir(path.dirname(this.configPath));
      
      // Load configuration
      await this.loadConfig();
      
      // Validate configuration
      this.validateConfig();
      
      // Save any updates
      await this.saveConfig();
      
      this.logger.info('Configuration Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Configuration Manager:', error);
      throw error;
    }
  }

  async loadConfig() {
    try {
      // Try to load from file first (for backup/restore)
      if (await fs.pathExists(this.configPath)) {
        const fileConfig = await fs.readJson(this.configPath);
        
        // Decrypt sensitive data
        if (fileConfig.encrypted) {
          fileConfig.server.apiKey = this.decrypt(fileConfig.server.apiKey);
          delete fileConfig.encrypted;
        }
        
        // Merge with store config
        const storeConfig = this.store.store;
        this.store.store = this.mergeConfigs(storeConfig, fileConfig);
      }
      
      this.logger.info('Configuration loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load configuration:', error);
      // Use default configuration
      this.store.clear();
      this.store.store = this.getDefaultConfig();
    }
  }

  async saveConfig() {
    try {
      const config = { ...this.store.store };
      
      // Encrypt sensitive data for file storage
      if (config.security.encryptSensitiveData && config.server.apiKey) {
        config.server.apiKey = this.encrypt(config.server.apiKey);
        config.encrypted = true;
      }
      
      // Save to file for backup
      await fs.writeJson(this.configPath, config, { spaces: 2 });
      
      this.logger.debug('Configuration saved successfully');
    } catch (error) {
      this.logger.error('Failed to save configuration:', error);
    }
  }

  validateConfig() {
    const config = this.store.store;
    let hasChanges = false;
    
    // Validate server configuration
    if (!config.server.url) {
      config.server.url = this.getDefaultConfig().server.url;
      hasChanges = true;
    }
    
    if (!config.server.apiUrl) {
      config.server.apiUrl = this.getDefaultConfig().server.apiUrl;
      hasChanges = true;
    }
    
    // Validate Tally configuration
    if (!config.tally.host) {
      config.tally.host = this.getDefaultConfig().tally.host;
      hasChanges = true;
    }
    
    if (!config.tally.port || config.tally.port < 1 || config.tally.port > 65535) {
      config.tally.port = this.getDefaultConfig().tally.port;
      hasChanges = true;
    }
    
    // Validate sync configuration
    if (!config.sync.syncInterval) {
      config.sync.syncInterval = this.getDefaultConfig().sync.syncInterval;
      hasChanges = true;
    }
    
    // Validate agent ID
    if (!config.agent.id) {
      config.agent.id = this.generateAgentId();
      hasChanges = true;
    }
    
    // Validate agent name
    if (!config.agent.name) {
      config.agent.name = `FinSync360-Agent-${require('os').hostname()}`;
      hasChanges = true;
    }
    
    if (hasChanges) {
      this.store.store = config;
      this.logger.info('Configuration validated and updated');
    }
  }

  mergeConfigs(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.mergeConfigs(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  getConfig(path = null) {
    if (path) {
      return this.getNestedValue(this.store.store, path);
    }
    return { ...this.store.store };
  }

  setConfig(path, value) {
    if (typeof path === 'object') {
      // Setting entire config
      this.store.store = this.mergeConfigs(this.store.store, path);
    } else {
      // Setting specific path
      this.setNestedValue(this.store.store, path, value);
    }
    
    this.saveConfig();
    this.logger.debug(`Configuration updated: ${typeof path === 'object' ? 'bulk update' : path}`);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  // Server Configuration
  getServerConfig() {
    return this.getConfig('server');
  }

  setServerConfig(config) {
    this.setConfig('server', { ...this.getServerConfig(), ...config });
  }

  // Tally Configuration
  getTallyConfig() {
    return this.getConfig('tally');
  }

  setTallyConfig(config) {
    this.setConfig('tally', { ...this.getTallyConfig(), ...config });
  }

  // Sync Configuration
  getSyncConfig() {
    return this.getConfig('sync');
  }

  setSyncConfig(config) {
    this.setConfig('sync', { ...this.getSyncConfig(), ...config });
  }

  // Agent Configuration
  getAgentConfig() {
    return this.getConfig('agent');
  }

  setAgentConfig(config) {
    this.setConfig('agent', { ...this.getAgentConfig(), ...config });
  }

  // Security Configuration
  getSecurityConfig() {
    return this.getConfig('security');
  }

  setSecurityConfig(config) {
    this.setConfig('security', { ...this.getSecurityConfig(), ...config });
  }

  // UI Configuration
  getUIConfig() {
    return this.getConfig('ui');
  }

  setUIConfig(config) {
    this.setConfig('ui', { ...this.getUIConfig(), ...config });
  }

  // Utility methods
  generateAgentId() {
    const { machineId } = require('node-machine-id');
    try {
      const id = machineId(true);
      return crypto.SHA256(id + Date.now()).toString();
    } catch (error) {
      // Fallback to random ID
      return crypto.lib.WordArray.random(32).toString();
    }
  }

  getOrCreateEncryptionKey() {
    let key = this.store.get('_encryptionKey');
    if (!key) {
      key = crypto.lib.WordArray.random(256/8).toString();
      this.store.set('_encryptionKey', key);
    }
    return key;
  }

  encrypt(text) {
    if (!text) return text;
    try {
      return crypto.AES.encrypt(text, this.encryptionKey).toString();
    } catch (error) {
      this.logger.error('Failed to encrypt data:', error);
      return text;
    }
  }

  decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;
    try {
      const bytes = crypto.AES.decrypt(encryptedText, this.encryptionKey);
      return bytes.toString(crypto.enc.Utf8);
    } catch (error) {
      this.logger.error('Failed to decrypt data:', error);
      return encryptedText;
    }
  }

  async exportConfig(filePath) {
    try {
      const config = this.getConfig();
      
      // Remove sensitive data
      const exportConfig = { ...config };
      delete exportConfig.server.apiKey;
      delete exportConfig.agent.id;
      
      await fs.writeJson(filePath, exportConfig, { spaces: 2 });
      this.logger.info(`Configuration exported to: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to export configuration:', error);
      return false;
    }
  }

  async importConfig(filePath) {
    try {
      const importedConfig = await fs.readJson(filePath);
      
      // Validate imported config
      if (!importedConfig.server || !importedConfig.tally) {
        throw new Error('Invalid configuration file');
      }
      
      // Merge with current config (preserve sensitive data)
      const currentConfig = this.getConfig();
      const mergedConfig = this.mergeConfigs(currentConfig, importedConfig);
      
      this.setConfig(mergedConfig);
      this.logger.info(`Configuration imported from: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to import configuration:', error);
      return false;
    }
  }

  resetConfig() {
    const agentId = this.getConfig('agent.id');
    const apiKey = this.getConfig('server.apiKey');
    
    this.store.clear();
    this.store.store = this.getDefaultConfig();
    
    // Preserve agent ID and API key
    if (agentId) {
      this.setConfig('agent.id', agentId);
    }
    if (apiKey) {
      this.setConfig('server.apiKey', apiKey);
    }
    
    this.saveConfig();
    this.logger.info('Configuration reset to defaults');
  }

  getConfigSummary() {
    const config = this.getConfig();
    return {
      agentId: config.agent.id,
      agentName: config.agent.name,
      serverUrl: config.server.url,
      tallyHost: config.tally.host,
      tallyPort: config.tally.port,
      autoSync: config.sync.autoSync,
      syncInterval: config.sync.syncInterval,
      theme: config.ui.theme,
      version: config.agent.version
    };
  }
}

module.exports = ConfigManager;
