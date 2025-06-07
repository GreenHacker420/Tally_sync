import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';

// Company Pages
import CompaniesPage from './pages/companies/CompaniesPage';
import CompanyDetailsPage from './pages/companies/CompanyDetailsPage';
import CreateCompanyPage from './pages/companies/CreateCompanyPage';

// Voucher Pages
import VouchersPage from './pages/vouchers/VouchersPage';
import CreateVoucherPage from './pages/vouchers/CreateVoucherPage';
import VoucherDetailsPage from './pages/vouchers/VoucherDetailsPage';

// Inventory Pages
import InventoryPage from './pages/inventory/InventoryPage';
import ItemsPage from './pages/inventory/ItemsPage';
import CreateItemPage from './pages/inventory/CreateItemPage';

// Reports Pages
import ReportsPage from './pages/reports/ReportsPage';

// Settings Pages
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';

// 404 Page
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>FinSync360 - Comprehensive ERP Solution</title>
        <meta name="description" content="Complete business management solution with Tally integration" />
      </Helmet>

      <Routes>
        {/* Public Routes */}
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          /* Protected Routes */
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Company Routes */}
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="companies/new" element={<CreateCompanyPage />} />
            <Route path="companies/:id" element={<CompanyDetailsPage />} />
            
            {/* Voucher Routes */}
            <Route path="vouchers" element={<VouchersPage />} />
            <Route path="vouchers/new" element={<CreateVoucherPage />} />
            <Route path="vouchers/:id" element={<VoucherDetailsPage />} />
            
            {/* Inventory Routes */}
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/items" element={<ItemsPage />} />
            <Route path="inventory/items/new" element={<CreateItemPage />} />
            
            {/* Reports Routes */}
            <Route path="reports" element={<ReportsPage />} />
            
            {/* Settings Routes */}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/profile" element={<ProfilePage />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        )}
      </Routes>
    </>
  );
}

export default App;
