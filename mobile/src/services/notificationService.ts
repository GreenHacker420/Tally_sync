import { apiClient } from './apiClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: Record<string, {
    email: boolean;
    push: boolean;
    sms: boolean;
  }>;
}

class NotificationService {
  private readonly baseURL = '/notifications';

  /**
   * Get notifications
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    category?: string;
    type?: string;
  }): Promise<{
    success: boolean;
    data: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    unreadCount: number;
  }> {
    const response = await apiClient.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<{
    success: boolean;
    data: Notification;
  }> {
    const response = await apiClient.get(`${this.baseURL}/${notificationId}`);
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.put(`${this.baseURL}/${notificationId}/read`);
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{
    success: boolean;
    message: string;
    markedCount: number;
  }> {
    const response = await apiClient.put(`${this.baseURL}/mark-all-read`);
    return response.data;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.delete(`${this.baseURL}/${notificationId}`);
    return response.data;
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
  }> {
    const response = await apiClient.delete(`${this.baseURL}/all`);
    return response.data;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{
    success: boolean;
    data: {
      total: number;
      byCategory: Record<string, number>;
      byType: Record<string, number>;
    };
  }> {
    const response = await apiClient.get(`${this.baseURL}/unread-count`);
    return response.data;
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<{
    success: boolean;
    data: NotificationPreferences;
  }> {
    const response = await apiClient.get(`${this.baseURL}/preferences`);
    return response.data;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<{
    success: boolean;
    message: string;
    data: NotificationPreferences;
  }> {
    const response = await apiClient.put(`${this.baseURL}/preferences`, preferences);
    return response.data;
  }

  /**
   * Send test notification
   */
  async sendTestNotification(type: 'email' | 'push' | 'sms'): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/test`, { type });
    return response.data;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/push/subscribe`, subscription);
    return response.data;
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/push/unsubscribe`);
    return response.data;
  }

  /**
   * Get notification categories
   */
  async getCategories(): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      name: string;
      description: string;
      defaultSettings: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
    }>;
  }> {
    const response = await apiClient.get(`${this.baseURL}/categories`);
    return response.data;
  }

  /**
   * Create custom notification
   */
  async createNotification(notificationData: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: string;
    recipients?: string[];
    data?: Record<string, any>;
    scheduledAt?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: Notification;
  }> {
    const response = await apiClient.post(this.baseURL, notificationData);
    return response.data;
  }

  /**
   * Get notification templates
   */
  async getTemplates(): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      name: string;
      subject: string;
      body: string;
      type: string;
      variables: string[];
    }>;
  }> {
    const response = await apiClient.get(`${this.baseURL}/templates`);
    return response.data;
  }

  /**
   * Send notification using template
   */
  async sendFromTemplate(templateData: {
    templateId: string;
    recipients: string[];
    variables: Record<string, any>;
    scheduledAt?: string;
  }): Promise<{
    success: boolean;
    message: string;
    notificationId: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/send-template`, templateData);
    return response.data;
  }

  /**
   * Get notification history
   */
  async getHistory(params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    status?: string;
  }): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      title: string;
      type: string;
      recipients: number;
      status: string;
      sentAt: string;
      deliveredCount: number;
      failedCount: number;
    }>;
    pagination: any;
  }> {
    const response = await apiClient.get(`${this.baseURL}/history`, { params });
    return response.data;
  }
}

export const notificationService = new NotificationService();
