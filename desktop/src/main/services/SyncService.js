/**
 * Sync Service for FinSync360 Desktop
 * Handles synchronization between local SQLite and remote MongoDB/Backend API
 */

const axios = require('axios');
const electronLog = require('electron-log');
const { EventEmitter } = require('events');

class SyncService extends EventEmitter {
  constructor(store) {
    super();
    this.store = store;
    this.databaseService = null;
    this.syncInterval = null;
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncErrors = [];
    
    // Backend API configuration
    this.backendUrl = this.store.get('serverUrl') || 'http://localhost:5000';
    this.mlServiceUrl = this.store.get('mlServiceUrl') || 'http://localhost:8001';
    
    // Sync configuration
    this.syncTables = [
      'companies',
      'vouchers', 
      'parties',
      'inventory',
      'users'
    ];
    
    // API endpoints mapping
    this.apiEndpoints = {
      companies: '/api/companies',
      vouchers: '/api/vouchers',
      parties: '/api/parties',
      inventory: '/api/inventory',
      users: '/api/users'
    };
  }

  async initialize() {
    try {
      electronLog.info('Initializing sync service...');
      
      // Get database service reference
      const { DatabaseService } = require('./DatabaseService');
      this.databaseService = new DatabaseService();
      
      // Load last sync time
      this.lastSyncTime = this.store.get('lastSync');
      
      electronLog.info('Sync service initialized');
    } catch (error) {
      electronLog.error('Failed to initialize sync service:', error);
      throw error;
    }
  }

