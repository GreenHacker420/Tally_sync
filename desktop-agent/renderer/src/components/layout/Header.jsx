import React from 'react'
import { 
  CogIcon, 
  MinusIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { ConnectionStatus } from '../../types'

const Header = ({ 
  connectionStatus = {}, 
  onMinimize, 
  onSettings 
}) => {
  const getConnectionIcon = (status) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return <CheckCircleIcon className="w-4 h-4 text-success-500" />
      case ConnectionStatus.CONNECTING:
        return <WifiIcon className="w-4 h-4 text-warning-500 animate-pulse" />
      case ConnectionStatus.ERROR:
        return <ExclamationTriangleIcon className="w-4 h-4 text-error-500" />
      default:
        return <WifiIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const getConnectionText = (serverStatus, tallyStatus) => {
    if (serverStatus === ConnectionStatus.CONNECTED && tallyStatus === ConnectionStatus.CONNECTED) {
      return 'Connected'
    } else if (serverStatus === ConnectionStatus.CONNECTING || tallyStatus === ConnectionStatus.CONNECTING) {
      return 'Connecting...'
    } else if (serverStatus === ConnectionStatus.ERROR || tallyStatus === ConnectionStatus.ERROR) {
      return 'Connection Error'
    } else {
      return 'Disconnected'
    }
  }

  const getConnectionVariant = (serverStatus, tallyStatus) => {
    if (serverStatus === ConnectionStatus.CONNECTED && tallyStatus === ConnectionStatus.CONNECTED) {
      return 'success'
    } else if (serverStatus === ConnectionStatus.CONNECTING || tallyStatus === ConnectionStatus.CONNECTING) {
      return 'warning'
    } else if (serverStatus === ConnectionStatus.ERROR || tallyStatus === ConnectionStatus.ERROR) {
      return 'error'
    } else {
      return 'secondary'
    }
  }

  const { server = ConnectionStatus.DISCONNECTED, tally = ConnectionStatus.DISCONNECTED } = connectionStatus

  return (
    <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* Logo placeholder */}
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">F</span>
              </div>
              
              <div>
                <h1 className="text-lg font-semibold">FinSync360 Desktop Agent</h1>
                <p className="text-xs text-primary-100">Tally ERP Integration</p>
              </div>
            </div>
          </div>

          {/* Right side - Status and controls */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getConnectionIcon(server)}
                <span className="text-sm">Server</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {getConnectionIcon(tally)}
                <span className="text-sm">Tally</span>
              </div>
              
              <Badge 
                variant={getConnectionVariant(server, tally)}
                size="sm"
                className="bg-white bg-opacity-20 text-white border border-white border-opacity-30"
              >
                {getConnectionText(server, tally)}
              </Badge>
            </div>

            {/* Control buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                icon={CogIcon}
                onClick={onSettings}
                className="text-white hover:bg-white hover:bg-opacity-10 focus:ring-white focus:ring-opacity-50"
                title="Settings"
              />
              
              <Button
                variant="ghost"
                size="sm"
                icon={MinusIcon}
                onClick={onMinimize}
                className="text-white hover:bg-white hover:bg-opacity-10 focus:ring-white focus:ring-opacity-50"
                title="Minimize to Tray"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
