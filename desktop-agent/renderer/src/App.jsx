import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layout Components
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'

// Page Components
import Dashboard from './pages/Dashboard'
import SyncStatus from './pages/SyncStatus'
import TallyConnection from './pages/TallyConnection'
import SystemMonitor from './pages/SystemMonitor'
import Logs from './pages/Logs'
import Settings from './pages/Settings'

// Hooks and Stores
import { useElectronAPI } from './hooks/useElectronAPI'
import { useAppStore } from './stores/appStore'

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const { isConnected, connectionStatus } = useAppStore()
  const { initializeAPI } = useElectronAPI()

  useEffect(() => {
    // Initialize Electron API connection
    initializeAPI()
  }, [initializeAPI])

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'sync':
        return <SyncStatus />
      case 'tally':
        return <TallyConnection />
      case 'system':
        return <SystemMonitor />
      case 'logs':
        return <Logs />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        {/* Header */}
        <Header 
          connectionStatus={connectionStatus}
          onMinimize={() => window.electronAPI?.minimizeToTray()}
          onSettings={() => setCurrentPage('settings')}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              {renderCurrentPage()}
            </div>
          </main>
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </ErrorBoundary>
  )
}

export default App
