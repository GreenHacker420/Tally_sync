'use client';

import React from 'react';
import Link from 'next/link';
import { ChartBarIcon, DocumentChartBarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { useCompany } from '@/contexts/CompanyContext';
import Button from '@/components/common/Button';

export default function ReportsPage() {
  const { currentCompany } = useCompany();

  const colorClasses = {
    primary: {
      bg: 'bg-primary-100',
      text: 'text-primary-600'
    },
    success: {
      bg: 'bg-success-100',
      text: 'text-success-600'
    },
    warning: {
      bg: 'bg-warning-100',
      text: 'text-warning-600'
    }
  };

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No company selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please select a company to view reports.
        </p>
        <div className="mt-6">
          <Link href="/companies">
            <Button>Select Company</Button>
          </Link>
        </div>
      </div>
    );
  }

  const reportCategories = [
    {
      title: 'Financial Reports',
      description: 'Profit & Loss, Balance Sheet, Cash Flow statements',
      icon: CurrencyRupeeIcon,
      color: 'primary' as keyof typeof colorClasses,
      reports: [
        { name: 'Profit & Loss Statement', href: '/reports/profit-loss' },
        { name: 'Balance Sheet', href: '/reports/balance-sheet' },
        { name: 'Cash Flow Statement', href: '/reports/cash-flow' },
        { name: 'Trial Balance', href: '/reports/trial-balance' },
      ]
    },
    {
      title: 'GST Reports',
      description: 'GST returns, GSTR-1, GSTR-3B, and compliance reports',
      icon: DocumentChartBarIcon,
      color: 'success' as keyof typeof colorClasses,
      reports: [
        { name: 'GSTR-1', href: '/reports/gstr-1' },
        { name: 'GSTR-3B', href: '/reports/gstr-3b' },
        { name: 'GST Summary', href: '/reports/gst-summary' },
        { name: 'Input Tax Credit', href: '/reports/itc' },
      ]
    },
    {
      title: 'Inventory Reports',
      description: 'Stock summary, movement analysis, and valuation reports',
      icon: ChartBarIcon,
      color: 'warning' as keyof typeof colorClasses,
      reports: [
        { name: 'Stock Summary', href: '/reports/stock-summary' },
        { name: 'Stock Movement', href: '/reports/stock-movement' },
        { name: 'Stock Valuation', href: '/reports/stock-valuation' },
        { name: 'Reorder Level', href: '/reports/reorder-level' },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            Generate comprehensive business reports for {currentCompany.name}.
          </p>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {reportCategories.map((category) => (
          <div key={category.title} className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-10 h-10 ${colorClasses[category.color].bg} rounded-lg flex items-center justify-center`}>
                  <category.icon className={`w-6 h-6 ${colorClasses[category.color].text}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                {category.reports.map((report) => (
                  <Link
                    key={report.name}
                    href={report.href}
                    className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                  >
                    {report.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Reports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Reports
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/reports/sales-summary">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <span className="text-success-600 font-medium">📈</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Sales Summary</p>
                  <p className="text-sm text-gray-500 truncate">Today's sales</p>
                </div>
              </div>
            </Link>

            <Link href="/reports/outstanding">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <span className="text-warning-600 font-medium">💰</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Outstanding</p>
                  <p className="text-sm text-gray-500 truncate">Pending payments</p>
                </div>
              </div>
            </Link>

            <Link href="/reports/top-customers">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 font-medium">👥</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Top Customers</p>
                  <p className="text-sm text-gray-500 truncate">Best customers</p>
                </div>
              </div>
            </Link>

            <Link href="/reports/expense-analysis">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                    <span className="text-error-600 font-medium">📊</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Expense Analysis</p>
                  <p className="text-sm text-gray-500 truncate">Monthly expenses</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Custom Reports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Custom Reports
          </h3>
          <div className="text-center py-8">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Custom report builder coming soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create custom reports with drag-and-drop interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
