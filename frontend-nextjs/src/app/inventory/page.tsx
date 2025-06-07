'use client';

import React from 'react';
import Link from 'next/link';
import { PlusIcon, CubeIcon } from '@heroicons/react/24/outline';
import { useCompany } from '@/contexts/CompanyContext';
import Button from '@/components/common/Button';

export default function InventoryPage() {
  const { currentCompany } = useCompany();

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No company selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please select a company to view inventory.
        </p>
        <div className="mt-6">
          <Link href="/companies">
            <Button>Select Company</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your inventory items, stock levels, and pricing for {currentCompany.name}.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/inventory/items/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                  <CubeIcon className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                  <dd className="text-lg font-medium text-gray-900">Coming soon</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-md flex items-center justify-center">
                  <span className="text-success-600 text-sm font-medium">₹</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Stock Value</dt>
                  <dd className="text-lg font-medium text-gray-900">Coming soon</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-md flex items-center justify-center">
                  <span className="text-warning-600 text-sm font-medium">⚠</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">Coming soon</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-error-100 rounded-md flex items-center justify-center">
                  <span className="text-error-600 text-sm font-medium">0</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">Coming soon</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/inventory/items/new">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <PlusIcon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Add New Item</p>
                  <p className="text-sm text-gray-500 truncate">Create inventory item</p>
                </div>
              </div>
            </Link>

            <Link href="/inventory/stock-adjustment">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <span className="text-warning-600 font-medium">±</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Stock Adjustment</p>
                  <p className="text-sm text-gray-500 truncate">Adjust stock levels</p>
                </div>
              </div>
            </Link>

            <Link href="/inventory/reports">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <span className="text-success-600 font-medium">📊</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Inventory Reports</p>
                  <p className="text-sm text-gray-500 truncate">View stock reports</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Inventory Items
          </h3>
          <div className="text-center py-8">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first inventory item.
            </p>
            <div className="mt-6">
              <Link href="/inventory/items/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
