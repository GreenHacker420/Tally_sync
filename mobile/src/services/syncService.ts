import { apiClient } from './apiClient';
import { databaseService } from './databaseService';
import { webSocketService } from './webSocketService';
import { SyncSession, SyncProgress, SyncStatus, Voucher, InventoryItem, SyncConflict } from '../types';
import { store } from '../store';
import { setSyncProgress, addSyncSession, setSyncStatus } from '../store/slices/syncSlice';
import { setNetworkStatus } from '../store/slices/networkSlice';
import NetInfo from '@react-native-community/netinfo';

export interface ConflictResolutionStrategy {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  mergeFunction?: (local: any, remote: any) => any;
}

export interface SyncOptions {
  conflictResolution?: ConflictResolutionStrategy;
  batchSize?: number;
  retryAttempts?: number;
  syncDirection?: 'up' | 'down' | 'both';
  entities?: string[];
}

class SyncService {
  private isOnline = false;
  private syncInProgress = false;
  private currentSession: SyncSession | null = null;
  private conflicts: SyncConflict[] = [];
  private syncQueue: any[] = [];
  private retryQueue: any[] = [];

  constructor() {
    this.setupWebSocketListeners();
    this.setupNetworkListener();
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;

      store.dispatch(setNetworkStatus({
        isOnline: this.isOnline,
        connectionType: state.type,
      }));

      // Process pending changes when coming back online
      if (!wasOnline && this.isOnline) {
        this.processPendingChanges();
        this.processRetryQueue();
      }
    });
  }

  /**
   * Setup WebSocket listeners for real-time sync
   */
  private setupWebSocketListeners(): void {
    webSocketService.on('sync-request', (data) => {
      this.handleSyncRequest(data);
    });

    webSocketService.on('sync-progress', (progress: SyncProgress) => {
      store.dispatch(setSyncProgress(progress));
    });

    webSocketService.on('sync-conflict', (conflict: SyncConflict) => {
      this.handleSyncConflict(conflict);
    });

    webSocketService.on('connected', () => {
      this.isOnline = true;
      this.processPendingChanges();
    });

    webSocketService.on('disconnected', () => {
      this.isOnline = false;
    });
  }

  /**
   * Start synchronization process with enhanced options
   */
  async startSync(options: SyncOptions = {}): Promise<{ success: boolean; session?: SyncSession }> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    this.syncInProgress = true;

    const session: SyncSession = {
      id: this.generateSyncId(),
      startTime: new Date().toISOString(),
      status: 'syncing',
      totalItems: 0,
      processedItems: 0,
      errors: [],
      summary: {},
      conflicts: [],
    };

    this.currentSession = session;
    store.dispatch(setSyncStatus('syncing'));

    try {
      // Sync companies first
      await this.syncCompanies(session);

      // Sync vouchers
      await this.syncVouchers(session);

      // Sync inventory items
      await this.syncInventoryItems(session);

      // Upload pending changes
      await this.uploadPendingChanges();

      session.status = 'completed';
      session.endTime = new Date().toISOString();

      // Add to sync history
      store.dispatch(addSyncSession(session));

      return { success: true, session };
    } catch (error: any) {
      session.status = 'error';
      session.endTime = new Date().toISOString();
      session.errors.push({
        type: 'general',
        item: 'sync',
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      store.dispatch(addSyncSession(session));
      throw error;
    } finally {
      this.syncInProgress = false;
      this.currentSession = null;
    }
  }

  /**
   * Stop synchronization process
   */
  async stopSync(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.status = 'error';
      this.currentSession.endTime = new Date().toISOString();
      store.dispatch(addSyncSession(this.currentSession));
    }
    
    this.syncInProgress = false;
    this.currentSession = null;
  }

  /**
   * Force synchronization
   */
  async forceSync(): Promise<{ success: boolean; session?: SyncSession }> {
    return this.startSync();
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<{
    status: SyncStatus;
    lastSyncTime?: string;
    pendingChanges?: number;
    history?: SyncSession[];
  }> {
    try {
      const response = await apiClient.get('/sync/status');
      return response.data.data;
    } catch (error) {
      // Return local status if API call fails
      const pendingChanges = await databaseService.getPendingChangesCount();
      const history = await databaseService.getSyncHistory();
      
      return {
        status: this.syncInProgress ? 'syncing' : 'idle',
        pendingChanges,
        history: history.slice(0, 10),
      };
    }
  }

  /**
   * Sync companies from server
   */
  private async syncCompanies(session: SyncSession): Promise<void> {
    try {
      const response = await apiClient.get('/companies');
      const companies = response.data.data;

      session.summary.companies = {
        total: companies.length,
        processed: 0,
        errors: 0,
      };

      for (const company of companies) {
        try {
          await databaseService.upsertCompany(company);
          session.summary.companies.processed++;
          session.processedItems++;
        } catch (error: any) {
          session.summary.companies.errors++;
          session.errors.push({
            type: 'company',
            item: company.name,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }

        // Update progress
        store.dispatch(setSyncProgress({
          type: 'companies',
          current: session.summary.companies.processed,
          total: session.summary.companies.total,
          percentage: (session.summary.companies.processed / session.summary.companies.total) * 100,
          message: `Syncing companies: ${session.summary.companies.processed}/${session.summary.companies.total}`,
        }));
      }
    } catch (error: any) {
      throw new Error(`Failed to sync companies: ${error.message}`);
    }
  }

  /**
   * Sync vouchers from server
   */
  private async syncVouchers(session: SyncSession): Promise<void> {
    try {
      // Get vouchers from last 30 days
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      
      const response = await apiClient.get('/vouchers', {
        params: {
          fromDate: fromDate.toISOString().split('T')[0],
          limit: 1000,
        },
      });
      
      const vouchers = response.data.data;

      session.summary.vouchers = {
        total: vouchers.length,
        processed: 0,
        errors: 0,
      };

      for (const voucher of vouchers) {
        try {
          await databaseService.upsertVoucher(voucher);
          session.summary.vouchers.processed++;
          session.processedItems++;
        } catch (error: any) {
          session.summary.vouchers.errors++;
          session.errors.push({
            type: 'voucher',
            item: voucher.voucherNumber,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }

        // Update progress
        store.dispatch(setSyncProgress({
          type: 'vouchers',
          current: session.summary.vouchers.processed,
          total: session.summary.vouchers.total,
          percentage: (session.summary.vouchers.processed / session.summary.vouchers.total) * 100,
          message: `Syncing vouchers: ${session.summary.vouchers.processed}/${session.summary.vouchers.total}`,
        }));
      }
    } catch (error: any) {
      throw new Error(`Failed to sync vouchers: ${error.message}`);
    }
  }

  /**
   * Sync inventory items from server
   */
  private async syncInventoryItems(session: SyncSession): Promise<void> {
    try {
      const response = await apiClient.get('/inventory/items');
      const items = response.data.data;

      session.summary.items = {
        total: items.length,
        processed: 0,
        errors: 0,
      };

      for (const item of items) {
        try {
          await databaseService.upsertInventoryItem(item);
          session.summary.items.processed++;
          session.processedItems++;
        } catch (error: any) {
          session.summary.items.errors++;
          session.errors.push({
            type: 'item',
            item: item.name,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }

        // Update progress
        store.dispatch(setSyncProgress({
          type: 'items',
          current: session.summary.items.processed,
          total: session.summary.items.total,
          percentage: (session.summary.items.processed / session.summary.items.total) * 100,
          message: `Syncing items: ${session.summary.items.processed}/${session.summary.items.total}`,
        }));
      }
    } catch (error: any) {
      throw new Error(`Failed to sync inventory items: ${error.message}`);
    }
  }

  /**
   * Upload pending changes to server
   */
  async uploadPendingChanges(): Promise<{ uploaded: number }> {
    const pendingChanges = await databaseService.getPendingChanges();
    let uploaded = 0;

    for (const change of pendingChanges) {
      try {
        await this.uploadChange(change);
        await databaseService.markChangeAsSynced(change.id);
        uploaded++;
      } catch (error: any) {
        console.error('Failed to upload change:', error);
        // Continue with other changes
      }
    }

    return { uploaded };
  }

  /**
   * Upload individual change to server
   */
  private async uploadChange(change: any): Promise<void> {
    const { type, action, data } = change;

    switch (type) {
      case 'voucher':
        if (action === 'create') {
          await apiClient.post('/vouchers', data);
        } else if (action === 'update') {
          await apiClient.put(`/vouchers/${data.id}`, data);
        } else if (action === 'delete') {
          await apiClient.delete(`/vouchers/${data.id}`);
        }
        break;

      case 'item':
        if (action === 'create') {
          await apiClient.post('/inventory/items', data);
        } else if (action === 'update') {
          await apiClient.put(`/inventory/items/${data.id}`, data);
        } else if (action === 'delete') {
          await apiClient.delete(`/inventory/items/${data.id}`);
        }
        break;

      default:
        throw new Error(`Unknown change type: ${type}`);
    }
  }

  /**
   * Process pending changes when coming online
   */
  private async processPendingChanges(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    try {
      await this.uploadPendingChanges();
    } catch (error) {
      console.error('Failed to process pending changes:', error);
    }
  }

  /**
   * Handle sync request from server
   */
  private async handleSyncRequest(data: any): Promise<void> {
    switch (data.action) {
      case 'start':
        await this.startSync();
        break;
      case 'stop':
        await this.stopSync();
        break;
      case 'force':
        await this.forceSync();
        break;
      default:
        console.warn('Unknown sync request action:', data.action);
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleSyncConflict(conflict: SyncConflict): Promise<void> {
    this.conflicts.push(conflict);

    if (this.currentSession) {
      this.currentSession.conflicts = this.currentSession.conflicts || [];
      this.currentSession.conflicts.push(conflict);
    }
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolutionStrategy
  ): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    switch (resolution.strategy) {
      case 'local':
        await this.applyLocalData(conflict);
        break;
      case 'remote':
        await this.applyRemoteData(conflict);
        break;
      case 'merge':
        if (resolution.mergeFunction) {
          const mergedData = resolution.mergeFunction(conflict.localData, conflict.remoteData);
          await this.applyMergedData(conflict, mergedData);
        } else {
          throw new Error('Merge function required for merge strategy');
        }
        break;
      case 'manual':
        // Keep conflict for manual resolution
        return;
    }

    // Remove resolved conflict
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
  }

  /**
   * Apply local data to resolve conflict
   */
  private async applyLocalData(conflict: SyncConflict): Promise<void> {
    try {
      await this.uploadChange({
        type: conflict.entityType,
        action: 'update',
        data: conflict.localData,
      });
    } catch (error) {
      console.error('Failed to apply local data:', error);
      throw error;
    }
  }

  /**
   * Apply remote data to resolve conflict
   */
  private async applyRemoteData(conflict: SyncConflict): Promise<void> {
    try {
      switch (conflict.entityType) {
        case 'voucher':
          await databaseService.upsertVoucher(conflict.remoteData);
          break;
        case 'item':
          await databaseService.upsertInventoryItem(conflict.remoteData);
          break;
        case 'company':
          await databaseService.upsertCompany(conflict.remoteData);
          break;
      }
    } catch (error) {
      console.error('Failed to apply remote data:', error);
      throw error;
    }
  }

  /**
   * Apply merged data to resolve conflict
   */
  private async applyMergedData(conflict: SyncConflict, mergedData: any): Promise<void> {
    try {
      // Update local database
      switch (conflict.entityType) {
        case 'voucher':
          await databaseService.upsertVoucher(mergedData);
          break;
        case 'item':
          await databaseService.upsertInventoryItem(mergedData);
          break;
        case 'company':
          await databaseService.upsertCompany(mergedData);
          break;
      }

      // Upload to server
      await this.uploadChange({
        type: conflict.entityType,
        action: 'update',
        data: mergedData,
      });
    } catch (error) {
      console.error('Failed to apply merged data:', error);
      throw error;
    }
  }

  /**
   * Process retry queue
   */
  private async processRetryQueue(): Promise<void> {
    if (!this.isOnline || this.retryQueue.length === 0) {
      return;
    }

    const itemsToRetry = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of itemsToRetry) {
      try {
        await this.uploadChange(item);
        await databaseService.markChangeAsSynced(item.id);
      } catch (error) {
        // Add back to retry queue if still failing
        this.retryQueue.push(item);
        console.error('Retry failed for item:', item, error);
      }
    }
  }

  /**
   * Queue change for offline sync
   */
  async queueChange(change: any): Promise<void> {
    await databaseService.addPendingChange(change);

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      try {
        await this.uploadChange(change);
        await databaseService.markChangeAsSynced(change.id);
      } catch (error) {
        // Will be retried later
        console.error('Failed to sync change immediately:', error);
      }
    }
  }

  /**
   * Get pending conflicts
   */
  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  /**
   * Clear all conflicts
   */
  clearConflicts(): void {
    this.conflicts = [];
  }

  /**
   * Check if sync is possible
   */
  canSync(): boolean {
    return this.isOnline && !this.syncInProgress;
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<{
    pendingChanges: number;
    conflicts: number;
    lastSyncTime?: string;
    syncHistory: SyncSession[];
  }> {
    const pendingChanges = await databaseService.getPendingChangesCount();
    const syncHistory = await databaseService.getSyncHistory();

    return {
      pendingChanges,
      conflicts: this.conflicts.length,
      lastSyncTime: syncHistory[0]?.endTime,
      syncHistory: syncHistory.slice(0, 10),
    };
  }

  /**
   * Generate unique sync ID
   */
  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const syncService = new SyncService();
