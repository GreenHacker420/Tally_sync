'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

export default function SettingsPage() {
  const { user } = useAuth();
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
    },
    error: {
      bg: 'bg-error-100',
      text: 'text-error-600'
    },
    secondary: {
      bg: 'bg-secondary-100',
      text: 'text-secondary-600'
    }
  };

  const settingsCategories = [
    {
      title: 'Profile Settings',
      description: 'Manage your personal information and preferences',
      icon: UserCircleIcon,
      href: '/settings/profile',
      color: 'primary' as keyof typeof colorClasses,
    },
    {
      title: 'Company Settings',
      description: 'Configure company information and business settings',
      icon: BuildingOfficeIcon,
      href: '/settings/company',
      color: 'success' as keyof typeof colorClasses,
      disabled: !currentCompany,
    },
    {
      title: 'Security',
      description: 'Password, two-factor authentication, and security settings',
      icon: ShieldCheckIcon,
      href: '/settings/security',
      color: 'warning' as keyof typeof colorClasses,
    },
    {
      title: 'Notifications',
      description: 'Email, SMS, and push notification preferences',
      icon: BellIcon,
      href: '/settings/notifications',
      color: 'primary' as keyof typeof colorClasses,
    },
    {
      title: 'Billing & Subscription',
      description: 'Manage your subscription and billing information',
      icon: CreditCardIcon,
      href: '/settings/billing',
      color: 'error' as keyof typeof colorClasses,
    },
    {
      title: 'System Settings',
      description: 'Application preferences and system configuration',
      icon: CogIcon,
      href: '/settings/system',
      color: 'secondary' as keyof typeof colorClasses,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* User Info */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {user?.avatar ? (
                <img
                  className="h-16 w-16 rounded-full object-cover"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                </div>
              )}
            </div>
            <div className="ml-6">
              <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="ml-auto">
              <Link
                href="/settings/profile"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Current Company */}
      {currentCompany && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {currentCompany.logo ? (
                  <img
                    className="h-12 w-12 rounded-lg object-cover"
                    src={currentCompany.logo}
                    alt={currentCompany.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentCompany.displayName || currentCompany.name}
                </h3>
                <p className="text-sm text-gray-500">{currentCompany.industry}</p>
                <p className="text-sm text-gray-500">
                  Plan: <span className="capitalize font-medium">{currentCompany.subscription.plan}</span>
                </p>
              </div>
              <div className="ml-auto">
                <Link
                  href="/settings/company"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Manage Company
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((category) => (
          <Link
            key={category.title}
            href={category.href}
            className={`relative rounded-lg border p-6 shadow-sm transition-all duration-200 ${
              category.disabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md cursor-pointer'
            }`}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 ${colorClasses[category.color].bg} rounded-lg flex items-center justify-center`}>
                <category.icon className={`w-6 h-6 ${colorClasses[category.color].text}`} />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">{category.title}</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">{category.description}</p>
            {category.disabled && (
              <p className="mt-2 text-xs text-gray-400">
                Select a company to access this setting
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/settings/profile"
              className="text-center p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200"
            >
              <UserCircleIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">Update Profile</p>
            </Link>

            <Link
              href="/settings/security"
              className="text-center p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200"
            >
              <ShieldCheckIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">Change Password</p>
            </Link>

            <Link
              href="/settings/notifications"
              className="text-center p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200"
            >
              <BellIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">Notifications</p>
            </Link>

            <Link
              href="/settings/billing"
              className="text-center p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200"
            >
              <CreditCardIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">Billing</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
