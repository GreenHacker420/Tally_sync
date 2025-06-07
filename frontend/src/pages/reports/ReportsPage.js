import React from 'react';
import { Helmet } from 'react-helmet-async';

const ReportsPage = () => {
  return (
    <>
      <Helmet>
        <title>Reports - FinSync360</title>
      </Helmet>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">Reports and analytics coming soon...</p>
      </div>
    </>
  );
};

export default ReportsPage;
