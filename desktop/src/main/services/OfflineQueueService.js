/**
 * Offline Queue Service for FinSync360 Desktop
 * Manages operations queue for offline mode
 */

const electronLog = require('electron-log');
const { EventEmitter } = require('events');

class OfflineQueueService extends EventEmitter {
  constructor() {
    super();
    this.databaseService = null;
    this.processingQueue = false;
    this.queueProcessInterval = null;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  async initialize() {
    try {
      electronLog.info('Initializing offline queue service...');
      
      // Start queue processing
      this.startQueueProcessing();
      
      electronLog.info('Offline queue service initialized');
    } catch (error) {
      electronLog.error('Failed to initialize offline queue service:', error);
      throw error;
    }
  }

  async addOperation(operation) {
    try {
      const { type, table, recordId, data, priority = 'normal' } = operation;
      
      const queueItem = {
        operation: type,
        tableName: table,
        recordId,
        data: JSON.stringify(data),
        priority,
        timestamp: new Date().toISOString(),
        status: 'pending',
        retryCount: 0,
        error: null
      };
      
      const sql = `
        INSERT INTO sync_queue (operation, tableName, recordId, data, timestamp, status, retryCount, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        queueItem.operation,
        queueItem.tableName,
        queueItem.recordId,
        queueItem.data,
        queueItem.timestamp,
        queueItem.status,
        queueItem.retryCount,
        queueItem.error
      ];
      
      const result = await this.databaseService.run(sql, params);
      
      this.emit('operation-queued', {
        id: result.lastInsertRowid,
        ...queueItem
      });
      
      electronLog.info(`Operation queued: ${type} ${table} ${recordId}`);
      
      return {
        success: true,
        queueId: result.lastInsertRowid
      };
      
    } catch (error) {
      electronLog.error('Failed to add operation to queue:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getPendingOperations() {
    try {
      const sql = `
        SELECT * FROM sync_queue 
        WHERE status = 'pending' 
        ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            WHEN 'low' THEN 3 
            ELSE 2 
          END,
          timestamp ASC
      `;
      
      return await this.databaseService.query(sql);
    } catch (error) {
      electronLog.error('Failed to get pending operations:', error);
      return [];
    }
  }

  async getQueueStatus() {
    try {
      const statusQuery = `
        SELECT 
          status,
          COUNT(*) as count
        FROM sync_queue 
        GROUP BY status
      `;
      
      const results = await this.databaseService.query(statusQuery);
      
      const status = {
        pending: 0,
        synced: 0,
        failed: 0,
        total: 0
      };
      
      results.forEach(row => {
        status[row.status] = row.count;
        status.total += row.count;
      });
      
      return status;
    } catch (error) {
      electronLog.error('Failed to get queue status:', error);
      return { pending: 0, synced: 0, failed: 0, total: 0 };
    }
  }

  async markOperationCompleted(queueId) {
    try {
      const sql = `UPDATE sync_queue SET status = 'synced' WHERE id = ?`;
      await this.databaseService.run(sql, [queueId]);
      
      this.emit('operation-completed', { queueId });
    } catch (error) {
      electronLog.error(`Failed to mark operation ${queueId} as completed:`, error);
    }
  }

  async markOperationFailed(queueId, error) {
    try {
      const sql = `
        UPDATE sync_queue 
        SET status = 'failed', error = ?, retryCount = retryCount + 1 
        WHERE id = ?
      `;
      await this.databaseService.run(sql, [error, queueId]);
      
      this.emit('operation-failed', { queueId, error });
    } catch (dbError) {
      electronLog.error(`Failed to mark operation ${queueId} as failed:`, dbError);
    }
  }

  async retryFailedOperations() {
    try {
      const sql = `
        SELECT * FROM sync_queue 
        WHERE status = 'failed' AND retryCount < ?
        ORDER BY timestamp ASC
      `;
      
      const failedOps = await this.databaseService.query(sql, [this.maxRetries]);
      
      for (const op of failedOps) {
        // Reset status to pending for retry
        await this.databaseService.run(
          `UPDATE sync_queue SET status = 'pending' WHERE id = ?`,
          [op.id]
        );
        
        this.emit('operation-retried', { queueId: op.id });
      }
      
      electronLog.info(`Retrying ${failedOps.length} failed operations`);
      
      return failedOps.length;
    } catch (error) {
      electronLog.error('Failed to retry failed operations:', error);
      return 0;
    }
  }

  async clearCompletedOperations(olderThanDays = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const sql = `
        DELETE FROM sync_queue 
        WHERE status = 'synced' AND timestamp < ?
      `;
      
      const result = await this.databaseService.run(sql, [cutoffDate.toISOString()]);
      
      electronLog.info(`Cleared ${result.changes} completed operations older than ${olderThanDays} days`);
      
      return result.changes;
    } catch (error) {
      electronLog.error('Failed to clear completed operations:', error);
      return 0;
    }
  }

  async clearAllOperations() {
    try {
      const sql = `DELETE FROM sync_queue`;
      const result = await this.databaseService.run(sql);
      
      electronLog.info(`Cleared all ${result.changes} operations from queue`);
      
      this.emit('queue-cleared');
      
      return result.changes;
    } catch (error) {
      electronLog.error('Failed to clear all operations:', error);
      return 0;
    }
  }

  startQueueProcessing(interval = 30000) { // 30 seconds default
    if (this.queueProcessInterval) {
      clearInterval(this.queueProcessInterval);
    }
    
    this.queueProcessInterval = setInterval(async () => {
      if (!this.processingQueue) {
        await this.processQueue();
      }
    }, interval);
    
    electronLog.info(`Queue processing started with interval: ${interval}ms`);
  }

  stopQueueProcessing() {
    if (this.queueProcessInterval) {
      clearInterval(this.queueProcessInterval);
      this.queueProcessInterval = null;
      electronLog.info('Queue processing stopped');
    }
  }

  async processQueue() {
    if (this.processingQueue) {
      return;
    }
    
    try {
      this.processingQueue = true;
      
      // Check if we're online (this would be set by sync service)
      const isOnline = await this.checkOnlineStatus();
      
      if (!isOnline) {
        return;
      }
      
      const pendingOps = await this.getPendingOperations();
      
      if (pendingOps.length === 0) {
        return;
      }
      
      electronLog.info(`Processing ${pendingOps.length} pending operations`);
      
      for (const op of pendingOps) {
        try {
          await this.processOperation(op);
          await this.markOperationCompleted(op.id);
          
          // Add delay between operations to avoid overwhelming the server
          await this.delay(100);
          
        } catch (error) {
          electronLog.error(`Failed to process operation ${op.id}:`, error);
          await this.markOperationFailed(op.id, error.message);
        }
      }
      
    } catch (error) {
      electronLog.error('Queue processing error:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  async processOperation(operation) {
    // This would integrate with the sync service to actually perform the operation
    // For now, we'll simulate the operation
    
    const { operation: op, tableName, recordId, data } = operation;
    const parsedData = data ? JSON.parse(data) : null;
    
    electronLog.info(`Processing ${op} operation for ${tableName}:${recordId}`);
    
    // Here you would call the appropriate sync service method
    // await this.syncService.syncOperation(operation);
    
    // Simulate processing time
    await this.delay(500);
    
    this.emit('operation-processed', {
      queueId: operation.id,
      operation: op,
      table: tableName,
      recordId
    });
  }

  async checkOnlineStatus() {
    // This would check if the backend is accessible
    // For now, we'll return true
    return true;
  }

  async getOperationHistory(limit = 100) {
    try {
      const sql = `
        SELECT * FROM sync_queue 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;
      
      return await this.databaseService.query(sql, [limit]);
    } catch (error) {
      electronLog.error('Failed to get operation history:', error);
      return [];
    }
  }

  async getFailedOperations() {
    try {
      const sql = `
        SELECT * FROM sync_queue 
        WHERE status = 'failed' 
        ORDER BY timestamp DESC
      `;
      
      return await this.databaseService.query(sql);
    } catch (error) {
      electronLog.error('Failed to get failed operations:', error);
      return [];
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    this.stopQueueProcessing();
    this.removeAllListeners();
    electronLog.info('Offline queue service stopped');
  }
}

module.exports = OfflineQueueService;
