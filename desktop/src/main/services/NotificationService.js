/**
 * Notification Service for FinSync360 Desktop
 * Handles system notifications and alerts
 */

const { Notification } = require('electron');
const electronLog = require('electron-log');
const { EventEmitter } = require('events');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    this.notificationHistory = [];
    this.maxHistorySize = 100;
  }

  async initialize() {
    try {
      electronLog.info('Initializing notification service...');
      
      // Check if notifications are supported
      if (!Notification.isSupported()) {
        electronLog.warn('System notifications are not supported');
        return;
      }
      
      electronLog.info('Notification service initialized');
    } catch (error) {
      electronLog.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  showNotification(title, body, options = {}) {
    try {
      if (!Notification.isSupported()) {
        electronLog.warn('Notifications not supported, logging instead:', title, body);
        return;
      }

      const notificationOptions = {
        title,
        body,
        icon: options.icon,
        silent: options.silent || false,
        urgency: options.urgency || 'normal',
        timeoutType: options.timeoutType || 'default',
        ...options
      };

      const notification = new Notification(notificationOptions);

      // Handle notification events
      notification.on('show', () => {
        this.addToHistory({
          title,
          body,
          timestamp: new Date().toISOString(),
          type: options.type || 'info',
          shown: true
        });
        
        this.emit('notification-shown', { title, body });
        electronLog.info(`Notification shown: ${title}`);
      });

      notification.on('click', () => {
        this.emit('notification-clicked', { title, body });
        electronLog.info(`Notification clicked: ${title}`);
        
        if (options.onClick) {
          options.onClick();
        }
      });

      notification.on('close', () => {
        this.emit('notification-closed', { title, body });
      });

      notification.on('reply', (event, reply) => {
        this.emit('notification-reply', { title, body, reply });
        electronLog.info(`Notification reply: ${reply}`);
      });

      notification.show();

      return notification;
    } catch (error) {
      electronLog.error('Failed to show notification:', error);
      return null;
    }
  }

  showSyncNotification(status, details = {}) {
    const notifications = {
      started: {
        title: 'Sync Started',
        body: 'Synchronizing data with server...',
        type: 'info'
      },
      completed: {
        title: 'Sync Completed',
        body: `Data synchronized successfully at ${new Date().toLocaleTimeString()}`,
        type: 'success'
      },
      failed: {
        title: 'Sync Failed',
        body: `Synchronization failed: ${details.error || 'Unknown error'}`,
        type: 'error'
      },
      conflict: {
        title: 'Sync Conflict',
        body: 'Data conflicts detected. Please review and resolve.',
        type: 'warning'
      }
    };

    const notification = notifications[status];
    if (notification) {
      this.showNotification(notification.title, notification.body, {
        type: notification.type,
        urgency: status === 'failed' ? 'critical' : 'normal'
      });
    }
  }

  showBackupNotification(status, details = {}) {
    const notifications = {
      started: {
        title: 'Backup Started',
        body: 'Creating database backup...',
        type: 'info'
      },
      completed: {
        title: 'Backup Completed',
        body: `Backup created successfully: ${details.name || 'backup'}`,
        type: 'success'
      },
      failed: {
        title: 'Backup Failed',
        body: `Backup creation failed: ${details.error || 'Unknown error'}`,
        type: 'error'
      },
      restored: {
        title: 'Backup Restored',
        body: 'Database restored from backup successfully',
        type: 'success'
      }
    };

    const notification = notifications[status];
    if (notification) {
      this.showNotification(notification.title, notification.body, {
        type: notification.type
      });
    }
  }

  showUpdateNotification(status, details = {}) {
    const notifications = {
      available: {
        title: 'Update Available',
        body: 'A new version of FinSync360 is available for download.',
        type: 'info'
      },
      downloaded: {
        title: 'Update Downloaded',
        body: 'Update has been downloaded. Restart the application to install.',
        type: 'success'
      },
      installed: {
        title: 'Update Installed',
        body: 'FinSync360 has been updated to the latest version.',
        type: 'success'
      },
      failed: {
        title: 'Update Failed',
        body: `Update failed: ${details.error || 'Unknown error'}`,
        type: 'error'
      }
    };

    const notification = notifications[status];
    if (notification) {
      this.showNotification(notification.title, notification.body, {
        type: notification.type,
        onClick: status === 'downloaded' ? () => {
          this.emit('restart-requested');
        } : undefined
      });
    }
  }

  showBusinessAlert(type, data = {}) {
    const alerts = {
      lowStock: {
        title: 'Low Stock Alert',
        body: `${data.itemName || 'Item'} is running low (${data.currentStock || 0} remaining)`,
        type: 'warning'
      },
      overduePayment: {
        title: 'Overdue Payment',
        body: `Payment from ${data.customerName || 'customer'} is overdue (₹${data.amount || 0})`,
        type: 'warning'
      },
      highRiskCustomer: {
        title: 'High Risk Customer',
        body: `Customer ${data.customerName || 'unknown'} has been flagged as high risk`,
        type: 'warning'
      },
      creditLimitExceeded: {
        title: 'Credit Limit Exceeded',
        body: `${data.customerName || 'Customer'} has exceeded credit limit`,
        type: 'error'
      },
      dailySalesTarget: {
        title: 'Sales Target',
        body: data.achieved 
          ? `Daily sales target achieved! ₹${data.amount || 0}`
          : `Daily sales target not met. Current: ₹${data.current || 0}`,
        type: data.achieved ? 'success' : 'info'
      }
    };

    const alert = alerts[type];
    if (alert) {
      this.showNotification(alert.title, alert.body, {
        type: alert.type,
        urgency: alert.type === 'error' ? 'critical' : 'normal'
      });
    }
  }

  queueNotification(title, body, options = {}) {
    this.notificationQueue.push({ title, body, options });
    
    if (!this.isProcessingQueue) {
      this.processNotificationQueue();
    }
  }

  async processNotificationQueue() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      this.showNotification(notification.title, notification.body, notification.options);
      
      // Add delay between notifications to avoid spam
      await this.delay(2000);
    }

    this.isProcessingQueue = false;
  }

  addToHistory(notification) {
    this.notificationHistory.unshift(notification);
    
    // Keep only the last N notifications
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
    }
  }

  getNotificationHistory(limit = 50) {
    return this.notificationHistory.slice(0, limit);
  }

  clearNotificationHistory() {
    this.notificationHistory = [];
    electronLog.info('Notification history cleared');
  }

  getUnreadCount() {
    return this.notificationHistory.filter(n => !n.read).length;
  }

  markAsRead(timestamp) {
    const notification = this.notificationHistory.find(n => n.timestamp === timestamp);
    if (notification) {
      notification.read = true;
    }
  }

  markAllAsRead() {
    this.notificationHistory.forEach(n => n.read = true);
  }

  // Notification preferences
  setNotificationPreferences(preferences) {
    this.preferences = {
      enabled: true,
      sound: true,
      sync: true,
      backup: true,
      updates: true,
      business: true,
      ...preferences
    };
  }

  getNotificationPreferences() {
    return this.preferences || {
      enabled: true,
      sound: true,
      sync: true,
      backup: true,
      updates: true,
      business: true
    };
  }

  isNotificationEnabled(type) {
    const prefs = this.getNotificationPreferences();
    return prefs.enabled && prefs[type];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test notification
  showTestNotification() {
    this.showNotification(
      'FinSync360 Desktop',
      'Notifications are working correctly!',
      {
        type: 'success',
        onClick: () => {
          electronLog.info('Test notification clicked');
        }
      }
    );
  }
}

module.exports = NotificationService;
