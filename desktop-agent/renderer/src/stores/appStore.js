import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { ConnectionStatus, SyncStatus, DefaultConfig } from '../types'

export const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // Connection State
    connectionStatus: {
      server: ConnectionStatus.DISCONNECTED,
      tally: ConnectionStatus.DISCONNECTED,
      lastConnected: null,
      reconnectAttempts: 0
    },

    // Sync State
    syncStatus: {
      status: SyncStatus.IDLE,
      progress: 0,
      currentOperation: null,
      lastSync: null,
      totalItems: 0,
      processedItems: 0,
      errors: [],
      history: []
    },

    // System Performance
    systemPerformance: {
      cpu: { usage: 0, temperature: 0 },
      memory: { usage: 0, total: 0, used: 0 },
      disk: [],
      network: { interfaces: [], stats: [] },
      lastUpdate: null
    },

    // Configuration
    config: DefaultConfig,

    // Application State
    appState: {
      isLoading: false,
      currentPage: 'dashboard',
      notifications: [],
      logs: [],
      tallyCompanies: [],
      agentInfo: {
        version: '1.0.0',
        agentId: '',
        uptime: 0
      }
    },

    // Actions
    setConnectionStatus: (type, status) => set((state) => ({
      connectionStatus: {
        ...state.connectionStatus,
        [type]: status,
        lastConnected: status === ConnectionStatus.CONNECTED ? new Date() : state.connectionStatus.lastConnected
      }
    })),

    setSyncStatus: (updates) => set((state) => ({
      syncStatus: {
        ...state.syncStatus,
        ...updates
      }
    })),

    setSystemPerformance: (performance) => set(() => ({
      systemPerformance: {
        ...performance,
        lastUpdate: new Date()
      }
    })),

    updateConfig: (path, value) => set((state) => {
      const newConfig = { ...state.config }
      const keys = path.split('.')
      let current = newConfig
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      
      return { config: newConfig }
    }),

    setConfig: (config) => set(() => ({
      config: { ...DefaultConfig, ...config }
    })),

    addNotification: (notification) => set((state) => ({
      appState: {
        ...state.appState,
        notifications: [
          ...state.appState.notifications,
          {
            id: Date.now(),
            timestamp: new Date(),
            ...notification
          }
        ]
      }
    })),

    removeNotification: (id) => set((state) => ({
      appState: {
        ...state.appState,
        notifications: state.appState.notifications.filter(n => n.id !== id)
      }
    })),

    addLog: (log) => set((state) => ({
      appState: {
        ...state.appState,
        logs: [
          {
            id: Date.now(),
            timestamp: new Date(),
            ...log
          },
          ...state.appState.logs
        ].slice(0, 1000) // Keep only last 1000 logs
      }
    })),

    clearLogs: () => set((state) => ({
      appState: {
        ...state.appState,
        logs: []
      }
    })),

    setTallyCompanies: (companies) => set((state) => ({
      appState: {
        ...state.appState,
        tallyCompanies: companies
      }
    })),

    setAgentInfo: (info) => set((state) => ({
      appState: {
        ...state.appState,
        agentInfo: {
          ...state.appState.agentInfo,
          ...info
        }
      }
    })),

    setLoading: (isLoading) => set((state) => ({
      appState: {
        ...state.appState,
        isLoading
      }
    })),

    setCurrentPage: (page) => set((state) => ({
      appState: {
        ...state.appState,
        currentPage: page
      }
    })),

    addSyncHistory: (syncSession) => set((state) => ({
      syncStatus: {
        ...state.syncStatus,
        history: [
          syncSession,
          ...state.syncStatus.history
        ].slice(0, 50) // Keep only last 50 sync sessions
      }
    })),

    // Computed getters
    getConnectionStatus: () => {
      const state = get()
      const { server, tally } = state.connectionStatus
      
      if (server === ConnectionStatus.CONNECTED && tally === ConnectionStatus.CONNECTED) {
        return ConnectionStatus.CONNECTED
      } else if (server === ConnectionStatus.CONNECTING || tally === ConnectionStatus.CONNECTING) {
        return ConnectionStatus.CONNECTING
      } else if (server === ConnectionStatus.ERROR || tally === ConnectionStatus.ERROR) {
        return ConnectionStatus.ERROR
      } else {
        return ConnectionStatus.DISCONNECTED
      }
    },

    isConnected: () => {
      const state = get()
      return state.connectionStatus.server === ConnectionStatus.CONNECTED &&
             state.connectionStatus.tally === ConnectionStatus.CONNECTED
    },

    isSyncing: () => {
      const state = get()
      return state.syncStatus.status === SyncStatus.RUNNING
    },

    getFilteredLogs: (level = 'all') => {
      const state = get()
      if (level === 'all') return state.appState.logs
      return state.appState.logs.filter(log => log.level === level)
    },

    getRecentActivity: (limit = 10) => {
      const state = get()
      const activities = []
      
      // Add sync history
      state.syncStatus.history.slice(0, 5).forEach(sync => {
        activities.push({
          id: `sync-${sync.id}`,
          timestamp: sync.endTime || sync.startTime,
          type: 'sync',
          message: `Sync ${sync.status}: ${sync.processedItems}/${sync.totalItems} items`,
          status: sync.status
        })
      })
      
      // Add recent logs (errors and warnings)
      state.appState.logs
        .filter(log => log.level === 'error' || log.level === 'warn')
        .slice(0, 5)
        .forEach(log => {
          activities.push({
            id: `log-${log.id}`,
            timestamp: log.timestamp,
            type: 'log',
            message: log.message,
            status: log.level
          })
        })
      
      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
    },

    // Reset functions
    resetSyncStatus: () => set((state) => ({
      syncStatus: {
        ...state.syncStatus,
        status: SyncStatus.IDLE,
        progress: 0,
        currentOperation: null,
        totalItems: 0,
        processedItems: 0,
        errors: []
      }
    })),

    resetConnectionStatus: () => set(() => ({
      connectionStatus: {
        server: ConnectionStatus.DISCONNECTED,
        tally: ConnectionStatus.DISCONNECTED,
        lastConnected: null,
        reconnectAttempts: 0
      }
    }))
  }))
)

