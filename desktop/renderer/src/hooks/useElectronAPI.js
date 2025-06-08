import { useEffect, useState } from 'react';

export const useElectronAPI = () => {
  const [electronAPI, setElectronAPI] = useState(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if we're running in Electron
    const checkElectron = () => {
      const api = window.electronAPI;
      if (api) {
        setElectronAPI(api);
        setIsElectron(true);
      } else {
        setIsElectron(false);
        // Provide mock API for development in browser
        setElectronAPI(createMockAPI());
      }
    };

    checkElectron();
  }, []);

  return electronAPI;
};

// Mock API for development in browser
const createMockAPI = () => ({
  // Database operations
  database: {
    query: async (query, params) => {
      console.log('Mock DB Query:', query, params);
      return [];
    },
    run: async (query, params) => {
      console.log('Mock DB Run:', query, params);
      return { changes: 1, lastInsertRowid: 1 };
    },
  },

  // Authentication
  auth: {
    login: async (credentials) => {
      console.log('Mock Login:', credentials);
      return {
        success: true,
        user: {
          id: 'mock-user-1',
          username: credentials.username,
          email: 'user@example.com',
          role: 'admin',
          permissions: ['all']
        },
        token: 'mock-token'
      };
    },
    logout: async () => {
      console.log('Mock Logout');
      return { success: true };
    },
    getCurrentUser: async () => {
      console.log('Mock Get Current User');
      return null;
    },
  },

  // Sync operations
  sync: {
    syncNow: async () => {
      console.log('Mock Sync Now');
      return {
        success: true,
        timestamp: new Date().toISOString()
      };
    },
    getStatus: async () => {
      console.log('Mock Get Sync Status');
      return {
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        autoSyncEnabled: true,
        offlineMode: false
      };
    },
    onSyncProgress: (callback) => {
      console.log('Mock Sync Progress Listener');
      return () => {};
    },
    onSyncComplete: (callback) => {
      console.log('Mock Sync Complete Listener');
      return () => {};
    },
    onSyncError: (callback) => {
      console.log('Mock Sync Error Listener');
      return () => {};
    },
  },

  // Settings
  settings: {
    get: async (key) => {
      console.log('Mock Get Setting:', key);
      const mockSettings = {
        theme: 'light',
        autoSync: true,
        syncInterval: 300000,
        offlineMode: false
      };
      return mockSettings[key];
    },
    set: async (key, value) => {
      console.log('Mock Set Setting:', key, value);
      return true;
    },
  },

  // File operations
  files: {
    showSaveDialog: async (options) => {
      console.log('Mock Save Dialog:', options);
      return { canceled: false, filePath: '/mock/path/file.json' };
    },
    showOpenDialog: async (options) => {
      console.log('Mock Open Dialog:', options);
      return { canceled: false, filePaths: ['/mock/path/file.json'] };
    },
  },

  // Notifications
  notifications: {
    show: (title, body, options) => {
      console.log('Mock Notification:', title, body, options);
    },
  },

  // Navigation
  navigation: {
    onNavigateTo: (callback) => {
      console.log('Mock Navigate To Listener');
      return () => {};
    },
    onDeepLink: (callback) => {
      console.log('Mock Deep Link Listener');
      return () => {};
    },
  },

  // API calls
  api: {
    companies: {
      getAll: async () => {
        console.log('Mock Get All Companies');
        return [];
      },
      getById: async (id) => {
        console.log('Mock Get Company By ID:', id);
        return null;
      },
      create: async (company) => {
        console.log('Mock Create Company:', company);
        return { success: true, id: 'mock-company-1' };
      },
      update: async (id, company) => {
        console.log('Mock Update Company:', id, company);
        return { success: true };
      },
      delete: async (id) => {
        console.log('Mock Delete Company:', id);
        return { success: true };
      },
    },
    vouchers: {
      getAll: async (filters) => {
        console.log('Mock Get All Vouchers:', filters);
        return [];
      },
      getById: async (id) => {
        console.log('Mock Get Voucher By ID:', id);
        return null;
      },
      create: async (voucher) => {
        console.log('Mock Create Voucher:', voucher);
        return { success: true, id: 'mock-voucher-1' };
      },
      update: async (id, voucher) => {
        console.log('Mock Update Voucher:', id, voucher);
        return { success: true };
      },
      delete: async (id) => {
        console.log('Mock Delete Voucher:', id);
        return { success: true };
      },
    },
    parties: {
      getAll: async (filters) => {
        console.log('Mock Get All Parties:', filters);
        return [];
      },
      getById: async (id) => {
        console.log('Mock Get Party By ID:', id);
        return null;
      },
      create: async (party) => {
        console.log('Mock Create Party:', party);
        return { success: true, id: 'mock-party-1' };
      },
      update: async (id, party) => {
        console.log('Mock Update Party:', id, party);
        return { success: true };
      },
      delete: async (id) => {
        console.log('Mock Delete Party:', id);
        return { success: true };
      },
    },
    inventory: {
      getAll: async (filters) => {
        console.log('Mock Get All Inventory:', filters);
        return [];
      },
      getById: async (id) => {
        console.log('Mock Get Inventory By ID:', id);
        return null;
      },
      create: async (item) => {
        console.log('Mock Create Inventory:', item);
        return { success: true, id: 'mock-item-1' };
      },
      update: async (id, item) => {
        console.log('Mock Update Inventory:', id, item);
        return { success: true };
      },
      delete: async (id) => {
        console.log('Mock Delete Inventory:', id);
        return { success: true };
      },
    },
    reports: {
      getTrialBalance: async (filters) => {
        console.log('Mock Get Trial Balance:', filters);
        return { data: [], totals: { debit: 0, credit: 0 } };
      },
      getProfitLoss: async (filters) => {
        console.log('Mock Get Profit Loss:', filters);
        return { income: [], expenses: [], netProfit: 0 };
      },
    },
    ml: {
      predictPaymentDelay: async (data) => {
        console.log('Mock Predict Payment Delay:', data);
        return {
          delay_probability: 0.25,
          risk_level: 'Low',
          confidence_score: 0.85
        };
      },
      getBusinessMetrics: async (filters) => {
        console.log('Mock Get Business Metrics:', filters);
        return {
          revenue_forecast: { next_month: 100000 },
          payment_insights: { on_time_rate: 85 },
          customer_analytics: { total_customers: 150 }
        };
      },
    },
  },

  // System information
  system: {
    platform: 'mock',
    version: { node: '18.0.0', chrome: '100.0.0', electron: '20.0.0' }
  },

  // Backup
  backup: {
    create: async (options) => {
      console.log('Mock Create Backup:', options);
      return {
        success: true,
        name: 'mock-backup.json',
        path: '/mock/path/backup.json'
      };
    },
    restore: async (filePath) => {
      console.log('Mock Restore Backup:', filePath);
      return { success: true };
    },
    getBackupList: async () => {
      console.log('Mock Get Backup List');
      return [];
    },
  },
});
