import React from 'react';
import { Helmet } from 'react-helmet-async';

const CompaniesPage = () => {
  return (
    <>
      <Helmet>
        <title>Companies - FinSync360</title>
      </Helmet>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <p className="mt-2 text-gray-600">Companies management coming soon...</p>
      </div>
    </>
  );
};

export default CompaniesPage;
