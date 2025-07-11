import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from '@env';
import { authService } from './authService';
import { EventEmitter } from 'events';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

class WebSocketService extends EventEmitter {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize WebSocket connection
   */
  async initialize(): Promise<void> {
    try {
      const token = await authService.getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      this.socket = io(WS_BASE_URL, {
        auth: {
          token,
        },
        transports: ['websocket'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
      console.log('WebSocket service initialized');
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      throw error;
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('WebSocket connected');
      this.emit('connected');
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('WebSocket disconnected:', reason);
      this.emit('disconnected', reason);
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      this.emit('reconnected', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      this.emit('reconnect_error', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.emit('reconnect_failed');
    });

    // Application-specific events
    this.socket.on('sync-request', (data) => {
      this.emit('sync-request', data);
    });

    this.socket.on('sync-progress', (data) => {
      this.emit('sync-progress', data);
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    this.socket.on('data-update', (data) => {
      this.emit('data-update', data);
    });

    this.socket.on('tally-status', (data) => {
      this.emit('tally-status', data);
    });

    this.socket.on('user-activity', (data) => {
      this.emit('user-activity', data);
    });

    this.socket.on('payment-update', (data) => {
      this.emit('payment-update', data);
    });

    this.socket.on('inventory-update', (data) => {
      this.emit('inventory-update', data);
    });

    this.socket.on('voucher-update', (data) => {
      this.emit('voucher-update', data);
    });

    this.socket.on('company-update', (data) => {
      this.emit('company-update', data);
    });

    this.socket.on('sync-conflict', (data) => {
      this.emit('sync-conflict', data);
    });

    this.socket.on('system-alert', (data) => {
      this.emit('system-alert', data);
    });

    this.socket.on('pong', () => {
      this.emit('pong');
    });
  }

  /**
   * Send message to server
   */
  sendMessage(type: string, data: any): boolean {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    try {
      this.socket.emit(type, data);
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Join a room (for company-specific updates)
   */
  joinRoom(roomId: string): void {
    this.sendMessage('join-room', { roomId });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): void {
    this.sendMessage('leave-room', { roomId });
  }

  /**
   * Send sync data to server
   */
  sendSyncData(data: any): boolean {
    return this.sendMessage('sync-data', data);
  }

  /**
   * Request sync from server
   */
  requestSync(type?: string): boolean {
    return this.sendMessage('sync-request', { type });
  }

  /**
   * Subscribe to real-time updates for a specific entity
   */
  subscribeToEntity(entityType: string, entityId: string): boolean {
    return this.sendMessage('subscribe', { entityType, entityId });
  }

  /**
   * Unsubscribe from real-time updates for a specific entity
   */
  unsubscribeFromEntity(entityType: string, entityId: string): boolean {
    return this.sendMessage('unsubscribe', { entityType, entityId });
  }

  /**
   * Send user activity update
   */
  sendUserActivity(activity: {
    type: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
  }): boolean {
    return this.sendMessage('user-activity', activity);
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(entityType: string, entityId: string, isTyping: boolean): boolean {
    return this.sendMessage('typing', { entityType, entityId, isTyping });
  }

  /**
   * Send presence update
   */
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): boolean {
    return this.sendMessage('presence', { status });
  }

  /**
   * Request real-time data for dashboard
   */
  requestDashboardData(): boolean {
    return this.sendMessage('dashboard-data-request', {});
  }

  /**
   * Send notification acknowledgment
   */
  acknowledgeNotification(notificationId: string): boolean {
    return this.sendMessage('notification-ack', { notificationId });
  }

  /**
   * Send payment status update
   */
  sendPaymentUpdate(paymentId: string, status: string, metadata?: any): boolean {
    return this.sendMessage('payment-update', { paymentId, status, metadata });
  }

  /**
   * Send inventory alert
   */
  sendInventoryAlert(itemId: string, alertType: string, currentStock: number): boolean {
    return this.sendMessage('inventory-alert', { itemId, alertType, currentStock });
  }

  /**
   * Request Tally sync status
   */
  requestTallyStatus(): boolean {
    return this.sendMessage('tally-status-request', {});
  }

  /**
   * Send collaborative editing event
   */
  sendCollaborativeEdit(entityType: string, entityId: string, operation: any): boolean {
    return this.sendMessage('collaborative-edit', { entityType, entityId, operation });
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.emit('ping');
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Manually reconnect
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    socketId?: string;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
    };
  }

  /**
   * Update authentication token
   */
  async updateAuth(): Promise<void> {
    const token = await authService.getToken();
    
    if (this.socket && token) {
      this.socket.auth = { token };
      
      if (this.isConnected) {
        // Reconnect with new token
        this.socket.disconnect();
        this.socket.connect();
      }
    }
  }

  /**
   * Check if WebSocket is connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();
