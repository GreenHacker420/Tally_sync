import React, { useState, useRef, useEffect } from 'react'
import {
  TrashIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Select from '../components/common/Select'
import Badge from '../components/common/Badge'
import { useAppStore } from '../stores/appStore'
import { LogLevel, formatTimestamp } from '../types'

const Logs = () => {
  const { appState, getFilteredLogs, clearLogs, addLog } = useAppStore()
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef(null)
  const logsContainerRef = useRef(null)

  const filteredLogs = getFilteredLogs(selectedLevel)

  const logLevelOptions = [
    { value: 'all', label: 'All Levels' },
    { value: LogLevel.ERROR, label: 'Error' },
    { value: LogLevel.WARN, label: 'Warning' },
    { value: LogLevel.INFO, label: 'Info' },
    { value: LogLevel.DEBUG, label: 'Debug' }
  ]

  const getLogLevelBadge = (level) => {
    switch (level) {
      case LogLevel.ERROR:
        return <Badge variant="error">ERROR</Badge>
      case LogLevel.WARN:
        return <Badge variant="warning">WARN</Badge>
      case LogLevel.INFO:
        return <Badge variant="info">INFO</Badge>
      case LogLevel.DEBUG:
        return <Badge variant="secondary">DEBUG</Badge>
      default:
        return <Badge variant="secondary">{level?.toUpperCase()}</Badge>
    }
  }

  const getLogLevelColor = (level) => {
    switch (level) {
      case LogLevel.ERROR:
        return 'text-error-600'
      case LogLevel.WARN:
        return 'text-warning-600'
      case LogLevel.INFO:
        return 'text-blue-600'
      case LogLevel.DEBUG:
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      clearLogs()
    }
  }

  const handleRefreshLogs = () => {
    // In a real implementation, this would fetch logs from Electron
    addLog({
      level: LogLevel.INFO,
      message: 'Logs refreshed manually'
    })
  }

  const handleExportLogs = () => {
    const logsText = filteredLogs
      .map(log => `[${formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n')
    
    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finsync360-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const scrollToBottom = () => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [filteredLogs, autoScroll])

  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setAutoScroll(isAtBottom)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Application Logs</h1>
        <p className="text-gray-600">View and manage application logs and events</p>
      </div>

      {/* Log Controls */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              options={logLevelOptions}
              className="w-40"
            />
            
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {filteredLogs.length} entries
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              icon={DocumentArrowDownIcon}
              onClick={handleExportLogs}
              size="sm"
              disabled={filteredLogs.length === 0}
            >
              Export
            </Button>
            
            <Button
              variant="outline"
              icon={ArrowPathIcon}
              onClick={handleRefreshLogs}
              size="sm"
            >
              Refresh
            </Button>
            
            <Button
              variant="error"
              icon={TrashIcon}
              onClick={handleClearLogs}
              size="sm"
              disabled={appState.logs.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Display */}
      <Card title="Log Entries" padding="none">
        <div 
          ref={logsContainerRef}
          className="h-96 overflow-y-auto bg-gray-900 text-gray-100 font-mono text-sm"
          onScroll={handleScroll}
        >
          {filteredLogs.length > 0 ? (
            <div className="p-4 space-y-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 py-1 hover:bg-gray-800 px-2 -mx-2 rounded">
                  <span className="text-gray-400 text-xs whitespace-nowrap mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  
                  <span className={`text-xs font-semibold whitespace-nowrap mt-0.5 ${getLogLevelColor(log.level)}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  
                  <span className="text-gray-100 break-words selectable">
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No logs available</p>
                <p className="text-gray-500 text-sm">
                  {selectedLevel === 'all' 
                    ? 'Application logs will appear here'
                    : `No ${selectedLevel} level logs found`
                  }
                </p>
              </div>
            </div>
          )}
        </div>
        
        {filteredLogs.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-600">Auto-scroll</span>
              </label>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {filteredLogs.length} of {appState.logs.length} total logs
            </div>
          </div>
        )}
      </Card>

      {/* Log Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.values(LogLevel).map((level) => {
          const count = appState.logs.filter(log => log.level === level).length
          return (
            <Card key={level} padding="sm">
              <div className="text-center">
                <div className="mb-2">
                  {getLogLevelBadge(level)}
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{level} logs</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Logs
