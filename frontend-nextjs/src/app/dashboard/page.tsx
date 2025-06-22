'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  CubeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useDashboardStats, useRecentActivities, useDashboardAlerts } from '@/hooks/useDashboard';
import { useInventorySummary } from '@/hooks/useInventory';
import StatsCard from '@/components/ui/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { RevenueChart, PaymentTrendsChart, InventoryChart, RiskChart } from '@/components/charts';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [statsPeriod, setStatsPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useDashboardStats(statsPeriod);
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentActivities(5);
  const { data: alerts, isLoading: alertsLoading } = useDashboardAlerts();
  const { data: inventorySummary, isLoading: inventoryLoading } = useInventorySummary();

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No Company Selected</h2>
        <p className="mt-2 text-gray-600">Please select a company to view the dashboard.</p>
        <Link href="/companies" className="mt-4 inline-block">
          <Button>Select Company</Button>
        </Link>
      </div>
    );
  }

  // Mock data for demonstration (replace with real data when backend is ready)
  const mockStats = {
    totalRevenue: 2500000,
    totalVouchers: 156,
    inventoryItems: inventorySummary?.totalItems || 89,
    overduePayments: 12,
    revenueChange: 12.5,
    vouchersChange: 8.3,
    inventoryChange: -2.1,
    overdueChange: -15.2,
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(mockStats.totalRevenue),
      change: { value: mockStats.revenueChange, type: "increase" as const, period: "vs last month" },
      icon: <BanknotesIcon className="h-5 w-5" />,
      color: "primary" as const,
    },
    {
      title: "Total Vouchers",
      value: formatNumber(mockStats.totalVouchers),
      change: { value: mockStats.vouchersChange, type: "increase" as const, period: "vs last month" },
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      color: "success" as const,
    },
    {
      title: "Inventory Items",
      value: formatNumber(mockStats.inventoryItems),
      change: { value: Math.abs(mockStats.inventoryChange), type: "decrease" as const, period: "vs last month" },
      icon: <ArchiveBoxIcon className="h-5 w-5" />,
      color: "warning" as const,
      loading: inventoryLoading,
    },
    {
      title: "Overdue Payments",
      value: formatNumber(mockStats.overduePayments),
      change: { value: Math.abs(mockStats.overdueChange), type: "decrease" as const, period: "vs last month" },
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      color: "error" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Managing {currentCompany.displayName || currentCompany.name}
        </p>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'error' ? 'bg-error-50 border-error-400' :
                alert.type === 'warning' ? 'bg-warning-50 border-warning-400' :
                alert.type === 'success' ? 'bg-success-50 border-success-400' :
                'bg-primary-50 border-primary-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{alert.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                </div>
                <Badge variant="outline" size="sm">
                  {formatRelativeTime(alert.timestamp)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
            loading={stat.loading}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart height={400} />
        <PaymentTrendsChart height={400} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InventoryChart height={400} />
        <RiskChart height={400} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/vouchers/new">
              <Button className="w-full justify-start" variant="outline">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Voucher
              </Button>
            </Link>
            <Link href="/inventory/new">
              <Button className="w-full justify-start" variant="outline">
                <CubeIcon className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </Link>
            <Link href="/reports">
              <Button className="w-full justify-start" variant="outline">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </Link>
            <Button className="w-full justify-start" variant="outline">
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Sync with Tally
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity and Low Stock Items */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'voucher_created' ? 'bg-primary-100 text-primary-600' :
                        activity.type === 'payment_received' ? 'bg-success-100 text-success-600' :
                        activity.type === 'item_added' ? 'bg-warning-100 text-warning-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.type === 'voucher_created' ? <DocumentTextIcon className="h-4 w-4" /> :
                         activity.type === 'payment_received' ? <BanknotesIcon className="h-4 w-4" /> :
                         activity.type === 'item_added' ? <CubeIcon className="h-4 w-4" /> :
                         <ArrowPathIcon className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(activity.timestamp)} by {activity.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Low Stock Items</span>
              <Badge variant="warning" size="sm">
                {inventorySummary?.lowStockItems || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mock low stock items - replace with real data */}
                {[
                  { name: "Office Supplies", stock: 5, reorderLevel: 20 },
                  { name: "Printer Paper", stock: 2, reorderLevel: 10 },
                  { name: "Ink Cartridges", stock: 1, reorderLevel: 5 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Stock: {item.stock} (Reorder at: {item.reorderLevel})
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">
                      Low Stock
                    </Badge>
                  </div>
                ))}
                {inventorySummary?.lowStockItems === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">All items are well stocked</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
