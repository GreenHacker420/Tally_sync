import React from 'react';

const LoadingScreen = ({ message = 'Loading FinSync360...' }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FinSync360</h1>
          <p className="text-blue-100 text-lg">Desktop Application</p>
        </div>
        
        {/* Loading Spinner */}
        <div className="mb-6">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        
        {/* Loading Message */}
        <p className="text-white text-lg opacity-90">{message}</p>
        
        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
