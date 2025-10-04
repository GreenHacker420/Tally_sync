import winston from 'winston';
import cron from 'node-cron';
import TallySync from '../models/TallySync.js';
import TallyConnection from '../models/TallyConnection.js';
import tallyCommunicationService from './tallyCommunicationService.js';
import tallyXmlService from './tallyXmlService.js';
import Voucher from '../models/Voucher.js';
import Item from '../models/Item.js';
import Party from '../models/Party.js';
import Company from '../models/Company.js';

class TallySyncService {
  constructor() {
    this.isRunning = false;
    this.syncQueue = [];
    this.conflictQueue = [];
    this.scheduledJobs = new Map();
    
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'tally-sync' },
      transports: [
        new winston.transports.File({ filename: 'logs/sync-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/sync-combined.log' })
      ]
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }

    // Start background processes only in non-test environment
    if (process.env.NODE_ENV !== 'test') {
      this.startBackgroundProcesses();
    }
  }

  /**
   * Start background sync processes
   */
  startBackgroundProcesses() {
    // Process sync queue every 30 seconds
    cron.schedule('*/30 * * * * *', () => {
      this.processSyncQueue();
    });

    // Process conflict queue every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.processConflictQueue();
    });

    // Cleanup stale connections every 10 minutes
    cron.schedule('*/10 * * * *', () => {
      TallyConnection.cleanupStaleConnections();
    });

    this.logger.info('Background sync processes started');
  }

  /**
   * Sync entity to Tally
   * @param {string} entityType - Type of entity (voucher, item, party)
   * @param {string} entityId - Entity ID
   * @param {string} companyId - Company ID
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync result
   */
  async syncToTally(entityType, entityId, companyId, options = {}) {
    try {
      this.logger.info('Starting sync to Tally', { entityType, entityId, companyId });

      // Get or create sync record
      let syncRecord = await TallySync.findOne({
        entityType,
        entityId,
        company: companyId
      });

      if (!syncRecord) {
        syncRecord = new TallySync({
          entityType,
          entityId,
          company: companyId,
          syncDirection: 'to_tally',
          priority: options.priority || 'normal',
          createdBy: options.userId
        });
      }

      // Update sync status
      syncRecord.syncStatus = 'in_progress';
      syncRecord.lastSyncAttempt = new Date();
      syncRecord.syncAttempts += 1;
      await syncRecord.save();

      // Get entity data
      const entity = await this.getEntityData(entityType, entityId);
      if (!entity) {
        throw new Error(`Entity not found: ${entityType}/${entityId}`);
      }

      // Get active Tally connection
      const connection = await this.getActiveConnection(companyId);
      const connectionOptions = this.buildConnectionOptions(connection);

      // Send to Tally
      let response;
      switch (entityType) {
        case 'voucher':
          response = await tallyCommunicationService.sendVoucherToTally(entity, connectionOptions);
          break;
        case 'item':
          response = await tallyCommunicationService.sendStockItemToTally(entity, connectionOptions);
          break;
        case 'party':
          response = await tallyCommunicationService.sendLedgerToTally(entity, connectionOptions);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      if (response.success) {
        // Update sync record as completed
        await syncRecord.markAsCompleted(response.data);
        
        // Update entity's tally sync info
        await this.updateEntityTallyInfo(entityType, entityId, {
          synced: true,
          tallyId: response.data.id || syncRecord.tallyId,
          lastSyncDate: new Date()
        });

        this.logger.info('Sync to Tally completed successfully', {
          entityType,
          entityId,
          responseTime: response.responseTime
        });

        return { success: true, syncRecord, response };
      } else {
        throw new Error('Tally sync failed: ' + (response.error || 'Unknown error'));
      }

    } catch (error) {
      this.logger.error('Sync to Tally failed', {
        entityType,
        entityId,
        error: error.message
      });

      // Update sync record as failed
      if (syncRecord) {
        await syncRecord.markAsFailed(error);
      }

      throw error;
    }
  }

  /**
   * Sync entity from Tally
   * @param {string} entityType - Type of entity
   * @param {string} tallyId - Tally entity ID
   * @param {string} companyId - Company ID
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync result
   */
  async syncFromTally(entityType, tallyId, companyId, options = {}) {
    try {
      this.logger.info('Starting sync from Tally', { entityType, tallyId, companyId });

      // Get active Tally connection
      const connection = await this.getActiveConnection(companyId);
      const connectionOptions = this.buildConnectionOptions(connection);

      // Export data from Tally
      const reportName = this.getReportName(entityType);
      const filters = { 
        company: connection.tallyInfo.companyName,
        id: tallyId 
      };

      const response = await tallyCommunicationService.exportFromTally(
        reportName, 
        filters, 
        connectionOptions
      );

      if (!response.success) {
        throw new Error('Failed to export from Tally: ' + (response.error || 'Unknown error'));
      }

      // Parse and map Tally data
      const tallyData = this.parseTallyData(entityType, response.data);
      
      // Find existing entity or create new one
      const existingEntity = await this.findEntityByTallyId(entityType, tallyId, companyId);
      
      if (existingEntity) {
        // Check for conflicts
        const conflicts = this.detectConflicts(existingEntity, tallyData);
        
        if (conflicts.length > 0) {
          return this.handleConflict(existingEntity, tallyData, conflicts, options);
        } else {
          // Update existing entity
          return this.updateEntityFromTally(existingEntity, tallyData, options);
        }
      } else {
        // Create new entity
        return this.createEntityFromTally(entityType, tallyData, companyId, options);
      }

    } catch (error) {
      this.logger.error('Sync from Tally failed', {
        entityType,
        tallyId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    try {
      // Get pending syncs grouped by company
      const companies = await Company.find({ 
        'tallyIntegration.enabled': true,
        isActive: true 
      });

      for (const company of companies) {
        const pendingSyncs = await TallySync.getPendingSyncs(company._id, {
          limit: 10 // Process 10 items per company per cycle
        });

        for (const syncRecord of pendingSyncs) {
          try {
            // Check if retry is due
            if (syncRecord.syncStatus === 'failed' && !syncRecord.isDueForRetry()) {
              continue;
            }

            await this.syncToTally(
              syncRecord.entityType,
              syncRecord.entityId,
              syncRecord.company,
              { 
                userId: syncRecord.createdBy,
                priority: syncRecord.priority 
              }
            );

          } catch (error) {
            this.logger.error('Error processing sync queue item', {
              syncId: syncRecord._id,
              error: error.message
            });
          }
        }
      }

    } catch (error) {
      this.logger.error('Error processing sync queue', { error: error.message });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process conflict queue
   */
  async processConflictQueue() {
    try {
      const conflicts = await TallySync.find({
        syncStatus: 'conflict',
        'conflictData.resolutionStrategy': { $ne: 'manual' }
      }).limit(20);

      for (const conflict of conflicts) {
        try {
          await this.resolveConflict(conflict);
        } catch (error) {
          this.logger.error('Error resolving conflict', {
            conflictId: conflict._id,
            error: error.message
          });
        }
      }

    } catch (error) {
      this.logger.error('Error processing conflict queue', { error: error.message });
    }
  }

  /**
   * Schedule automatic sync for company
   * @param {string} companyId - Company ID
   * @param {Object} settings - Sync settings
   */
  scheduleAutoSync(companyId, settings) {
    // Cancel existing job if any
    if (this.scheduledJobs.has(companyId)) {
      this.scheduledJobs.get(companyId).destroy();
    }

    if (!settings.autoSync) return;

    // Create cron expression from interval (in milliseconds)
    const intervalMinutes = Math.floor(settings.syncInterval / 60000);
    const cronExpression = `*/${intervalMinutes} * * * *`;

    const job = cron.schedule(cronExpression, async () => {
      try {
        await this.performFullSync(companyId);
      } catch (error) {
        this.logger.error('Scheduled sync failed', { companyId, error: error.message });
      }
    }, { scheduled: false });

    job.start();
    this.scheduledJobs.set(companyId, job);

    this.logger.info('Auto sync scheduled', { companyId, intervalMinutes });
  }

  /**
   * Perform full sync for company
   * @param {string} companyId - Company ID
   */
  async performFullSync(companyId) {
    this.logger.info('Starting full sync', { companyId });

    const company = await Company.findById(companyId);
    if (!company || !company.tallyIntegration.enabled) {
      throw new Error('Tally integration not enabled for company');
    }

    const settings = company.tallyIntegration.syncSettings;
    const results = {
      vouchers: { success: 0, failed: 0 },
      items: { success: 0, failed: 0 },
      parties: { success: 0, failed: 0 }
    };

    // Sync vouchers
    if (settings.syncVouchers) {
      const vouchers = await Voucher.find({ 
        company: companyId, 
        'tallySync.synced': false 
      }).limit(50);

      for (const voucher of vouchers) {
        try {
          await this.syncToTally('voucher', voucher._id, companyId);
          results.vouchers.success++;
        } catch (error) {
          results.vouchers.failed++;
        }
      }
    }

    // Sync items
    if (settings.syncInventory) {
      const items = await Item.find({ 
        company: companyId, 
        'tallySync.synced': false 
      }).limit(50);

      for (const item of items) {
        try {
          await this.syncToTally('item', item._id, companyId);
          results.items.success++;
        } catch (error) {
          results.items.failed++;
        }
      }
    }

    // Sync parties
    if (settings.syncMasters) {
      const parties = await Party.find({ 
        company: companyId, 
        'tallySync.synced': false 
      }).limit(50);

      for (const party of parties) {
        try {
          await this.syncToTally('party', party._id, companyId);
          results.parties.success++;
        } catch (error) {
          results.parties.failed++;
        }
      }
    }

    // Update company last sync date
    company.tallyIntegration.lastSyncDate = new Date();
    await company.save();

    this.logger.info('Full sync completed', { companyId, results });
    return results;
  }

  /**
   * Get entity data by type and ID
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Entity data
   */
  async getEntityData(entityType, entityId) {
    const models = {
      voucher: Voucher,
      item: Item,
      party: Party
    };

    const Model = models[entityType];
    if (!Model) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    return Model.findById(entityId).populate('company party items.item');
  }

  /**
   * Get active Tally connection for company
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Active connection
   */
  async getActiveConnection(companyId) {
    const connections = await TallyConnection.findActiveConnections(companyId);
    
    if (connections.length === 0) {
      throw new Error('No active Tally connection found');
    }

    // Return the most recently connected one
    return connections.sort((a, b) => b.lastConnected - a.lastConnected)[0];
  }

  /**
   * Build connection options from Tally connection
   * @param {Object} connection - Tally connection
   * @returns {Object} Connection options
   */
  buildConnectionOptions(connection) {
    return {
      method: connection.connectionDetails.protocol,
      agentId: connection.agentId,
      host: connection.systemInfo.ipAddress || 'localhost',
      port: connection.connectionDetails.port || 9000,
      timeout: 30000
    };
  }

  /**
   * Update entity Tally sync information
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} tallyInfo - Tally sync info
   */
  async updateEntityTallyInfo(entityType, entityId, tallyInfo) {
    const models = {
      voucher: Voucher,
      item: Item,
      party: Party
    };

    const Model = models[entityType];
    if (Model) {
      await Model.findByIdAndUpdate(entityId, {
        $set: { tallySync: tallyInfo }
      });
    }
  }

  /**
   * Get Tally report name for entity type
   * @param {string} entityType - Entity type
   * @returns {string} Report name
   */
  getReportName(entityType) {
    const reportNames = {
      voucher: 'Vouchers',
      item: 'StockItems',
      party: 'Ledgers'
    };
    
    return reportNames[entityType] || 'Vouchers';
  }

  /**
   * Parse Tally data based on entity type
   * @param {string} entityType - Entity type
   * @param {Object} tallyData - Raw Tally data
   * @returns {Object} Parsed data
   */
  parseTallyData(entityType, tallyData) {
    // TODO: Implement parsing logic for each entity type
    return tallyData;
  }

  /**
   * Find entity by Tally ID
   * @param {string} entityType - Entity type
   * @param {string} tallyId - Tally ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Entity
   */
  async findEntityByTallyId(entityType, tallyId, companyId) {
    const models = {
      voucher: Voucher,
      item: Item,
      party: Party
    };

    const Model = models[entityType];
    if (!Model) return null;

    return Model.findOne({
      company: companyId,
      'tallySync.tallyId': tallyId
    });
  }

  /**
   * Detect conflicts between FinSync and Tally data
   * @param {Object} finSyncData - FinSync entity data
   * @param {Object} tallyData - Tally entity data
   * @returns {Array} Array of conflict fields
   */
  detectConflicts(finSyncData, tallyData) {
    // TODO: Implement conflict detection logic
    return [];
  }

  /**
   * Handle data conflict
   * @param {Object} existingEntity - Existing entity
   * @param {Object} tallyData - Tally data
   * @param {Array} conflicts - Conflict fields
   * @param {Object} options - Options
   * @returns {Promise<Object>} Conflict resolution result
   */
  async handleConflict(existingEntity, tallyData, conflicts, options) {
    // TODO: Implement conflict handling logic
    return { success: false, conflict: true };
  }

  /**
   * Update entity from Tally data
   * @param {Object} entity - Existing entity
   * @param {Object} tallyData - Tally data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Update result
   */
  async updateEntityFromTally(entity, tallyData, options) {
    // TODO: Implement update logic
    return { success: true, updated: true };
  }

  /**
   * Create entity from Tally data
   * @param {string} entityType - Entity type
   * @param {Object} tallyData - Tally data
   * @param {string} companyId - Company ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Creation result
   */
  async createEntityFromTally(entityType, tallyData, companyId, options) {
    // TODO: Implement creation logic
    return { success: true, created: true };
  }

  /**
   * Resolve conflict
   * @param {Object} conflict - Conflict record
   * @returns {Promise<Object>} Resolution result
   */
  async resolveConflict(conflict) {
    // TODO: Implement conflict resolution logic
    return { success: true, resolved: true };
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs() {
    for (const [companyId, job] of this.scheduledJobs) {
      job.destroy();
    }
    this.scheduledJobs.clear();
    this.logger.info('All scheduled sync jobs stopped');
  }
}

export default new TallySyncService();
