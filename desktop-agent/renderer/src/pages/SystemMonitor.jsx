import React from 'react'
import {
  CpuChipIcon,
  CircleStackIcon,
  ServerIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import Card from '../components/common/Card'
import ProgressBar from '../components/common/ProgressBar'
import Badge from '../components/common/Badge'
import { useAppStore } from '../stores/appStore'
import { formatBytes, formatDuration } from '../types'

const SystemMonitor = () => {
  const { systemPerformance, appState } = useAppStore()

  const getPerformanceVariant = (usage) => {
    if (usage >= 90) return 'error'
    if (usage >= 70) return 'warning'
    return 'primary'
  }

  const getPerformanceBadge = (usage) => {
    if (usage >= 90) return <Badge variant="error">Critical</Badge>
    if (usage >= 70) return <Badge variant="warning">High</Badge>
    if (usage >= 50) return <Badge variant="info">Medium</Badge>
    return <Badge variant="success">Normal</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Monitor</h1>
        <p className="text-gray-600">Monitor system performance and resource usage</p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <Card title="CPU Usage">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CpuChipIcon className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-900">
                  {systemPerformance.cpu.usage.toFixed(1)}%
                </span>
              </div>
              {getPerformanceBadge(systemPerformance.cpu.usage)}
            </div>
            
            <ProgressBar
              value={systemPerformance.cpu.usage}
              variant={getPerformanceVariant(systemPerformance.cpu.usage)}
              size="lg"
            />
            
            {systemPerformance.cpu.temperature > 0 && (
              <div className="text-sm text-gray-600">
                Temperature: {systemPerformance.cpu.temperature.toFixed(1)}°C
              </div>
            )}
          </div>
        </Card>

        {/* Memory Usage */}
        <Card title="Memory Usage">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CircleStackIcon className="w-5 h-5 text-success-600" />
                <span className="text-sm font-medium text-gray-900">
                  {systemPerformance.memory.usage.toFixed(1)}%
                </span>
              </div>
              {getPerformanceBadge(systemPerformance.memory.usage)}
            </div>
            
            <ProgressBar
              value={systemPerformance.memory.usage}
              variant={getPerformanceVariant(systemPerformance.memory.usage)}
              size="lg"
            />
            
            <div className="text-sm text-gray-600">
              {formatBytes(systemPerformance.memory.used)} / {formatBytes(systemPerformance.memory.total)}
            </div>
          </div>
        </Card>

        {/* Disk Usage */}
        <Card title="Disk Usage">
          <div className="space-y-4">
            {systemPerformance.disk.length > 0 ? (
              systemPerformance.disk.map((disk, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ServerIcon className="w-5 h-5 text-warning-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {disk.mount} ({disk.usage.toFixed(1)}%)
                      </span>
                    </div>
                    {getPerformanceBadge(disk.usage)}
                  </div>
                  
                  <ProgressBar
                    value={disk.usage}
                    variant={getPerformanceVariant(disk.usage)}
                    size="md"
                  />
                  
                  <div className="text-sm text-gray-600">
                    {formatBytes(disk.used)} / {formatBytes(disk.total)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No disk information available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* System Information */}
      <Card title="System Information">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Platform
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">OS:</span>
                <span className="text-sm font-medium text-gray-900">
                  {appState.agentInfo.platform || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Architecture:</span>
                <span className="text-sm font-medium text-gray-900">
                  {appState.agentInfo.arch || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Application
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Version:</span>
                <span className="text-sm font-medium text-gray-900">
                  {appState.agentInfo.version}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Agent ID:</span>
                <span className="text-sm font-medium text-gray-900 font-mono truncate">
                  {appState.agentInfo.agentId ? 
                    `${appState.agentInfo.agentId.substring(0, 8)}...` : 
                    'Not set'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDuration(appState.agentInfo.uptime * 1000)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Performance
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Update:</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemPerformance.lastUpdate ? 
                    new Date(systemPerformance.lastUpdate).toLocaleTimeString() : 
                    'Never'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge variant="success">Monitoring</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Network Information */}
      {systemPerformance.network.interfaces.length > 0 && (
        <Card title="Network Interfaces">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemPerformance.network.interfaces.map((iface, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {iface.iface}
                  </h4>
                  <Badge variant={iface.operstate === 'up' ? 'success' : 'secondary'}>
                    {iface.operstate}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">{iface.type}</span>
                  </div>
                  {iface.ip4 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IPv4:</span>
                      <span className="font-medium text-gray-900 font-mono">{iface.ip4}</span>
                    </div>
                  )}
                  {iface.speed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-medium text-gray-900">{iface.speed} Mbps</span>
                    </div>
                  )}
                  {iface.mac && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">MAC:</span>
                      <span className="font-medium text-gray-900 font-mono text-xs">{iface.mac}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default SystemMonitor
