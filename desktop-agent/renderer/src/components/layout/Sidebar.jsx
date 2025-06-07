import React from 'react'
import clsx from 'clsx'
import {
  ChartBarIcon,
  ArrowPathIcon,
  ServerIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: ChartBarIcon,
    description: 'Overview and quick actions'
  },
  {
    id: 'sync',
    label: 'Sync Status',
    icon: ArrowPathIcon,
    description: 'Synchronization management'
  },
  {
    id: 'tally',
    label: 'Tally Connection',
    icon: ServerIcon,
    description: 'Tally ERP configuration'
  },
  {
    id: 'system',
    label: 'System Monitor',
    icon: ComputerDesktopIcon,
    description: 'Performance monitoring'
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: DocumentTextIcon,
    description: 'Application logs'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: CogIcon,
    description: 'Application settings'
  }
]

const Sidebar = ({ currentPage, onPageChange }) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={clsx(
                'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={item.description}
            >
              <Icon 
                className={clsx(
                  'w-5 h-5 mr-3 flex-shrink-0',
                  isActive ? 'text-primary-600' : 'text-gray-400'
                )} 
              />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>FinSync360 Agent</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
