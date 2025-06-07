const EventEmitter = require('events');
const cron = require('node-cron');
const electronLog = require('electron-log');
const fs = require('fs-extra');
const path = require('path');

class SyncManager extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.isSyncing = false;
    this.syncJobs = new Map();
    this.offlineQueue = [];
    this.syncHistory = [];
    this.maxHistoryEntries = 1000;
    this.maxQueueSize = 10000;
    
    this.config = {
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
      }
    };
    
    this.logger = electronLog.scope('SyncManager');
    this.dataDir = path.join(require('os').homedir(), '.finsync360-agent');
    
    // Services will be injected
    this.tallyService = null;
    this.webSocketClient = null;
    this.apiClient = null;
  }

  async initialize() {
    this.logger.info('Initializing Sync Manager...');
    
    try {
      // Ensure data directory exists
      await fs.ensureDir(this.dataDir);
      
      // Load configuration
      await this.loadConfig();
      
      // Load offline queue
      await this.loadOfflineQueue();
      
      // Load sync history
      await this.loadSyncHistory();
      
      // Setup scheduled sync
      if (this.config.autoSync) {
        this.setupScheduledSync();
      }
      
      this.logger.info('Sync Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Sync Manager:', error);
      throw error;
    }
  }

  setServices(tallyService, webSocketClient, apiClient) {
    this.tallyService = tallyService;
    this.webSocketClient = webSocketClient;
    this.apiClient = apiClient;
    
    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for WebSocket connection changes
    this.webSocketClient.on('connected', () => {
      this.logger.info('WebSocket connected - processing offline queue');
      this.processOfflineQueue();
    });

    this.webSocketClient.on('disconnected', () => {
      this.logger.info('WebSocket disconnected - enabling offline mode');
      this.config.offlineMode = true;
    });

    // Listen for sync requests from server
    this.webSocketClient.on('sync-request', (data) => {
      this.handleSyncRequest(data);
    });

    // Listen for Tally connection changes
    this.tallyService.on('connectionStatusChanged', (isConnected) => {
      if (isConnected && this.config.autoSync) {
        this.logger.info('Tally connected - starting sync');
        this.startSync();
      }
    });
  }

  async loadConfig() {
    const Store = require('electron-store');
    const store = new Store();
    
    const savedConfig = store.get('syncConfig', {});
    this.config = { ...this.config, ...savedConfig };
    
    this.logger.info('Sync configuration loaded');
  }

  async saveConfig() {
    const Store = require('electron-store');
    const store = new Store();
    
    store.set('syncConfig', this.config);
    this.logger.info('Sync configuration saved');
  }

  async loadOfflineQueue() {
    const queueFile = path.join(this.dataDir, 'offline-queue.json');
    
    try {
      if (await fs.pathExists(queueFile)) {
        const data = await fs.readJson(queueFile);
        this.offlineQueue = Array.isArray(data) ? data : [];
        this.logger.info(`Loaded ${this.offlineQueue.length} items from offline queue`);
      }
    } catch (error) {
      this.logger.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  async saveOfflineQueue() {
    const queueFile = path.join(this.dataDir, 'offline-queue.json');
    
    try {
      await fs.writeJson(queueFile, this.offlineQueue);
    } catch (error) {
      this.logger.error('Failed to save offline queue:', error);
    }
  }

  async loadSyncHistory() {
    const historyFile = path.join(this.dataDir, 'sync-history.json');
    
    try {
      if (await fs.pathExists(historyFile)) {
        const data = await fs.readJson(historyFile);
        this.syncHistory = Array.isArray(data) ? data : [];
        this.logger.info(`Loaded ${this.syncHistory.length} sync history entries`);
      }
    } catch (error) {
      this.logger.error('Failed to load sync history:', error);
      this.syncHistory = [];
    }
  }

  async saveSyncHistory() {
    const historyFile = path.join(this.dataDir, 'sync-history.json');
    
    try {
      // Keep only the latest entries
      if (this.syncHistory.length > this.maxHistoryEntries) {
        this.syncHistory = this.syncHistory.slice(-this.maxHistoryEntries);
      }
      
      await fs.writeJson(historyFile, this.syncHistory);
    } catch (error) {
      this.logger.error('Failed to save sync history:', error);
    }
  }

  setupScheduledSync() {
    if (this.syncJobs.has('scheduled')) {
      this.syncJobs.get('scheduled').destroy();
    }

    const job = cron.schedule(this.config.syncInterval, () => {
      if (!this.isSyncing && this.tallyService.isConnected) {
        this.logger.info('Starting scheduled sync');
        this.startSync();
      }
    }, {
      scheduled: false
    });

    this.syncJobs.set('scheduled', job);
    job.start();
    
    this.logger.info(`Scheduled sync configured: ${this.config.syncInterval}`);
  }

  async startSync() {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress');
      return false;
    }

    this.isSyncing = true;
    this.isRunning = true;
    
    const syncSession = {
      id: this.generateSyncId(),
      startTime: new Date(),
      endTime: null,
      status: 'running',
      totalItems: 0,
      processedItems: 0,
      errors: [],
      summary: {}
    };

    this.logger.info(`Starting sync session: ${syncSession.id}`);
    this.emit('sync-started', syncSession);

    try {
      // Sync companies first
      if (this.config.syncTypes.companies) {
        await this.syncCompanies(syncSession);
      }

      // Sync vouchers
      if (this.config.syncTypes.vouchers) {
        await this.syncVouchers(syncSession);
      }

      // Sync items
      if (this.config.syncTypes.items) {
        await this.syncItems(syncSession);
      }

      // Sync parties
      if (this.config.syncTypes.parties) {
        await this.syncParties(syncSession);
      }

      syncSession.status = 'completed';
      syncSession.endTime = new Date();
      
      this.logger.info(`Sync session completed: ${syncSession.id}`);
      this.emit('sync-completed', syncSession);

    } catch (error) {
      syncSession.status = 'failed';
      syncSession.endTime = new Date();
      syncSession.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      });

      this.logger.error(`Sync session failed: ${syncSession.id}`, error);
      this.emit('sync-failed', syncSession);
    } finally {
      this.isSyncing = false;
      
      // Add to history
      this.syncHistory.push(syncSession);
      await this.saveSyncHistory();
    }

    return true;
  }

  async stopSync() {
    if (!this.isSyncing) {
      return;
    }

    this.isRunning = false;
    this.logger.info('Stopping sync...');
    
    // Wait for current operations to complete
    while (this.isSyncing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.logger.info('Sync stopped');
  }

  async forceSync() {
    this.logger.info('Force sync requested');
    return this.startSync();
  }

  async syncCompanies(syncSession) {
    this.logger.info('Syncing companies...');
    
    try {
      const companies = await this.tallyService.getCompanies();
      syncSession.summary.companies = { total: companies.length, processed: 0, errors: 0 };

      for (const company of companies) {
        if (!this.isRunning) break;

        try {
          await this.syncCompanyToServer(company);
          syncSession.summary.companies.processed++;
          syncSession.processedItems++;
        } catch (error) {
          syncSession.summary.companies.errors++;
          syncSession.errors.push({
            type: 'company',
            item: company.name,
            error: error.message,
            timestamp: new Date()
          });
          this.logger.error(`Failed to sync company ${company.name}:`, error);
        }

        this.emit('sync-progress', {
          sessionId: syncSession.id,
          type: 'companies',
          processed: syncSession.summary.companies.processed,
          total: syncSession.summary.companies.total
        });
      }

      this.logger.info(`Companies sync completed: ${syncSession.summary.companies.processed}/${syncSession.summary.companies.total}`);
    } catch (error) {
      this.logger.error('Failed to sync companies:', error);
      throw error;
    }
  }

  async syncVouchers(syncSession) {
    this.logger.info('Syncing vouchers...');
    
    try {
      // Get date range for sync (last 30 days by default)
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);

      const companies = await this.tallyService.getCompanies();
      let totalVouchers = 0;
      let processedVouchers = 0;
      let errorCount = 0;

      for (const company of companies) {
        if (!this.isRunning) break;

        try {
          const vouchers = await this.tallyService.getVouchers(
            company.name,
            fromDate.toISOString().split('T')[0],
            toDate.toISOString().split('T')[0]
          );

          totalVouchers += vouchers.length;

          for (const voucher of vouchers) {
            if (!this.isRunning) break;

            try {
              await this.syncVoucherToServer(voucher, company.name);
              processedVouchers++;
              syncSession.processedItems++;
            } catch (error) {
              errorCount++;
              syncSession.errors.push({
                type: 'voucher',
                item: `${voucher.voucherNumber} (${company.name})`,
                error: error.message,
                timestamp: new Date()
              });
              this.logger.error(`Failed to sync voucher ${voucher.voucherNumber}:`, error);
            }
          }
        } catch (error) {
          this.logger.error(`Failed to get vouchers for company ${company.name}:`, error);
        }
      }

      syncSession.summary.vouchers = {
        total: totalVouchers,
        processed: processedVouchers,
        errors: errorCount
      };

      this.logger.info(`Vouchers sync completed: ${processedVouchers}/${totalVouchers}`);
    } catch (error) {
      this.logger.error('Failed to sync vouchers:', error);
      throw error;
    }
  }

  async syncItems(syncSession) {
    this.logger.info('Syncing items...');
    
    try {
      const companies = await this.tallyService.getCompanies();
      let totalItems = 0;
      let processedItems = 0;
      let errorCount = 0;

      for (const company of companies) {
        if (!this.isRunning) break;

        try {
          const items = await this.tallyService.getStockItems(company.name);
          totalItems += items.length;

          for (const item of items) {
            if (!this.isRunning) break;

            try {
              await this.syncItemToServer(item, company.name);
              processedItems++;
              syncSession.processedItems++;
            } catch (error) {
              errorCount++;
              syncSession.errors.push({
                type: 'item',
                item: `${item.name} (${company.name})`,
                error: error.message,
                timestamp: new Date()
              });
              this.logger.error(`Failed to sync item ${item.name}:`, error);
            }
          }
        } catch (error) {
          this.logger.error(`Failed to get items for company ${company.name}:`, error);
        }
      }

      syncSession.summary.items = {
        total: totalItems,
        processed: processedItems,
        errors: errorCount
      };

      this.logger.info(`Items sync completed: ${processedItems}/${totalItems}`);
    } catch (error) {
      this.logger.error('Failed to sync items:', error);
      throw error;
    }
  }

  async syncParties(syncSession) {
    // Placeholder for parties sync
    this.logger.info('Parties sync not implemented yet');
    syncSession.summary.parties = { total: 0, processed: 0, errors: 0 };
  }

  async syncCompanyToServer(company) {
    const data = {
      type: 'company',
      action: 'upsert',
      data: company,
      timestamp: new Date().toISOString()
    };

    if (this.webSocketClient.isConnected) {
      this.webSocketClient.sendMessage('sync-data', data);
    } else {
      this.addToOfflineQueue(data);
    }
  }

  async syncVoucherToServer(voucher, companyName) {
    const data = {
      type: 'voucher',
      action: 'upsert',
      data: { ...voucher, companyName },
      timestamp: new Date().toISOString()
    };

    if (this.webSocketClient.isConnected) {
      this.webSocketClient.sendMessage('sync-data', data);
    } else {
      this.addToOfflineQueue(data);
    }
  }

  async syncItemToServer(item, companyName) {
    const data = {
      type: 'item',
      action: 'upsert',
      data: { ...item, companyName },
      timestamp: new Date().toISOString()
    };

    if (this.webSocketClient.isConnected) {
      this.webSocketClient.sendMessage('sync-data', data);
    } else {
      this.addToOfflineQueue(data);
    }
  }

  addToOfflineQueue(data) {
    if (this.offlineQueue.length >= this.maxQueueSize) {
      // Remove oldest items
      this.offlineQueue.splice(0, Math.floor(this.maxQueueSize * 0.1));
    }

    this.offlineQueue.push({
      ...data,
      queuedAt: new Date().toISOString()
    });

    this.saveOfflineQueue();
    this.logger.debug(`Added item to offline queue: ${data.type}`);
  }

  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) {
      return;
    }

    this.logger.info(`Processing ${this.offlineQueue.length} items from offline queue`);

    const batchSize = 10;
    while (this.offlineQueue.length > 0 && this.webSocketClient.isConnected) {
      const batch = this.offlineQueue.splice(0, batchSize);
      
      for (const item of batch) {
        try {
          this.webSocketClient.sendMessage('sync-data', item);
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        } catch (error) {
          this.logger.error('Failed to process offline queue item:', error);
          // Put item back in queue
          this.offlineQueue.unshift(item);
          break;
        }
      }
    }

    await this.saveOfflineQueue();
    this.logger.info('Offline queue processing completed');
  }

  handleSyncRequest(data) {
    this.logger.info('Handling sync request from server:', data);
    
    switch (data.action) {
      case 'start':
        this.startSync();
        break;
      case 'stop':
        this.stopSync();
        break;
      case 'force':
        this.forceSync();
        break;
      default:
        this.logger.warn('Unknown sync request action:', data.action);
    }
  }

  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isSyncing: this.isSyncing,
      config: this.config,
      offlineQueueSize: this.offlineQueue.length,
      lastSync: this.syncHistory.length > 0 ? this.syncHistory[this.syncHistory.length - 1] : null,
      syncHistory: this.syncHistory.slice(-10) // Last 10 entries
    };
  }

  updateConfig(newConfig) {
    const oldInterval = this.config.syncInterval;
    this.config = { ...this.config, ...newConfig };
    
    // If sync interval changed, reschedule
    if (oldInterval !== this.config.syncInterval && this.config.autoSync) {
      this.setupScheduledSync();
    }
    
    this.saveConfig();
    this.logger.info('Sync configuration updated');
  }

  stop() {
    this.isRunning = false;
    
    // Stop all scheduled jobs
    for (const [name, job] of this.syncJobs) {
      job.destroy();
      this.logger.info(`Stopped sync job: ${name}`);
    }
    
    this.syncJobs.clear();
    this.logger.info('Sync Manager stopped');
  }
}

module.exports = SyncManager;
