import React, { useState } from 'react'
import {
  CogIcon,
  ServerIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Checkbox from '../components/common/Checkbox'
import { useAppStore } from '../stores/appStore'
import { useElectronAPI } from '../hooks/useElectronAPI'
import { ThemeOptions } from '../types'
import toast from 'react-hot-toast'

const Settings = () => {
  const { config, appState, updateConfig } = useAppStore()
  const { setConfig } = useElectronAPI()

  const [generalSettings, setGeneralSettings] = useState({
    autoStart: config.agent.autoStart,
    minimizeToTray: config.agent.minimizeToTray,
    startMinimized: config.agent.startMinimized,
    theme: config.ui.theme,
    checkUpdates: config.agent.checkUpdates
  })

  const [serverSettings, setServerSettings] = useState({
    url: config.server.url,
    apiKey: config.server.apiKey || ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    ...config.ui.notifications
  })

  const handleGeneralSettingsChange = async (key, value) => {
    const newSettings = { ...generalSettings, [key]: value }
    setGeneralSettings(newSettings)
    
    // Update configuration
    if (key === 'theme') {
      updateConfig('ui.theme', value)
    } else {
      updateConfig(`agent.${key}`, value)
    }
    
    await saveConfiguration(key, value)
  }

  const handleServerSettingsChange = (key, value) => {
    setServerSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleNotificationSettingsChange = async (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value }
    setNotificationSettings(newSettings)
    
    updateConfig('ui.notifications', newSettings)
    await saveConfiguration('notifications', newSettings)
  }

  const saveConfiguration = async (key, value) => {
    try {
      let newConfig = { ...config }
      
      if (key === 'theme') {
        newConfig.ui.theme = value
      } else if (key === 'notifications') {
        newConfig.ui.notifications = value
      } else {
        newConfig.agent[key] = value
      }
      
      await setConfig(newConfig)
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
      console.error('Save settings error:', error)
    }
  }

  const handleSaveServerSettings = async (e) => {
    e.preventDefault()
    
    try {
      const newConfig = {
        ...config,
        server: {
          ...config.server,
          ...serverSettings
        }
      }
      
      await setConfig(newConfig)
      updateConfig('server.url', serverSettings.url)
      updateConfig('server.apiKey', serverSettings.apiKey)
      
      toast.success('Server configuration saved successfully')
    } catch (error) {
      toast.error('Failed to save server configuration')
      console.error('Save server config error:', error)
    }
  }

  const handleExportConfig = () => {
    const configToExport = {
      ...config,
      server: {
        ...config.server,
        apiKey: '' // Don't export API key for security
      },
      agent: {
        ...config.agent,
        id: '' // Don't export agent ID
      }
    }
    
    const blob = new Blob([JSON.stringify(configToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finsync360-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Configuration exported successfully')
  }

  const handleImportConfig = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const text = await file.text()
          const importedConfig = JSON.parse(text)
          
          // Validate and merge configuration
          const newConfig = {
            ...config,
            ...importedConfig,
            agent: {
              ...config.agent,
              ...importedConfig.agent,
              id: config.agent.id // Keep current agent ID
            },
            server: {
              ...config.server,
              ...importedConfig.server,
              apiKey: config.server.apiKey // Keep current API key
            }
          }
          
          await setConfig(newConfig)
          
          // Update local state
          setGeneralSettings({
            autoStart: newConfig.agent.autoStart,
            minimizeToTray: newConfig.agent.minimizeToTray,
            startMinimized: newConfig.agent.startMinimized,
            theme: newConfig.ui.theme,
            checkUpdates: newConfig.agent.checkUpdates
          })
          
          setNotificationSettings(newConfig.ui.notifications)
          
          toast.success('Configuration imported successfully')
        } catch (error) {
          toast.error('Failed to import configuration')
          console.error('Import config error:', error)
        }
      }
    }
    input.click()
  }

  const handleCheckUpdates = () => {
    // This would trigger the update check in Electron
    toast.success('Checking for updates...')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your FinSync360 desktop agent preferences</p>
      </div>

      {/* General Settings */}
      <Card title="General Settings" icon={CogIcon}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Checkbox
                label="Start with Windows"
                description="Automatically start the agent when Windows starts"
                checked={generalSettings.autoStart}
                onChange={(e) => handleGeneralSettingsChange('autoStart', e.target.checked)}
              />
              
              <Checkbox
                label="Minimize to system tray"
                description="Hide the window in the system tray when minimized"
                checked={generalSettings.minimizeToTray}
                onChange={(e) => handleGeneralSettingsChange('minimizeToTray', e.target.checked)}
              />
              
              <Checkbox
                label="Start minimized"
                description="Start the application minimized to the system tray"
                checked={generalSettings.startMinimized}
                onChange={(e) => handleGeneralSettingsChange('startMinimized', e.target.checked)}
              />
            </div>
            
            <div className="space-y-4">
              <Select
                label="Theme"
                value={generalSettings.theme}
                onChange={(e) => handleGeneralSettingsChange('theme', e.target.value)}
                options={ThemeOptions}
              />
              
              <Checkbox
                label="Check for updates"
                description="Automatically check for application updates"
                checked={generalSettings.checkUpdates}
                onChange={(e) => handleGeneralSettingsChange('checkUpdates', e.target.checked)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Server Configuration */}
      <Card title="Server Configuration" icon={ServerIcon}>
        <form onSubmit={handleSaveServerSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Server URL"
              type="url"
              value={serverSettings.url}
              onChange={(e) => handleServerSettingsChange('url', e.target.value)}
              placeholder="ws://localhost:5000/tally-agent"
              required
              helperText="WebSocket URL for FinSync360 server connection"
            />
            
            <Input
              label="API Key"
              type="password"
              value={serverSettings.apiKey}
              onChange={(e) => handleServerSettingsChange('apiKey', e.target.value)}
              placeholder="Enter your API key"
              helperText="Authentication key for server access"
            />
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Save Server Configuration
            </Button>
          </div>
        </form>
      </Card>

      {/* Notification Settings */}
      <Card title="Notification Settings">
        <div className="space-y-4">
          <Checkbox
            label="Sync completion notifications"
            description="Show notifications when sync operations complete"
            checked={notificationSettings.syncComplete}
            onChange={(e) => handleNotificationSettingsChange('syncComplete', e.target.checked)}
          />
          
          <Checkbox
            label="Sync error notifications"
            description="Show notifications when sync operations fail"
            checked={notificationSettings.syncError}
            onChange={(e) => handleNotificationSettingsChange('syncError', e.target.checked)}
          />
          
          <Checkbox
            label="Connection lost notifications"
            description="Show notifications when connections are lost"
            checked={notificationSettings.connectionLost}
            onChange={(e) => handleNotificationSettingsChange('connectionLost', e.target.checked)}
          />
          
          <Checkbox
            label="Update notifications"
            description="Show notifications about available updates"
            checked={notificationSettings.updates}
            onChange={(e) => handleNotificationSettingsChange('updates', e.target.checked)}
          />
        </div>
      </Card>

      {/* About & Actions */}
      <Card title="About" icon={InformationCircleIcon}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Version:</span>
                <span className="text-sm text-gray-900">{appState.agentInfo.version}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Agent ID:</span>
                <span className="text-sm text-gray-900 font-mono">
                  {appState.agentInfo.agentId ? 
                    `${appState.agentInfo.agentId.substring(0, 12)}...` : 
                    'Not set'
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Platform:</span>
                <span className="text-sm text-gray-900">
                  {appState.agentInfo.platform} ({appState.agentInfo.arch})
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                icon={ArrowPathIcon}
                onClick={handleCheckUpdates}
                fullWidth
              >
                Check for Updates
              </Button>
              
              <Button
                variant="outline"
                icon={ArrowDownTrayIcon}
                onClick={handleExportConfig}
                fullWidth
              >
                Export Configuration
              </Button>
              
              <Button
                variant="outline"
                icon={ArrowUpTrayIcon}
                onClick={handleImportConfig}
                fullWidth
              >
                Import Configuration
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Settings
