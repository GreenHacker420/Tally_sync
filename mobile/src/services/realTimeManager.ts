import { webSocketService } from './webSocketService';
import { store } from '../store';
import { addNotification, updateNotificationInList } from '../store/slices/notificationSlice';
import { updateSyncStatus } from '../store/slices/tallySlice';
import { setSyncProgress } from '../store/slices/syncSlice';
import PushNotification from 'react-native-push-notification';
import { Alert, AppState, AppStateStatus } from 'react-native';

export interface RealTimeEvent {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
  companyId?: string;
}

export interface PresenceInfo {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  currentActivity?: string;
}

class RealTimeManager {
  private isInitialized = false;
  private currentAppState: AppStateStatus = 'active';
  private presenceUsers: Map<string, PresenceInfo> = new Map();
  private subscriptions: Set<string> = new Set();

  constructor() {
    this.setupAppStateListener();
  }

  /**
   * Initialize real-time manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await webSocketService.initialize();
      this.setupEventListeners();
      this.isInitialized = true;
      
      // Update presence to online
      this.updatePresence('online');
      
      console.log('Real-time manager initialized');
    } catch (error) {
      console.error('Failed to initialize real-time manager:', error);
      throw error;
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    // Connection events
    webSocketService.on('connected', () => {
      this.handleConnection();
    });

    webSocketService.on('disconnected', () => {
      this.handleDisconnection();
    });

    // Data update events
    webSocketService.on('notification', (data) => {
      this.handleNotification(data);
    });

    webSocketService.on('data-update', (data) => {
      this.handleDataUpdate(data);
    });

    webSocketService.on('sync-progress', (data) => {
      this.handleSyncProgress(data);
    });

    webSocketService.on('sync-conflict', (data) => {
      this.handleSyncConflict(data);
    });

    webSocketService.on('tally-status', (data) => {
      this.handleTallyStatus(data);
    });

    webSocketService.on('user-activity', (data) => {
      this.handleUserActivity(data);
    });

    webSocketService.on('payment-update', (data) => {
      this.handlePaymentUpdate(data);
    });

    webSocketService.on('inventory-update', (data) => {
      this.handleInventoryUpdate(data);
    });

    webSocketService.on('voucher-update', (data) => {
      this.handleVoucherUpdate(data);
    });

    webSocketService.on('company-update', (data) => {
      this.handleCompanyUpdate(data);
    });

    webSocketService.on('system-alert', (data) => {
      this.handleSystemAlert(data);
    });
  }

  /**
   * Setup app state listener for presence management
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (this.currentAppState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        this.updatePresence('online');
      } else if (this.currentAppState === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background
        this.updatePresence('away');
      }
      
      this.currentAppState = nextAppState;
    });
  }

  /**
   * Handle WebSocket connection
   */
  private handleConnection(): void {
    console.log('Real-time connection established');
    
    // Re-subscribe to previous subscriptions
    this.subscriptions.forEach(subscription => {
      const [entityType, entityId] = subscription.split(':');
      webSocketService.subscribeToEntity(entityType, entityId);
    });

    // Update presence
    this.updatePresence('online');
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(): void {
    console.log('Real-time connection lost');
    this.updatePresence('offline');
  }

  /**
   * Handle incoming notifications
   */
  private handleNotification(data: any): void {
    const notification = {
      id: data.id || `notif_${Date.now()}`,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      category: data.category || 'general',
      isRead: false,
      data: data.data,
      createdAt: data.timestamp || new Date().toISOString(),
    };

    // Add to Redux store
    store.dispatch(addNotification(notification));

    // Show push notification if app is in background
    if (this.currentAppState !== 'active') {
      this.showPushNotification(notification);
    }
  }

  /**
   * Handle data updates
   */
  private handleDataUpdate(data: any): void {
    console.log('Data update received:', data);
    
    // Dispatch appropriate Redux actions based on data type
    switch (data.entityType) {
      case 'voucher':
        // Handle voucher updates
        break;
      case 'inventory':
        // Handle inventory updates
        break;
      case 'payment':
        // Handle payment updates
        break;
      case 'company':
        // Handle company updates
        break;
    }
  }

  /**
   * Handle sync progress updates
   */
  private handleSyncProgress(data: any): void {
    store.dispatch(setSyncProgress(data));
  }

  /**
   * Handle sync conflicts
   */
  private handleSyncConflict(data: any): void {
    console.log('Sync conflict detected:', data);
    
    // Show alert to user
    Alert.alert(
      'Sync Conflict',
      'A data conflict has been detected. Please review and resolve it.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Resolve Now', onPress: () => this.navigateToConflictResolution(data) },
      ]
    );
  }

  /**
   * Handle Tally status updates
   */
  private handleTallyStatus(data: any): void {
    store.dispatch(updateSyncStatus(data));
  }

  /**
   * Handle user activity updates
   */
  private handleUserActivity(data: any): void {
    console.log('User activity:', data);
    
    // Update presence information
    if (data.userId && data.presence) {
      this.presenceUsers.set(data.userId, {
        userId: data.userId,
        status: data.presence.status,
        lastSeen: data.timestamp,
        currentActivity: data.activity,
      });
    }
  }

  /**
   * Handle payment updates
   */
  private handlePaymentUpdate(data: any): void {
    console.log('Payment update:', data);
    
    // Show notification for important payment events
    if (data.status === 'completed' || data.status === 'failed') {
      this.handleNotification({
        title: 'Payment Update',
        message: `Payment ${data.paymentId} ${data.status}`,
        type: data.status === 'completed' ? 'success' : 'error',
        category: 'payment',
        data: data,
      });
    }
  }

  /**
   * Handle inventory updates
   */
  private handleInventoryUpdate(data: any): void {
    console.log('Inventory update:', data);
    
    // Show alert for low stock
    if (data.alertType === 'low_stock') {
      this.handleNotification({
        title: 'Low Stock Alert',
        message: `${data.itemName} is running low (${data.currentStock} remaining)`,
        type: 'warning',
        category: 'inventory',
        data: data,
      });
    }
  }

  /**
   * Handle voucher updates
   */
  private handleVoucherUpdate(data: any): void {
    console.log('Voucher update:', data);
  }

  /**
   * Handle company updates
   */
  private handleCompanyUpdate(data: any): void {
    console.log('Company update:', data);
  }

  /**
   * Handle system alerts
   */
  private handleSystemAlert(data: any): void {
    Alert.alert(
      data.title || 'System Alert',
      data.message,
      [
        { text: 'OK', onPress: () => this.acknowledgeAlert(data.id) },
      ]
    );
  }

  /**
   * Show push notification
   */
  private showPushNotification(notification: any): void {
    PushNotification.localNotification({
      title: notification.title,
      message: notification.message,
      playSound: true,
      soundName: 'default',
      userInfo: notification.data,
    });
  }

  /**
   * Subscribe to real-time updates for an entity
   */
  subscribeToEntity(entityType: string, entityId: string): void {
    const subscription = `${entityType}:${entityId}`;
    this.subscriptions.add(subscription);
    
    if (webSocketService.connected) {
      webSocketService.subscribeToEntity(entityType, entityId);
    }
  }

  /**
   * Unsubscribe from real-time updates for an entity
   */
  unsubscribeFromEntity(entityType: string, entityId: string): void {
    const subscription = `${entityType}:${entityId}`;
    this.subscriptions.delete(subscription);
    
    if (webSocketService.connected) {
      webSocketService.unsubscribeFromEntity(entityType, entityId);
    }
  }

  /**
   * Update user presence
   */
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    if (webSocketService.connected) {
      webSocketService.updatePresence(status);
    }
  }

  /**
   * Send user activity
   */
  sendActivity(activity: {
    type: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
  }): void {
    if (webSocketService.connected) {
      webSocketService.sendUserActivity(activity);
    }
  }

  /**
   * Get presence information for users
   */
  getPresenceInfo(): Map<string, PresenceInfo> {
    return new Map(this.presenceUsers);
  }

  /**
   * Navigate to conflict resolution (placeholder)
   */
  private navigateToConflictResolution(conflictData: any): void {
    // This would navigate to a conflict resolution screen
    console.log('Navigate to conflict resolution:', conflictData);
  }

  /**
   * Acknowledge system alert
   */
  private acknowledgeAlert(alertId: string): void {
    if (webSocketService.connected) {
      webSocketService.sendMessage('alert-ack', { alertId });
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.updatePresence('offline');
    this.subscriptions.clear();
    this.presenceUsers.clear();
    webSocketService.disconnect();
    this.isInitialized = false;
  }
}

export const realTimeManager = new RealTimeManager();
