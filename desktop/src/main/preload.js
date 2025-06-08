/**
 * FinSync360 Desktop - Preload Script
 * Secure bridge between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  database: {
    query: (query, params) => ipcRenderer.invoke('db-query', query, params),
    run: (query, params) => ipcRenderer.invoke('db-run', query, params),
  },

  // Authentication
  auth: {
    login: (credentials) => ipcRenderer.invoke('auth-login', credentials),
    logout: () => ipcRenderer.invoke('auth-logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth-get-user'),
  },

  // Sync operations
  sync: {
    syncNow: () => ipcRenderer.invoke('sync-now'),
    getStatus: () => ipcRenderer.invoke('sync-status'),
    onSyncProgress: (callback) => {
      ipcRenderer.on('sync-progress', callback);
      return () => ipcRenderer.removeListener('sync-progress', callback);
    },
    onSyncComplete: (callback) => {
      ipcRenderer.on('sync-complete', callback);
      return () => ipcRenderer.removeListener('sync-complete', callback);
    },
    onSyncError: (callback) => {
      ipcRenderer.on('sync-error', callback);
      return () => ipcRenderer.removeListener('sync-error', callback);
    },
  },

  // Offline queue operations
  queue: {
    add: (operation) => ipcRenderer.invoke('queue-add', operation),
    getPending: () => ipcRenderer.invoke('queue-get-pending'),
    onQueueUpdate: (callback) => {
      ipcRenderer.on('queue-update', callback);
      return () => ipcRenderer.removeListener('queue-update', callback);
    },
  },

  // Settings
  settings: {
    get: (key) => ipcRenderer.invoke('settings-get', key),
    set: (key, value) => ipcRenderer.invoke('settings-set', key, value),
    onSettingsChange: (callback) => {
      ipcRenderer.on('settings-changed', callback);
      return () => ipcRenderer.removeListener('settings-changed', callback);
    },
  },

  // File operations
  files: {
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    onImportFile: (callback) => {
      ipcRenderer.on('import-file', callback);
      return () => ipcRenderer.removeListener('import-file', callback);
    },
    onExportFile: (callback) => {
      ipcRenderer.on('export-file', callback);
      return () => ipcRenderer.removeListener('export-file', callback);
    },
  },

  // Notifications
  notifications: {
    show: (title, body, options) => ipcRenderer.invoke('show-notification', title, body, options),
  },

  // Navigation
  navigation: {
    onNavigateTo: (callback) => {
      ipcRenderer.on('navigate-to', callback);
      return () => ipcRenderer.removeListener('navigate-to', callback);
    },
    onDeepLink: (callback) => {
      ipcRenderer.on('deep-link', callback);
      return () => ipcRenderer.removeListener('deep-link', callback);
    },
  },

  // Menu actions
  menu: {
    onNewVoucher: (callback) => {
      ipcRenderer.on('new-voucher', callback);
      return () => ipcRenderer.removeListener('new-voucher', callback);
    },
    onShowSyncStatus: (callback) => {
      ipcRenderer.on('show-sync-status', callback);
      return () => ipcRenderer.removeListener('show-sync-status', callback);
    },
  },

  // System information
  system: {
    platform: process.platform,
    version: process.versions,
  },

  // Backend API integration
  api: {
    // Companies
    companies: {
      getAll: () => ipcRenderer.invoke('api-companies-get-all'),
      getById: (id) => ipcRenderer.invoke('api-companies-get-by-id', id),
      create: (company) => ipcRenderer.invoke('api-companies-create', company),
      update: (id, company) => ipcRenderer.invoke('api-companies-update', id, company),
      delete: (id) => ipcRenderer.invoke('api-companies-delete', id),
    },

    // Vouchers
    vouchers: {
      getAll: (filters) => ipcRenderer.invoke('api-vouchers-get-all', filters),
      getById: (id) => ipcRenderer.invoke('api-vouchers-get-by-id', id),
      create: (voucher) => ipcRenderer.invoke('api-vouchers-create', voucher),
      update: (id, voucher) => ipcRenderer.invoke('api-vouchers-update', id, voucher),
      delete: (id) => ipcRenderer.invoke('api-vouchers-delete', id),
      getByType: (type, filters) => ipcRenderer.invoke('api-vouchers-get-by-type', type, filters),
    },

    // Parties
    parties: {
      getAll: (filters) => ipcRenderer.invoke('api-parties-get-all', filters),
      getById: (id) => ipcRenderer.invoke('api-parties-get-by-id', id),
      create: (party) => ipcRenderer.invoke('api-parties-create', party),
      update: (id, party) => ipcRenderer.invoke('api-parties-update', id, party),
      delete: (id) => ipcRenderer.invoke('api-parties-delete', id),
      getByType: (type) => ipcRenderer.invoke('api-parties-get-by-type', type),
    },

    // Inventory
    inventory: {
      getAll: (filters) => ipcRenderer.invoke('api-inventory-get-all', filters),
      getById: (id) => ipcRenderer.invoke('api-inventory-get-by-id', id),
      create: (item) => ipcRenderer.invoke('api-inventory-create', item),
      update: (id, item) => ipcRenderer.invoke('api-inventory-update', id, item),
      delete: (id) => ipcRenderer.invoke('api-inventory-delete', id),
      updateStock: (id, quantity, type) => ipcRenderer.invoke('api-inventory-update-stock', id, quantity, type),
    },

    // Reports
    reports: {
      getTrialBalance: (filters) => ipcRenderer.invoke('api-reports-trial-balance', filters),
      getProfitLoss: (filters) => ipcRenderer.invoke('api-reports-profit-loss', filters),
      getBalanceSheet: (filters) => ipcRenderer.invoke('api-reports-balance-sheet', filters),
      getCashFlow: (filters) => ipcRenderer.invoke('api-reports-cash-flow', filters),
      getInventoryReport: (filters) => ipcRenderer.invoke('api-reports-inventory', filters),
      getPartyLedger: (partyId, filters) => ipcRenderer.invoke('api-reports-party-ledger', partyId, filters),
    },

    // ML Service integration
    ml: {
      predictPaymentDelay: (data) => ipcRenderer.invoke('api-ml-predict-payment-delay', data),
      getBusinessMetrics: (filters) => ipcRenderer.invoke('api-ml-business-metrics', filters),
      getCustomerInsights: (customerId) => ipcRenderer.invoke('api-ml-customer-insights', customerId),
      getInventoryForecast: (filters) => ipcRenderer.invoke('api-ml-inventory-forecast', filters),
      assessRisk: (data) => ipcRenderer.invoke('api-ml-assess-risk', data),
    },
  },

  // Import/Export functionality
  importExport: {
    importData: (filePath, type) => ipcRenderer.invoke('import-data', filePath, type),
    exportData: (data, filePath, type) => ipcRenderer.invoke('export-data', data, filePath, type),
    validateImportData: (data, type) => ipcRenderer.invoke('validate-import-data', data, type),
  },

  // Backup and restore
  backup: {
    create: () => ipcRenderer.invoke('backup-create'),
    restore: (filePath) => ipcRenderer.invoke('backup-restore', filePath),
    getBackupList: () => ipcRenderer.invoke('backup-get-list'),
    deleteBackup: (backupId) => ipcRenderer.invoke('backup-delete', backupId),
  },
});

// Expose version information
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

// Development helpers
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('dev', {
    openDevTools: () => ipcRenderer.invoke('dev-open-devtools'),
    reload: () => ipcRenderer.invoke('dev-reload'),
  });
}
