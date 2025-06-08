import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // App state
  isOnline: navigator.onLine,
  theme: 'light',
  sidebarCollapsed: false,
  
  // Sync state
  syncStatus: {
    status: 'idle', // idle, syncing, completed, error
    lastSync: null,
    progress: null,
    error: null
  },
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  
  // Loading states
  loading: {
    global: false,
    sync: false,
    backup: false
  },
  
  // Settings
  settings: {
    autoSync: true,
    syncInterval: 300000, // 5 minutes
    offlineMode: false,
    notifications: {
      enabled: true,
      sound: true,
      sync: true,
      backup: true,
      business: true
    }
  },

  // Actions
  setOnlineStatus: (isOnline) => set({ isOnline }),
  
  setTheme: (theme) => set({ theme }),
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  setSyncStatus: (status) => set((state) => ({
    syncStatus: { ...state.syncStatus, ...status }
  })),
  
  setLoading: (key, isLoading) => set((state) => ({
    loading: { ...state.loading, [key]: isLoading }
  })),
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
      },
      ...state.notifications
    ].slice(0, 100), // Keep only last 100 notifications
    unreadCount: state.unreadCount + 1
  })),
  
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  
  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0
  })),
  
  clearNotifications: () => set({
    notifications: [],
    unreadCount: 0
  }),
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  
  // Sync actions
  triggerSync: async () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI?.sync) return;
    
    set((state) => ({
      syncStatus: { ...state.syncStatus, status: 'syncing' },
      loading: { ...state.loading, sync: true }
    }));
    
    try {
      const result = await electronAPI.sync.syncNow();
      
      if (result.success) {
        set((state) => ({
          syncStatus: {
            ...state.syncStatus,
            status: 'completed',
            lastSync: result.timestamp,
            error: null
          },
          loading: { ...state.loading, sync: false }
        }));
        
        get().addNotification({
          type: 'success',
          title: 'Sync Completed',
          message: 'Data synchronized successfully'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          status: 'error',
          error: error.message
        },
        loading: { ...state.loading, sync: false }
      }));
      
      get().addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: error.message
      });
    }
  },
  
  getSyncStatus: async () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI?.sync) return;
    
    try {
      const status = await electronAPI.sync.getStatus();
      set({ syncStatus: status });
      return status;
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  },
  
  // Backup actions
  createBackup: async (options = {}) => {
    const electronAPI = window.electronAPI;
    if (!electronAPI?.backup) return;
    
    set((state) => ({
      loading: { ...state.loading, backup: true }
    }));
    
    try {
      const result = await electronAPI.backup.create(options);
      
      if (result.success) {
        get().addNotification({
          type: 'success',
          title: 'Backup Created',
          message: `Backup saved: ${result.name}`
        });
      } else {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Backup Failed',
        message: error.message
      });
      throw error;
    } finally {
      set((state) => ({
        loading: { ...state.loading, backup: false }
      }));
    }
  },
  
  // Utility functions
  showNotification: (notification) => {
    get().addNotification(notification);
    
    // Also show system notification if enabled
    const electronAPI = window.electronAPI;
    if (electronAPI?.notifications && get().settings.notifications.enabled) {
      electronAPI.notifications.show(
        notification.title,
        notification.message,
        { type: notification.type }
      );
    }
  },
  
  // Reset app state
  reset: () => set({
    syncStatus: {
      status: 'idle',
      lastSync: null,
      progress: null,
      error: null
    },
    notifications: [],
    unreadCount: 0,
    loading: {
      global: false,
      sync: false,
      backup: false
    }
  })
}));
