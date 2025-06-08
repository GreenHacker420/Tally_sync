import React from 'react';
import { useAppStore } from '../../stores/appStore';
import Sidebar from './Sidebar';
import Header from './Header';
import StatusBar from './StatusBar';

const Layout = ({ children }) => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
        
        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
};

export default Layout;
