import { useCallback, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { ConnectionStatus, SyncStatus } from '../types'
import toast from 'react-hot-toast'

export const useElectronAPI = () => {
  const {
    setConnectionStatus,
    setSyncStatus,
    setSystemPerformance,
    setConfig,
    addLog,
    setTallyCompanies,
    setAgentInfo,
    addSyncHistory,
    addNotification
  } = useAppStore()

  // Check if Electron API is available
  const isElectronAvailable = typeof window !== 'undefined' && window.electronAPI

  // Initialize API and set up event listeners
  const initializeAPI = useCallback(async () => {
    if (!isElectronAvailable) {
      console.warn('Electron API not available - running in browser mode')
      return
    }

    try {
      // Load initial configuration
      const config = await window.electronAPI.getConfig()
      if (config) {
        setConfig(config)
      }

      // Load initial system info
      const systemInfo = await window.electronAPI.getSystemInfo()
      if (systemInfo) {
        setAgentInfo({
          version: systemInfo.versions?.app || '1.0.0',
          agentId: config?.agent?.id || '',
          platform: systemInfo.platform,
          arch: systemInfo.arch
        })
      }

      // Set up event listeners
      setupEventListeners()

      console.log('Electron API initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Electron API:', error)
      addLog({
        level: 'error',
        message: `Failed to initialize Electron API: ${error.message}`
      })
    }
  }, [isElectronAvailable, setConfig, setAgentInfo, addLog])

  // Set up event listeners for Electron events
  const setupEventListeners = useCallback(() => {
    if (!isElectronAvailable) return

    // Sync status updates
    const unsubscribeSyncStatus = window.electronAPI.onSyncStatusUpdate((data) => {
      setSyncStatus(data)
      
      if (data.status === SyncStatus.COMPLETED) {
        addSyncHistory(data)
      }
    })

    // Tally connection updates
    const unsubscribeTallyConnection = window.electronAPI.onTallyConnectionUpdate((data) => {
      setConnectionStatus('tally', data.isConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED)
      
      if (data.companies) {
        setTallyCompanies(data.companies)
      }
    })

    // WebSocket connection updates
    const unsubscribeWebSocket = window.electronAPI.onWebSocketUpdate((data) => {
      setConnectionStatus('server', data.isConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED)
    })

    // Notification events
    const unsubscribeNotifications = window.electronAPI.onShowNotification((data) => {
      addNotification({
        type: data.type || 'info',
        title: data.title,
        message: data.body || data.message
      })
      
      // Also show toast notification
      toast(data.body || data.message, {
        icon: data.type === 'error' ? '❌' : data.type === 'success' ? '✅' : 'ℹ️'
      })
    })

    // Settings events
    const unsubscribeSettings = window.electronAPI.onShowSettings(() => {
      // This would be handled by the main App component
      console.log('Show settings requested')
    })

    // Cleanup function
    return () => {
      unsubscribeSyncStatus?.()
      unsubscribeTallyConnection?.()
      unsubscribeWebSocket?.()
      unsubscribeNotifications?.()
      unsubscribeSettings?.()
    }
  }, [isElectronAvailable, setSyncStatus, setConnectionStatus, setTallyCompanies, addNotification, addSyncHistory])

  // Configuration methods
  const getConfig = useCallback(async () => {
    if (!isElectronAvailable) return null
    try {
      return await window.electronAPI.getConfig()
    } catch (error) {
      console.error('Failed to get config:', error)
      return null
    }
  }, [isElectronAvailable])

  const setConfigValue = useCallback(async (config) => {
    if (!isElectronAvailable) return false
    try {
      await window.electronAPI.setConfig(config)
      setConfig(config)
      return true
    } catch (error) {
      console.error('Failed to set config:', error)
      toast.error('Failed to save configuration')
      return false
    }
  }, [isElectronAvailable, setConfig])

  // Tally methods
  const testTallyConnection = useCallback(async () => {
    if (!isElectronAvailable) return false
    try {
      const result = await window.electronAPI.tallyTestConnection()
      if (result) {
        toast.success('Tally connection successful')
        setConnectionStatus('tally', ConnectionStatus.CONNECTED)
      } else {
        toast.error('Tally connection failed')
        setConnectionStatus('tally', ConnectionStatus.DISCONNECTED)
      }
      return result
    } catch (error) {
      console.error('Tally connection test failed:', error)
      toast.error(`Tally connection failed: ${error.message}`)
      setConnectionStatus('tally', ConnectionStatus.DISCONNECTED)
      return false
    }
  }, [isElectronAvailable, setConnectionStatus])

  const getTallyCompanies = useCallback(async () => {
    if (!isElectronAvailable) return []
    try {
      const companies = await window.electronAPI.tallyGetCompanies()
      setTallyCompanies(companies)
      return companies
    } catch (error) {
      console.error('Failed to get Tally companies:', error)
      toast.error('Failed to fetch Tally companies')
      return []
    }
  }, [isElectronAvailable, setTallyCompanies])

  // Sync methods
  const startSync = useCallback(async () => {
    if (!isElectronAvailable) return false
    try {
      const result = await window.electronAPI.syncStart()
      if (result) {
        setSyncStatus({ status: SyncStatus.RUNNING, progress: 0 })
        toast.success('Sync started')
      } else {
        toast.error('Failed to start sync')
      }
      return result
    } catch (error) {
      console.error('Failed to start sync:', error)
      toast.error(`Failed to start sync: ${error.message}`)
      return false
    }
  }, [isElectronAvailable, setSyncStatus])

  const stopSync = useCallback(async () => {
    if (!isElectronAvailable) return false
    try {
      const result = await window.electronAPI.syncStop()
      if (result) {
        setSyncStatus({ status: SyncStatus.IDLE })
        toast.success('Sync stopped')
      }
      return result
    } catch (error) {
      console.error('Failed to stop sync:', error)
      toast.error(`Failed to stop sync: ${error.message}`)
      return false
    }
  }, [isElectronAvailable, setSyncStatus])

  const getSyncStatus = useCallback(async () => {
    if (!isElectronAvailable) return null
    try {
      return await window.electronAPI.syncStatus()
    } catch (error) {
      console.error('Failed to get sync status:', error)
      return null
    }
  }, [isElectronAvailable])

  // System methods
  const getSystemInfo = useCallback(async () => {
    if (!isElectronAvailable) return null
    try {
      return await window.electronAPI.getSystemInfo()
    } catch (error) {
      console.error('Failed to get system info:', error)
      return null
    }
  }, [isElectronAvailable])

  // Window methods
  const minimizeToTray = useCallback(() => {
    if (!isElectronAvailable) return
    window.electronAPI.minimizeToTray()
  }, [isElectronAvailable])

  const quitApp = useCallback(() => {
    if (!isElectronAvailable) return
    window.electronAPI.quitApp()
  }, [isElectronAvailable])

  const showNotification = useCallback((title, body) => {
    if (!isElectronAvailable) {
      // Fallback to toast notification
      toast(body, { icon: 'ℹ️' })
      return
    }
    window.electronAPI.showNotification(title, body)
  }, [isElectronAvailable])

  // Set up periodic system performance updates
  useEffect(() => {
    if (!isElectronAvailable) return

    const updateSystemPerformance = async () => {
      try {
        const systemInfo = await getSystemInfo()
        if (systemInfo) {
          // This would need to be implemented in the Electron main process
          // For now, we'll use mock data
          setSystemPerformance({
            cpu: { usage: Math.random() * 100, temperature: 45 + Math.random() * 20 },
            memory: { 
              usage: Math.random() * 100, 
              total: 16 * 1024 * 1024 * 1024, 
              used: Math.random() * 16 * 1024 * 1024 * 1024 
            },
            disk: [
              { 
                mount: '/', 
                usage: Math.random() * 100, 
                total: 500 * 1024 * 1024 * 1024,
                used: Math.random() * 500 * 1024 * 1024 * 1024
              }
            ],
            network: { interfaces: [], stats: [] }
          })
        }
      } catch (error) {
        console.error('Failed to update system performance:', error)
      }
    }

    // Update immediately
    updateSystemPerformance()

    // Set up periodic updates
    const interval = setInterval(updateSystemPerformance, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [isElectronAvailable, getSystemInfo, setSystemPerformance])

  return {
    isElectronAvailable,
    initializeAPI,
    
    // Configuration
    getConfig,
    setConfig: setConfigValue,
    
    // Tally
    testTallyConnection,
    getTallyCompanies,
    
    // Sync
    startSync,
    stopSync,
    getSyncStatus,
    
    // System
    getSystemInfo,
    
    // Window
    minimizeToTray,
    quitApp,
    showNotification
  }
}
