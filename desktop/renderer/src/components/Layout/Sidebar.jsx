import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';

const Sidebar = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { hasPermission } = useAuthStore();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      permission: null // Always visible
    },
    {
      name: 'Companies',
      href: '/companies',
      icon: Building2,
      permission: 'companies.read'
    },
    {
      name: 'Vouchers',
      href: '/vouchers',
      icon: FileText,
      permission: 'vouchers.read'
    },
    {
      name: 'Parties',
      href: '/parties',
      icon: Users,
      permission: 'parties.read'
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      permission: 'inventory.read'
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      permission: 'reports.read'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      permission: null // Always visible
    }
  ];

  const filteredItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
      sidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FS</span>
            </div>
            <span className="font-semibold text-gray-900">FinSync360</span>
          </div>
        )}
        
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapsed tooltip */}
      {sidebarCollapsed && (
        <div className="absolute left-full top-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Tooltips would be implemented here */}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
