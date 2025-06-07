// Connection Status Types
export const ConnectionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error'
}

// Sync Status Types
export const SyncStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused'
}

// Log Levels
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

// System Performance Thresholds
export const PerformanceThresholds = {
  CPU_HIGH: 80,
  MEMORY_HIGH: 85,
  DISK_HIGH: 90,
  TEMPERATURE_HIGH: 70
}

// Sync Intervals
export const SyncIntervals = [
  { value: '*/1 * * * *', label: 'Every minute' },
  { value: '*/5 * * * *', label: 'Every 5 minutes' },
  { value: '*/15 * * * *', label: 'Every 15 minutes' },
  { value: '*/30 * * * *', label: 'Every 30 minutes' },
  { value: '0 * * * *', label: 'Every hour' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
  { value: '0 0 * * *', label: 'Daily' }
]

// Theme Options
export const ThemeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' }
]

// Navigation Items
export const NavigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'ChartBarIcon',
    description: 'Overview and quick actions'
  },
  {
    id: 'sync',
    label: 'Sync Status',
    icon: 'ArrowPathIcon',
    description: 'Synchronization management'
  },
  {
    id: 'tally',
    label: 'Tally Connection',
    icon: 'ServerIcon',
    description: 'Tally ERP configuration'
  },
  {
    id: 'system',
    label: 'System Monitor',
    icon: 'ComputerDesktopIcon',
    description: 'Performance monitoring'
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: 'DocumentTextIcon',
    description: 'Application logs'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'CogIcon',
    description: 'Application settings'
  }
]

// Default Configuration
export const DefaultConfig = {
  server: {
    url: 'ws://localhost:5000/tally-agent',
    apiUrl: 'http://localhost:5000/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 5000
  },
  tally: {
    host: 'localhost',
    port: 9000,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 5000
  },
  sync: {
    autoSync: true,
    syncInterval: '*/5 * * * *',
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 5000,
    syncTypes: {
      vouchers: true,
      items: true,
      parties: true,
      companies: true
    }
  },
  agent: {
    autoStart: true,
    minimizeToTray: true,
    startMinimized: false,
    checkUpdates: true,
    logLevel: 'info'
  },
  ui: {
    theme: 'light',
    language: 'en',
    notifications: {
      syncComplete: true,
      syncError: true,
      connectionLost: true,
      updates: true
    }
  }
}

// Utility functions for type checking
export const isValidConnectionStatus = (status) => {
  return Object.values(ConnectionStatus).includes(status)
}

export const isValidSyncStatus = (status) => {
  return Object.values(SyncStatus).includes(status)
}

export const isValidLogLevel = (level) => {
  return Object.values(LogLevel).includes(level)
}

// Format helpers
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

export const formatRelativeTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now - time
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  return 'Just now'
}
