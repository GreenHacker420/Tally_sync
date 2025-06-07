import React, { useState, useEffect } from 'react'
import {
  ServerIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Badge from '../components/common/Badge'
import { useAppStore } from '../stores/appStore'
import { useElectronAPI } from '../hooks/useElectronAPI'
import { ConnectionStatus } from '../types'
import toast from 'react-hot-toast'

const TallyConnection = () => {
  const {
    connectionStatus,
    config,
    appState,
    updateConfig
  } = useAppStore()

  const {
    testTallyConnection,
    getTallyCompanies,
    setConfig
  } = useElectronAPI()

  const [tallyConfig, setTallyConfig] = useState({
    host: config.tally.host,
    port: config.tally.port,
    timeout: config.tally.timeout
  })

  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)

  const handleConfigChange = (field, value) => {
    setTallyConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    
    try {
      // Validate inputs
      if (!tallyConfig.host.trim()) {
        toast.error('Host is required')
        return
      }
      
      if (tallyConfig.port < 1 || tallyConfig.port > 65535) {
        toast.error('Port must be between 1 and 65535')
        return
      }
      
      if (tallyConfig.timeout < 1000) {
        toast.error('Timeout must be at least 1000ms')
        return
      }

      // Update configuration
      const newConfig = {
        ...config,
        tally: {
          ...config.tally,
          ...tallyConfig
        }
      }

      await setConfig(newConfig)
      
      // Update store
      Object.entries(tallyConfig).forEach(([key, value]) => {
        updateConfig(`tally.${key}`, value)
      })

      toast.success('Tally configuration saved successfully')
    } catch (error) {
      toast.error('Failed to save configuration')
      console.error('Save config error:', error)
    }
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    try {
      await testTallyConnection()
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleRefreshCompanies = async () => {
    if (connectionStatus.tally !== ConnectionStatus.CONNECTED) {
      toast.error('Please connect to Tally first')
      return
    }

    setIsLoadingCompanies(true)
    try {
      await getTallyCompanies()
      toast.success('Companies refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh companies')
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  const getConnectionStatusBadge = (status) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return <Badge variant="success">Connected</Badge>
      case ConnectionStatus.CONNECTING:
        return <Badge variant="warning">Connecting</Badge>
      case ConnectionStatus.ERROR:
        return <Badge variant="error">Error</Badge>
      default:
        return <Badge variant="secondary">Disconnected</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tally Connection</h1>
        <p className="text-gray-600">Configure and manage your connection to Tally ERP</p>
      </div>

      {/* Connection Status */}
      <Card title="Connection Status">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <ServerIcon className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tally ERP</h3>
              <p className="text-sm text-gray-600">
                {tallyConfig.host}:{tallyConfig.port}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getConnectionStatusBadge(connectionStatus.tally)}
            <p className="text-sm text-gray-500 mt-1">
              {appState.tallyCompanies.length} companies available
            </p>
          </div>
        </div>
      </Card>

      {/* Tally Configuration */}
      <Card
        title="Tally Connection Settings"
        actions={
          <Button
            variant="primary"
            icon={WrenchScrewdriverIcon}
            onClick={handleTestConnection}
            loading={isTestingConnection}
            size="sm"
          >
            Test Connection
          </Button>
        }
      >
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Tally Host"
              type="text"
              value={tallyConfig.host}
              onChange={(e) => handleConfigChange('host', e.target.value)}
              placeholder="localhost"
              required
              helperText="IP address or hostname where Tally is running"
            />

            <Input
              label="Tally Port"
              type="number"
              value={tallyConfig.port}
              onChange={(e) => handleConfigChange('port', parseInt(e.target.value) || 9000)}
              min="1"
              max="65535"
              required
              helperText="Port number for Tally ODBC server (default: 9000)"
            />
          </div>

          <Input
            label="Connection Timeout (ms)"
            type="number"
            value={tallyConfig.timeout}
            onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value) || 30000)}
            min="1000"
            required
            helperText="Maximum time to wait for connection response"
            className="md:w-1/2"
          />

          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Save Settings
            </Button>
          </div>
        </form>
      </Card>

      {/* Tally Companies */}
      <Card
        title="Tally Companies"
        actions={
          <Button
            variant="secondary"
            icon={ArrowPathIcon}
            onClick={handleRefreshCompanies}
            loading={isLoadingCompanies}
            disabled={connectionStatus.tally !== ConnectionStatus.CONNECTED}
            size="sm"
          >
            Refresh
          </Button>
        }
      >
        <div className="space-y-4">
          {appState.tallyCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appState.tallyCompanies.map((company, index) => (
                <div
                  key={company.guid || index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900 truncate">
                        {company.name}
                      </span>
                    </div>
                    <CheckCircleIcon className="w-5 h-5 text-success-500" />
                  </div>
                  
                  {company.guid && (
                    <p className="text-xs text-gray-500 font-mono truncate">
                      ID: {company.guid}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {connectionStatus.tally === ConnectionStatus.CONNECTED ? (
                <>
                  <BuildingOfficeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No companies found</p>
                  <p className="text-sm text-gray-400">
                    Make sure Tally is running with companies loaded
                  </p>
                </>
              ) : (
                <>
                  <XCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Not connected to Tally</p>
                  <p className="text-sm text-gray-400">
                    Configure and test your connection to view companies
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default TallyConnection
