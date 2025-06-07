'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useCompany } from '@/contexts/CompanyContext';
import { Company } from '@/types';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function CompaniesPage() {
  const { companies, currentCompany, loading, fetchCompanies, setCurrentCompany } = useCompany();
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSelectCompany = (company: Company) => {
    setCurrentCompany(company);
    setSelectedCompany(company._id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your companies and switch between them.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/companies/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </Link>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No companies</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first company.
          </p>
          <div className="mt-6">
            <Link href="/companies/new">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <div
              key={company._id}
              className={`relative rounded-lg border p-6 shadow-sm cursor-pointer transition-all duration-200 ${
                currentCompany?._id === company._id
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              onClick={() => handleSelectCompany(company)}
            >
              {currentCompany?._id === company._id && (
                <div className="absolute -top-2 -right-2">
                  <div className="inline-flex items-center rounded-full bg-primary-600 px-2 py-1 text-xs font-medium text-white">
                    Active
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {company.logo ? (
                    <img
                      className="h-10 w-10 rounded-lg object-cover"
                      src={company.logo}
                      alt={company.name}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {company.displayName || company.name}
                  </h3>
                  <p className="text-sm text-gray-500">{company.industry}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Business Type</span>
                  <span className="capitalize">{company.businessType.replace('_', ' ')}</span>
                </div>
                {company.gstin && (
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                    <span>GSTIN</span>
                    <span className="font-mono">{company.gstin}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                  <span>Status</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    company.isActive
                      ? 'bg-success-100 text-success-800'
                      : 'bg-error-100 text-error-800'
                  }`}>
                    {company.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between">
                <Link
                  href={`/companies/${company._id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Link>
                {company.tallyIntegration.enabled && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Tally Sync
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentCompany && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Current Company: {currentCompany.displayName || currentCompany.name}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentCompany.address.line1}
                {currentCompany.address.line2 && `, ${currentCompany.address.line2}`}
                <br />
                {currentCompany.address.city}, {currentCompany.address.state} {currentCompany.address.pincode}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contact</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentCompany.contact.email}
                <br />
                {currentCompany.contact.phone}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Financial Year</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(currentCompany.financialYear.startDate).toLocaleDateString()} - {' '}
                {new Date(currentCompany.financialYear.endDate).toLocaleDateString()}
              </dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
