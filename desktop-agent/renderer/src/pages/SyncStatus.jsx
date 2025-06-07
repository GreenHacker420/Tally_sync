import React, { useState } from 'react'
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import ProgressBar from '../components/common/ProgressBar'
import Checkbox from '../components/common/Checkbox'
import Select from '../components/common/Select'
import { useAppStore } from '../stores/appStore'
import { useElectronAPI } from '../hooks/useElectronAPI'
import { SyncStatus as SyncStatusEnum, SyncIntervals, formatTimestamp, formatDuration } from '../types'

const SyncStatus = () => {
  const {
    syncStatus,
    config,
    updateConfig,
    isSyncing
  } = useAppStore()

  const {
    startSync,
    stopSync,
    setConfig
  } = useElectronAPI()

  const [localConfig, setLocalConfig] = useState({
    autoSync: config.sync.autoSync,
    syncInterval: config.sync.syncInterval,
    syncTypes: { ...config.sync.syncTypes }
  })

  const handleStartSync = async () => {
    await startSync()
  }

  const handleStopSync = async () => {
    await stopSync()
  }

  const handleConfigChange = async (key, value) => {
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    
    // Update the store and save to Electron
    updateConfig(`sync.${key}`, value)
    await setConfig({
      ...config,
      sync: {
        ...config.sync,
        [key]: value
      }
    })
  }

  const handleSyncTypeChange = async (type, enabled) => {
    const newSyncTypes = { ...localConfig.syncTypes, [type]: enabled }
    setLocalConfig({ ...localConfig, syncTypes: newSyncTypes })
    
    updateConfig('sync.syncTypes', newSyncTypes)
    await setConfig({
      ...config,
      sync: {
        ...config.sync,
        syncTypes: newSyncTypes
      }
    })
  }

  const getSyncStatusBadge = (status) => {
    switch (status) {
      case SyncStatusEnum.RUNNING:
        return <Badge variant="info">Running</Badge>
      case SyncStatusEnum.COMPLETED:
        return <Badge variant="success">Completed</Badge>
      case SyncStatusEnum.FAILED:
        return <Badge variant="error">Failed</Badge>
      case SyncStatusEnum.PAUSED:
        return <Badge variant="warning">Paused</Badge>
      default:
        return <Badge variant="secondary">Idle</Badge>
    }
  }

  const getHistoryIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-success-500" />
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-error-500" />
      case 'running':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sync Status</h1>
        <p className="text-gray-600">Manage data synchronization between Tally ERP and FinSync360</p>
      </div>

      {/* Sync Configuration */}
      <Card
        title="Sync Configuration"
        actions={
          <div className="flex space-x-2">
            {isSyncing() ? (
              <Button
                variant="error"
                icon={StopIcon}
                onClick={handleStopSync}
                size="sm"
              >
                Stop Sync
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={PlayIcon}
                onClick={handleStartSync}
                size="sm"
              >
                Start Sync
              </Button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Checkbox
              label="Auto Sync Enabled"
              description="Automatically sync data at regular intervals"
              checked={localConfig.autoSync}
              onChange={(e) => handleConfigChange('autoSync', e.target.checked)}
            />

            <Select
              label="Sync Interval"
              value={localConfig.syncInterval}
              onChange={(e) => handleConfigChange('syncInterval', e.target.value)}
              options={SyncIntervals}
              disabled={!localConfig.autoSync}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Sync Types</h4>
            <div className="space-y-3">
              {Object.entries(localConfig.syncTypes).map(([type, enabled]) => (
                <Checkbox
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  checked={enabled}
                  onChange={(e) => handleSyncTypeChange(type, e.target.checked)}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Current Sync Progress */}
      <Card title="Sync Progress">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-900">Status:</span>
              {getSyncStatusBadge(syncStatus.status)}
            </div>
            {syncStatus.currentOperation && (
              <span className="text-sm text-gray-600">
                {syncStatus.currentOperation}
              </span>
            )}
          </div>

          {isSyncing() && (
            <ProgressBar
              value={syncStatus.progress}
              max={100}
              variant="primary"
              showLabel
              label={`${syncStatus.processedItems}/${syncStatus.totalItems} items`}
              animated
            />
          )}

          {syncStatus.errors.length > 0 && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-error-500" />
                <span className="text-sm font-medium text-error-800">
                  Sync Errors ({syncStatus.errors.length})
                </span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {syncStatus.errors.slice(0, 5).map((error, index) => (
                  <p key={index} className="text-sm text-error-700">
                    {error.message || error}
                  </p>
                ))}
                {syncStatus.errors.length > 5 && (
                  <p className="text-sm text-error-600">
                    ... and {syncStatus.errors.length - 5} more errors
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sync History */}
      <Card title="Sync History">
        <div className="space-y-4">
          {syncStatus.history.length > 0 ? (
            <div className="space-y-3">
              {syncStatus.history.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getHistoryIcon(session.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          Sync Session
                        </span>
                        {getSyncStatusBadge(session.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(session.startTime)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {session.processedItems}/{session.totalItems} items
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.endTime && formatDuration(
                        new Date(session.endTime) - new Date(session.startTime)
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sync history available</p>
              <p className="text-sm text-gray-400">Start a sync to see history here</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default SyncStatus