// Subscribe to connection status changes for notifications
useAppStore.subscribe(
  (state) => state.connectionStatus,
  (connectionStatus, prevConnectionStatus) => {
    const { addNotification } = useAppStore.getState()
    
    // Server connection notifications
    if (prevConnectionStatus.server !== connectionStatus.server) {
      if (connectionStatus.server === ConnectionStatus.CONNECTED) {
        addNotification({
          type: 'success',
          title: 'Server Connected',
          message: 'Successfully connected to FinSync360 server'
        })
      } else if (connectionStatus.server === ConnectionStatus.DISCONNECTED && prevConnectionStatus.server === ConnectionStatus.CONNECTED) {
        addNotification({
          type: 'error',
          title: 'Server Disconnected',
          message: 'Lost connection to FinSync360 server'
        })
      }
    }
    
    // Tally connection notifications
    if (prevConnectionStatus.tally !== connectionStatus.tally) {
      if (connectionStatus.tally === ConnectionStatus.CONNECTED) {
        addNotification({
          type: 'success',
          title: 'Tally Connected',
          message: 'Successfully connected to Tally ERP'
        })
      } else if (connectionStatus.tally === ConnectionStatus.DISCONNECTED && prevConnectionStatus.tally === ConnectionStatus.CONNECTED) {
        addNotification({
          type: 'error',
          title: 'Tally Disconnected',
          message: 'Lost connection to Tally ERP'
        })
      }
    }
  }
)

// Subscribe to sync status changes for notifications
useAppStore.subscribe(
  (state) => state.syncStatus.status,
  (status, prevStatus) => {
    const { addNotification, config } = useAppStore.getState()
    
    if (!config.ui.notifications.syncComplete && !config.ui.notifications.syncError) {
      return
    }
    
    if (status === SyncStatus.COMPLETED && prevStatus === SyncStatus.RUNNING) {
      if (config.ui.notifications.syncComplete) {
        addNotification({
          type: 'success',
          title: 'Sync Completed',
          message: 'Data synchronization completed successfully'
        })
      }
    } else if (status === SyncStatus.FAILED && prevStatus === SyncStatus.RUNNING) {
      if (config.ui.notifications.syncError) {
        addNotification({
          type: 'error',
          title: 'Sync Failed',
          message: 'Data synchronization failed. Check logs for details.'
        })
      }
    }
  }
)
