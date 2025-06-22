'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CubeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PlusIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useDashboardAlerts } from '@/hooks/useDashboard';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/common/Button';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Overview and analytics'
  },
  {
    name: 'Companies',
    href: '/companies',
    icon: BuildingOfficeIcon,
    description: 'Manage companies'
  },
  {
    name: 'Vouchers',
    href: '/vouchers',
    icon: DocumentTextIcon,
    description: 'Sales, purchase & payments',
    children: [
      { name: 'All Vouchers', href: '/vouchers', icon: ClipboardDocumentListIcon },
      { name: 'Create New', href: '/vouchers/new', icon: PlusIcon },
      { name: 'Sales', href: '/vouchers?type=sales', icon: BanknotesIcon },
      { name: 'Purchase', href: '/vouchers?type=purchase', icon: DocumentTextIcon },
    ]
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: CubeIcon,
    description: 'Products and stock',
    children: [
      { name: 'All Items', href: '/inventory', icon: ArchiveBoxIcon },
      { name: 'Add Item', href: '/inventory/new', icon: PlusIcon },
      { name: 'Low Stock', href: '/inventory?lowStock=true', icon: ExclamationTriangleIcon },
    ]
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ChartBarIcon,
    description: 'Analytics and insights'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'App configuration'
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { currentCompany } = useCompany();
  const { data: alerts } = useDashboardAlerts();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleLogout = async () => {
    await logout();
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const unreadAlertsCount = alerts?.filter(alert => !alert.read).length || 0;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Search */}
              <div className="w-full max-w-lg lg:max-w-xs">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search vouchers, items..."
                    type="search"
                  />
                </div>
              </div>

              {/* Company Info */}
              {currentCompany && (
                <div className="ml-6 flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-sm font-medium text-gray-900">
                        {currentCompany.displayName || currentCompany.name}
                      </span>
                      <div className="text-xs text-gray-500">
                        {currentCompany.gstNumber || 'No GST'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications */}
              <button className="relative p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <BellIcon className="h-6 w-6" />
                {unreadAlertsCount > 0 && (
                  <Badge
                    variant="error"
                    size="sm"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                  >
                    {unreadAlertsCount}
                  </Badge>
                )}
              </button>

              {/* User menu */}
              <div className="relative flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email}
                  </div>
                </div>
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  function SidebarContent() {
    return (
      <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold text-gray-900">TallySync</span>
              <div className="text-xs text-gray-500">Business Management</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const isExpanded = expandedItems.includes(item.name);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.name}>
                  {hasChildren ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className={`group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon
                            className={`mr-3 flex-shrink-0 h-5 w-5 ${
                              isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                            }`}
                          />
                          <div className="text-left">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </div>
                        <ChevronDownIcon
                          className={`h-4 w-4 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="mt-1 ml-6 space-y-1">
                          {item.children.map((child) => {
                            const childIsActive = pathname === child.href;
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={`group flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                  childIsActive
                                    ? 'bg-primary-100 text-primary-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                              >
                                <child.icon
                                  className={`mr-2 flex-shrink-0 h-4 w-4 ${
                                    childIsActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                                  }`}
                                />
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="px-2 mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Actions
            </div>
            <div className="space-y-2">
              <Link
                href="/vouchers/new"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
              >
                <PlusIcon className="mr-2 h-4 w-4 text-gray-400" />
                New Voucher
              </Link>
              <Link
                href="/inventory/new"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
              >
                <PlusIcon className="mr-2 h-4 w-4 text-gray-400" />
                Add Item
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
