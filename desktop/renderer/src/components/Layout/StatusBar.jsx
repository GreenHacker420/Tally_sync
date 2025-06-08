import React from 'react';
import { CheckCircle, AlertCircle, Clock, Database } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

const StatusBar = () => {
  const { isOnline, syncStatus, loading } = useAppStore();

  const getSyncStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return 'Syncing...';
      case 'completed':
        return syncStatus.lastSync 
          ? `Last sync: ${new Date(syncStatus.lastSync).toLocaleTimeString()}`
          : 'Sync completed';
      case 'error':
        return `Sync error: ${syncStatus.error}`;
      default:
        return 'Ready';
    }
  };

  return (
    <div className="bg-gray-100 border-t border-gray-200 px-6 py-2">
      <div className="flex items-center justify-between text-sm">
        {/* Left side - Sync status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getSyncStatusIcon()}
            <span className="text-gray-700">{getSyncStatusText()}</span>
          </div>
          
          {/* Loading indicators */}
          {loading.global && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700">Loading...</span>
            </div>
          )}
        </div>

        {/* Right side - Connection status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-700">
              {isOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
          
          <span className="text-gray-500">
            FinSync360 Desktop v1.0.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
