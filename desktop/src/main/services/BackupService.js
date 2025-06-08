/**
 * Backup Service for FinSync360 Desktop
 * Handles database backup and restore operations
 */

const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const electronLog = require('electron-log');
const { EventEmitter } = require('events');

class BackupService extends EventEmitter {
  constructor() {
    super();
    this.databaseService = null;
    this.backupDir = path.join(app.getPath('userData'), 'backups');
  }

  async initialize() {
    try {
      electronLog.info('Initializing backup service...');
      
      // Ensure backup directory exists
      await this.ensureBackupDirectory();
      
      electronLog.info('Backup service initialized');
    } catch (error) {
      electronLog.error('Failed to initialize backup service:', error);
      throw error;
    }
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  async createBackup(options = {}) {
    try {
      const { 
        includeData = true, 
        includeSettings = true,
        description = 'Manual backup'
      } = options;
      
      electronLog.info('Creating backup...');
      this.emit('backup-started');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `finsync360-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, `${backupName}.json`);
      
      const backupData = {
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          description,
          includeData,
          includeSettings
        },
        data: {}
      };
      
      if (includeData) {
        backupData.data = await this.exportAllData();
      }
      
      if (includeSettings) {
        backupData.settings = await this.exportSettings();
      }
      
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      
      this.emit('backup-completed', { path: backupPath, name: backupName });
      
      electronLog.info(`Backup created: ${backupPath}`);
      
      return {
        success: true,
        path: backupPath,
        name: backupName
      };
      
    } catch (error) {
      electronLog.error('Backup creation failed:', error);
      this.emit('backup-failed', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async exportAllData() {
    const tables = ['companies', 'vouchers', 'parties', 'inventory', 'users'];
    const data = {};
    
    for (const table of tables) {
      try {
        const records = await this.databaseService.query(`SELECT * FROM ${table}`);
        data[table] = records;
      } catch (error) {
        electronLog.warn(`Failed to export table ${table}:`, error);
        data[table] = [];
      }
    }
    
    return data;
  }

  async exportSettings() {
    try {
      const settings = await this.databaseService.query('SELECT * FROM settings');
      return settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
    } catch (error) {
      electronLog.warn('Failed to export settings:', error);
      return {};
    }
  }

  async restoreBackup(backupPath) {
    try {
      electronLog.info(`Restoring backup from: ${backupPath}`);
      this.emit('restore-started');
      
      const backupContent = await fs.readFile(backupPath, 'utf8');
      const backupData = JSON.parse(backupContent);
      
      if (!backupData.metadata || !backupData.metadata.version) {
        throw new Error('Invalid backup file format');
      }
      
      // Create a backup of current data before restore
      await this.createBackup({ description: 'Pre-restore backup' });
      
      // Clear existing data
      await this.clearAllData();
      
      // Restore data
      if (backupData.data) {
        await this.importAllData(backupData.data);
      }
      
      // Restore settings
      if (backupData.settings) {
        await this.importSettings(backupData.settings);
      }
      
      this.emit('restore-completed', { path: backupPath });
      
      electronLog.info('Backup restored successfully');
      
      return {
        success: true,
        message: 'Backup restored successfully'
      };
      
    } catch (error) {
      electronLog.error('Backup restore failed:', error);
      this.emit('restore-failed', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async clearAllData() {
    const tables = ['vouchers', 'parties', 'inventory', 'users', 'companies'];
    
    for (const table of tables) {
      try {
        await this.databaseService.run(`DELETE FROM ${table}`);
      } catch (error) {
        electronLog.warn(`Failed to clear table ${table}:`, error);
      }
    }
  }

  async importAllData(data) {
    const tables = ['companies', 'users', 'parties', 'inventory', 'vouchers'];
    
    for (const table of tables) {
      if (data[table] && Array.isArray(data[table])) {
        await this.importTableData(table, data[table]);
      }
    }
  }

  async importTableData(tableName, records) {
    try {
      for (const record of records) {
        const fields = Object.keys(record);
        const placeholders = fields.map(() => '?').join(', ');
        const sql = `INSERT OR REPLACE INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const params = fields.map(field => record[field]);
        
        await this.databaseService.run(sql, params);
      }
      
      electronLog.info(`Imported ${records.length} records into ${tableName}`);
    } catch (error) {
      electronLog.error(`Failed to import data into ${tableName}:`, error);
    }
  }

  async importSettings(settings) {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await this.databaseService.run(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [key, value]
        );
      }
      
      electronLog.info('Settings imported successfully');
    } catch (error) {
      electronLog.error('Failed to import settings:', error);
    }
  }

  async getBackupList() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            
            backups.push({
              name: file,
              path: filePath,
              size: stats.size,
              created: data.metadata?.created || stats.birthtime.toISOString(),
              description: data.metadata?.description || 'No description',
              version: data.metadata?.version || 'Unknown'
            });
          } catch (error) {
            electronLog.warn(`Failed to read backup file ${file}:`, error);
          }
        }
      }
      
      return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      electronLog.error('Failed to get backup list:', error);
      return [];
    }
  }

  async deleteBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      await fs.unlink(backupPath);
      
      electronLog.info(`Backup deleted: ${backupName}`);
      
      return {
        success: true,
        message: 'Backup deleted successfully'
      };
    } catch (error) {
      electronLog.error(`Failed to delete backup ${backupName}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async scheduleAutoBackup(interval = 24 * 60 * 60 * 1000) { // 24 hours default
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
    }
    
    this.autoBackupInterval = setInterval(async () => {
      try {
        await this.createBackup({ description: 'Automatic backup' });
        await this.cleanupOldBackups();
      } catch (error) {
        electronLog.error('Auto backup failed:', error);
      }
    }, interval);
    
    electronLog.info(`Auto backup scheduled with interval: ${interval}ms`);
  }

  async cleanupOldBackups(maxBackups = 10) {
    try {
      const backups = await this.getBackupList();
      
      if (backups.length > maxBackups) {
        const backupsToDelete = backups.slice(maxBackups);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.name);
        }
        
        electronLog.info(`Cleaned up ${backupsToDelete.length} old backups`);
      }
    } catch (error) {
      electronLog.error('Failed to cleanup old backups:', error);
    }
  }

  stopAutoBackup() {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
      electronLog.info('Auto backup stopped');
    }
  }
}

module.exports = BackupService;
