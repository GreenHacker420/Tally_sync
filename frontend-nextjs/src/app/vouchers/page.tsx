'use client';

import React from 'react';
import Link from 'next/link';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useCompany } from '@/contexts/CompanyContext';
import Button from '@/components/common/Button';

export default function VouchersPage() {
  const { currentCompany } = useCompany();

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No company selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please select a company to view vouchers.
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
          <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage sales, purchase, payment, and receipt vouchers for {currentCompany.name}.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/vouchers/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Voucher
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
                <div className="w-8 h-8 bg-success-100 rounded-md flex items-center justify-center">
                  <span className="text-success-600 text-sm font-medium">S</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sales</dt>
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
                  <span className="text-warning-600 text-sm font-medium">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Purchase</dt>
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
                <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-medium">R</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Receipts</dt>
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
                  <span className="text-error-600 text-sm font-medium">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Payments</dt>
                  <dd className="text-lg font-medium text-gray-900">Coming soon</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Types */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Create New Voucher
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/vouchers/new?type=sales">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <span className="text-success-600 font-medium">S</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Sales Invoice</p>
                  <p className="text-sm text-gray-500 truncate">Create sales voucher</p>
                </div>
              </div>
            </Link>

            <Link href="/vouchers/new?type=purchase">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <span className="text-warning-600 font-medium">P</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Purchase Invoice</p>
                  <p className="text-sm text-gray-500 truncate">Create purchase voucher</p>
                </div>
              </div>
            </Link>

            <Link href="/vouchers/new?type=receipt">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 font-medium">R</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Receipt</p>
                  <p className="text-sm text-gray-500 truncate">Record money received</p>
                </div>
              </div>
            </Link>

            <Link href="/vouchers/new?type=payment">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                    <span className="text-error-600 font-medium">P</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Payment</p>
                  <p className="text-sm text-gray-500 truncate">Record money paid</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Vouchers */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Vouchers
          </h3>
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vouchers yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first voucher.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
