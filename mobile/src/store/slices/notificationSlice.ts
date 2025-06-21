import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationService, Notification, NotificationPreferences } from '../../services/notificationService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  categories: any[];
  templates: any[];
  history: any[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    isRead?: boolean;
    category?: string;
    type?: string;
  };
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  preferences: null,
  categories: [],
  templates: [],
  history: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (params: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    category?: string;
    type?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotifications(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAllAsRead();
      return response.markedCount;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete notification');
    }
  }
);

export const deleteAllNotifications = createAsyncThunk(
  'notification/deleteAllNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.deleteAllNotifications();
      return response.deletedCount;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete all notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUnreadCount();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch unread count');
    }
  }
);

export const fetchNotificationPreferences = createAsyncThunk(
  'notification/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getPreferences();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification preferences');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notification/updatePreferences',
  async (preferences: Partial<NotificationPreferences>, { rejectWithValue }) => {
    try {
      const response = await notificationService.updatePreferences(preferences);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update notification preferences');
    }
  }
);

export const subscribeToPushNotifications = createAsyncThunk(
  'notification/subscribeToPush',
  async (subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }, { rejectWithValue }) => {
    try {
      await notificationService.subscribeToPush(subscription);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to subscribe to push notifications');
    }
  }
);

export const unsubscribeFromPushNotifications = createAsyncThunk(
  'notification/unsubscribeFromPush',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.unsubscribeFromPush();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unsubscribe from push notifications');
    }
  }
);

export const fetchNotificationCategories = createAsyncThunk(
  'notification/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getCategories();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification categories');
    }
  }
);

export const createNotification = createAsyncThunk(
  'notification/createNotification',
  async (notificationData: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: string;
    recipients?: string[];
    data?: Record<string, any>;
    scheduledAt?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await notificationService.createNotification(notificationData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create notification');
    }
  }
);

export const fetchNotificationTemplates = createAsyncThunk(
  'notification/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getTemplates();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification templates');
    }
  }
);

export const fetchNotificationHistory = createAsyncThunk(
  'notification/fetchHistory',
  async (params: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    status?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await notificationService.getHistory(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification history');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Reset pagination when filters change
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    updateNotificationInList: (state, action: PayloadAction<Notification>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        const wasUnread = !state.notifications[index].isRead;
        const isNowRead = action.payload.isRead;
        
        state.notifications[index] = action.payload;
        
        // Update unread count
        if (wasUnread && isNowRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (!wasUnread && !isNowRead) {
          state.unreadCount += 1;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.data;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark notification as read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1 && !state.notifications[index].isRead) {
          state.notifications[index].isRead = true;
          state.notifications[index].readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

    // Mark all notifications as read
    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1) {
          if (!state.notifications[index].isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
          state.pagination.total = Math.max(0, state.pagination.total - 1);
        }
      });

    // Delete all notifications
    builder
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
        state.pagination.total = 0;
      });

    // Fetch unread count
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.total;
      });

    // Fetch notification preferences
    builder
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      });

    // Update notification preferences
    builder
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      });

    // Fetch notification categories
    builder
      .addCase(fetchNotificationCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });

    // Create notification
    builder
      .addCase(createNotification.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload);
      });

    // Fetch notification templates
    builder
      .addCase(fetchNotificationTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      });

    // Fetch notification history
    builder
      .addCase(fetchNotificationHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  addNotification,
  updateNotificationInList,
} = notificationSlice.actions;

export default notificationSlice.reducer;