  async syncNow() {
    if (this.isSyncing) {
      electronLog.warn('Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    try {
      this.isSyncing = true;
      this.emit('sync-started');
      
      electronLog.info('Starting manual sync...');
      
      // Check backend connectivity
      const isBackendOnline = await this.checkBackendConnectivity();
      
      if (!isBackendOnline) {
        throw new Error('Backend server is not accessible');
      }

      // Sync pending operations from queue
      await this.syncPendingOperations();
      
      // Pull latest data from backend
      await this.pullDataFromBackend();
      
      // Update last sync time
      this.lastSyncTime = new Date().toISOString();
      this.store.set('lastSync', this.lastSyncTime);
      
      this.emit('sync-completed', { 
        success: true, 
        timestamp: this.lastSyncTime,
        errors: this.syncErrors 
      });
      
      electronLog.info('Sync completed successfully');
      return { success: true, timestamp: this.lastSyncTime };
      
    } catch (error) {
      electronLog.error('Sync failed:', error);
      this.syncErrors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
      
      this.emit('sync-error', error);
      return { success: false, error: error.message };
      
    } finally {
      this.isSyncing = false;
    }
  }

  async checkBackendConnectivity() {
    try {
      const response = await axios.get(`${this.backendUrl}/api/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      electronLog.warn('Backend connectivity check failed:', error.message);
      return false;
    }
  }

  async syncPendingOperations() {
    try {
      const pendingOps = await this.databaseService.getPendingSyncOperations();
      
      electronLog.info(`Syncing ${pendingOps.length} pending operations`);
      
      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);
          await this.databaseService.markSyncOperationCompleted(op.id);
          
          this.emit('sync-progress', {
            operation: op.operation,
            table: op.tableName,
            recordId: op.recordId,
            status: 'completed'
          });
          
        } catch (error) {
          electronLog.error(`Failed to sync operation ${op.id}:`, error);
          await this.databaseService.markSyncOperationFailed(op.id, error.message);
          
          this.emit('sync-progress', {
            operation: op.operation,
            table: op.tableName,
            recordId: op.recordId,
            status: 'failed',
            error: error.message
          });
        }
      }
    } catch (error) {
      electronLog.error('Failed to sync pending operations:', error);
      throw error;
    }
  }

  async syncOperation(operation) {
    const { operation: op, tableName, recordId, data } = operation;
    const endpoint = this.apiEndpoints[tableName];
    
    if (!endpoint) {
      throw new Error(`No API endpoint defined for table: ${tableName}`);
    }

    const url = `${this.backendUrl}${endpoint}`;
    const parsedData = data ? JSON.parse(data) : null;

    switch (op) {
      case 'create':
        await axios.post(url, parsedData);
        break;
        
      case 'update':
        await axios.put(`${url}/${recordId}`, parsedData);
        break;
        
      case 'delete':
        await axios.delete(`${url}/${recordId}`);
        break;
        
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
  }

  async pullDataFromBackend() {
    try {
      electronLog.info('Pulling latest data from backend...');
      
      for (const tableName of this.syncTables) {
        try {
          await this.pullTableData(tableName);
          
          this.emit('sync-progress', {
            table: tableName,
            status: 'pulled'
          });
          
        } catch (error) {
          electronLog.error(`Failed to pull data for table ${tableName}:`, error);
          this.syncErrors.push({
            table: tableName,
            error: error.message
          });
        }
      }
    } catch (error) {
      electronLog.error('Failed to pull data from backend:', error);
      throw error;
    }
  }

  async pullTableData(tableName) {
    const endpoint = this.apiEndpoints[tableName];
    const url = `${this.backendUrl}${endpoint}`;
    
    // Get last sync time for incremental sync
    const lastSync = this.lastSyncTime;
    const params = lastSync ? { updatedAfter: lastSync } : {};
    
    const response = await axios.get(url, { params });
    const remoteData = response.data;
    
    if (!Array.isArray(remoteData)) {
      electronLog.warn(`Invalid data format for table ${tableName}`);
      return;
    }

    // Update local database with remote data
    for (const record of remoteData) {
      try {
        // Check if record exists locally
        const existingRecord = await this.databaseService.get(
          `SELECT id FROM ${tableName} WHERE id = ?`,
          [record.id || record._id]
        );

        if (existingRecord) {
          // Update existing record
          await this.updateLocalRecord(tableName, record);
        } else {
          // Insert new record
          await this.insertLocalRecord(tableName, record);
        }
      } catch (error) {
        electronLog.error(`Failed to sync record ${record.id} in table ${tableName}:`, error);
      }
    }
  }

  async insertLocalRecord(tableName, record) {
    // Convert MongoDB record to SQLite format
    const localRecord = this.convertToLocalFormat(tableName, record);
    
    // Build insert SQL
    const fields = Object.keys(localRecord);
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const params = fields.map(field => localRecord[field]);
    
    await this.databaseService.run(sql, params);
  }

  async updateLocalRecord(tableName, record) {
    // Convert MongoDB record to SQLite format
    const localRecord = this.convertToLocalFormat(tableName, record);
    
    // Build update SQL
    const setFields = Object.keys(localRecord)
      .filter(field => field !== 'id')
      .map(field => `${field} = ?`);
    
    const sql = `UPDATE ${tableName} SET ${setFields.join(', ')} WHERE id = ?`;
    const params = [
      ...Object.keys(localRecord)
        .filter(field => field !== 'id')
        .map(field => localRecord[field]),
      localRecord.id
    ];
    
    await this.databaseService.run(sql, params);
  }

  convertToLocalFormat(tableName, record) {
    // Convert MongoDB _id to id
    const localRecord = {
      ...record,
      id: record.id || record._id?.toString(),
      syncStatus: 'synced'
    };
    
    // Remove MongoDB specific fields
    delete localRecord._id;
    delete localRecord.__v;
    
    // Convert dates to ISO strings
    if (localRecord.createdAt && typeof localRecord.createdAt === 'object') {
      localRecord.createdAt = localRecord.createdAt.toISOString();
    }
    if (localRecord.updatedAt && typeof localRecord.updatedAt === 'object') {
      localRecord.updatedAt = localRecord.updatedAt.toISOString();
    }
    
    // Table-specific conversions
    switch (tableName) {
      case 'vouchers':
        if (localRecord.ledgerEntries && typeof localRecord.ledgerEntries === 'object') {
          localRecord.ledgerEntries = JSON.stringify(localRecord.ledgerEntries);
        }
        break;
        
      case 'users':
        if (localRecord.permissions && typeof localRecord.permissions === 'object') {
          localRecord.permissions = JSON.stringify(localRecord.permissions);
        }
        break;
    }
    
    return localRecord;
  }

  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    const interval = this.store.get('syncInterval') || 300000; // 5 minutes default
    
    this.syncInterval = setInterval(async () => {
      if (!this.isSyncing) {
        try {
          await this.syncNow();
        } catch (error) {
          electronLog.error('Auto sync failed:', error);
        }
      }
    }, interval);
    
    electronLog.info(`Auto sync started with interval: ${interval}ms`);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      electronLog.info('Auto sync stopped');
    }
  }

  setAutoSync(enabled) {
    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  setOfflineMode(offline) {
    if (offline) {
      this.stopAutoSync();
      electronLog.info('Switched to offline mode');
    } else {
      if (this.store.get('autoSync')) {
        this.startAutoSync();
      }
      electronLog.info('Switched to online mode');
    }
  }

  getStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      autoSyncEnabled: !!this.syncInterval,
      offlineMode: this.store.get('offlineMode'),
      syncErrors: this.syncErrors.slice(-10), // Last 10 errors
      backendUrl: this.backendUrl
    };
  }

  async stop() {
    this.stopAutoSync();
    this.removeAllListeners();
    electronLog.info('Sync service stopped');
  }

  // Backend API integration methods
  async callBackendAPI(method, endpoint, data = null, params = {}) {
    try {
      const config = {
        method,
        url: `${this.backendUrl}${endpoint}`,
        params,
        timeout: 30000
      };
      
      if (data) {
        config.data = data;
      }
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      electronLog.error(`Backend API call failed: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  async callMLServiceAPI(method, endpoint, data = null, params = {}) {
    try {
      const config = {
        method,
        url: `${this.mlServiceUrl}${endpoint}`,
        params,
        timeout: 30000
      };
      
      if (data) {
        config.data = data;
      }
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      electronLog.error(`ML Service API call failed: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }
}

module.exports = SyncService;
