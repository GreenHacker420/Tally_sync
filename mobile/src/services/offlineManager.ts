import { databaseService } from './databaseService';
import { syncService } from './syncService';
import { store } from '../store';
import { setOfflineMode, addOfflineAction } from '../store/slices/offlineSlice';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
}

export interface OfflineConfig {
  maxRetries: number;
  retryDelay: number;
  cacheExpiration: number;
  autoSync: boolean;
  syncOnReconnect: boolean;
}

class OfflineManager {
  private isOnline = true;
  private actionQueue: OfflineAction[] = [];
  private config: OfflineConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    cacheExpiration: 60, // minutes
    autoSync: true,
    syncOnReconnect: true,
  };

  constructor() {
    this.setupNetworkListener();
    this.loadOfflineActions();
  }

  /**
   * Setup network connectivity monitoring
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;

      store.dispatch(setOfflineMode(!this.isOnline));

      // Handle reconnection
      if (wasOffline && this.isOnline && this.config.syncOnReconnect) {
        this.handleReconnection();
      }
    });
  }

  /**
   * Load pending offline actions from database
   */
  private async loadOfflineActions(): Promise<void> {
    try {
      const pendingChanges = await databaseService.getPendingChanges();
      this.actionQueue = pendingChanges.map(change => ({
        id: change.id,
        type: change.type,
        payload: change.data,
        timestamp: change.timestamp,
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        priority: this.determinePriority(change.type),
      }));
    } catch (error) {
      console.error('Failed to load offline actions:', error);
    }
  }

  /**
   * Handle network reconnection
   */
  private async handleReconnection(): Promise<void> {
    console.log('Network reconnected, processing offline actions...');

    // Clear expired cache
    await databaseService.clearExpiredCache();

    // Process pending actions
    await this.processActionQueue();

    // Trigger full sync if enabled
    if (this.config.autoSync) {
      try {
        await syncService.startSync();
      } catch (error) {
        console.error('Auto-sync failed after reconnection:', error);
      }
    }
  }

  /**
   * Queue action for offline execution
   */
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const offlineAction: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    // Add to queue
    this.actionQueue.push(offlineAction);

    // Store in database
    await databaseService.addPendingChange({
      type: offlineAction.type,
      data: offlineAction.payload,
    });

    // Add to Redux store
    store.dispatch(addOfflineAction(offlineAction));

    // Try to execute immediately if online
    if (this.isOnline) {
      await this.executeAction(offlineAction);
    }

    return offlineAction.id;
  }

  /**
   * Process the action queue
   */
  private async processActionQueue(): Promise<void> {
    if (!this.isOnline || this.actionQueue.length === 0) {
      return;
    }

    // Sort by priority and timestamp
    const sortedActions = [...this.actionQueue].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    for (const action of sortedActions) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.error('Failed to execute offline action:', action, error);
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: OfflineAction): Promise<void> {
    try {
      // Execute the action based on type
      await this.performAction(action);

      // Remove from queue and database
      await this.removeAction(action.id);
    } catch (error) {
      // Increment retry count
      action.retryCount++;

      if (action.retryCount >= action.maxRetries) {
        console.error('Action failed after max retries:', action);
        await this.removeAction(action.id);
      } else {
        // Schedule retry
        setTimeout(() => {
          this.executeAction(action);
        }, this.config.retryDelay * action.retryCount);
      }

      throw error;
    }
  }

  /**
   * Perform the actual action
   */
  private async performAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'CREATE_VOUCHER':
        await this.createVoucher(action.payload);
        break;
      case 'UPDATE_VOUCHER':
        await this.updateVoucher(action.payload);
        break;
      case 'DELETE_VOUCHER':
        await this.deleteVoucher(action.payload);
        break;
      case 'CREATE_ITEM':
        await this.createInventoryItem(action.payload);
        break;
      case 'UPDATE_ITEM':
        await this.updateInventoryItem(action.payload);
        break;
      case 'DELETE_ITEM':
        await this.deleteInventoryItem(action.payload);
        break;
      case 'UPDATE_STOCK':
        await this.updateStock(action.payload);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Action implementations
   */
  private async createVoucher(payload: any): Promise<void> {
    // Implementation would call the appropriate API
    console.log('Creating voucher:', payload);
  }

  private async updateVoucher(payload: any): Promise<void> {
    console.log('Updating voucher:', payload);
  }

  private async deleteVoucher(payload: any): Promise<void> {
    console.log('Deleting voucher:', payload);
  }

  private async createInventoryItem(payload: any): Promise<void> {
    console.log('Creating inventory item:', payload);
  }

  private async updateInventoryItem(payload: any): Promise<void> {
    console.log('Updating inventory item:', payload);
  }

  private async deleteInventoryItem(payload: any): Promise<void> {
    console.log('Deleting inventory item:', payload);
  }

  private async updateStock(payload: any): Promise<void> {
    console.log('Updating stock:', payload);
  }

  /**
   * Remove action from queue and database
   */
  private async removeAction(actionId: string): Promise<void> {
    this.actionQueue = this.actionQueue.filter(action => action.id !== actionId);
    await databaseService.markChangeAsSynced(actionId);
  }

  /**
   * Determine action priority
   */
  private determinePriority(actionType: string): 'low' | 'medium' | 'high' {
    switch (actionType) {
      case 'CREATE_VOUCHER':
      case 'UPDATE_VOUCHER':
        return 'high';
      case 'UPDATE_STOCK':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, data: any, expirationMinutes?: number): Promise<void> {
    await databaseService.setCache(
      key, 
      data, 
      expirationMinutes || this.config.cacheExpiration
    );
  }

  /**
   * Get cached data
   */
  async getCachedData<T = any>(key: string): Promise<T | null> {
    return await databaseService.getCache<T>(key);
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get pending actions count
   */
  getPendingActionsCount(): number {
    return this.actionQueue.length;
  }

  /**
   * Get pending actions
   */
  getPendingActions(): OfflineAction[] {
    return [...this.actionQueue];
  }

  /**
   * Clear all pending actions
   */
  async clearPendingActions(): Promise<void> {
    this.actionQueue = [];
    await databaseService.clearPendingChanges();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): OfflineConfig {
    return { ...this.config };
  }
}

export const offlineManager = new OfflineManager();
