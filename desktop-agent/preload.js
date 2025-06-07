const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration API
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  
  // Tally Service API
  tallyTestConnection: () => ipcRenderer.invoke('tally-test-connection'),
  tallyGetCompanies: () => ipcRenderer.invoke('tally-get-companies'),
  
  // Sync API
  syncStart: () => ipcRenderer.invoke('sync-start'),
  syncStop: () => ipcRenderer.invoke('sync-stop'),
  syncStatus: () => ipcRenderer.invoke('sync-status'),
  
  // System API
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Window API
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  
  // Event listeners
  onShowSettings: (callback) => {
    ipcRenderer.on('show-settings', callback);
    return () => ipcRenderer.removeListener('show-settings', callback);
  },
  
  onShowNotification: (callback) => {
    ipcRenderer.on('show-notification', (event, data) => callback(data));
    return () => ipcRenderer.removeListener('show-notification', callback);
  },
  
  onSyncStatusUpdate: (callback) => {
    ipcRenderer.on('sync-status-update', (event, data) => callback(data));
    return () => ipcRenderer.removeListener('sync-status-update', callback);
  },
  
  onTallyConnectionUpdate: (callback) => {
    ipcRenderer.on('tally-connection-update', (event, data) => callback(data));
    return () => ipcRenderer.removeListener('tally-connection-update', callback);
  },
  
  onWebSocketUpdate: (callback) => {
    ipcRenderer.on('websocket-update', (event, data) => callback(data));
    return () => ipcRenderer.removeListener('websocket-update', callback);
  },
  
  // Remove all listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('show-settings');
    ipcRenderer.removeAllListeners('show-notification');
    ipcRenderer.removeAllListeners('sync-status-update');
    ipcRenderer.removeAllListeners('tally-connection-update');
    ipcRenderer.removeAllListeners('websocket-update');
  }
});

// Expose version info
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  app: () => require('./package.json').version
});

// Expose platform info
contextBridge.exposeInMainWorld('platform', {
  os: () => process.platform,
  arch: () => process.arch,
  isWindows: () => process.platform === 'win32',
  isMac: () => process.platform === 'darwin',
  isLinux: () => process.platform === 'linux'
});
