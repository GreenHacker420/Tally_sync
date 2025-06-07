import React from 'react';
import { Helmet } from 'react-helmet-async';

const ItemsPage = () => {
  return (
    <>
      <Helmet>
        <title>Items - FinSync360</title>
      </Helmet>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Items</h1>
        <p className="mt-2 text-gray-600">Items management coming soon...</p>
      </div>
    </>
  );
};

export default ItemsPage;
