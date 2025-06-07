import React from 'react';
import { Helmet } from 'react-helmet-async';

const InventoryPage = () => {
  return (
    <>
      <Helmet>
        <title>Inventory - FinSync360</title>
      </Helmet>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="mt-2 text-gray-600">Inventory management coming soon...</p>
      </div>
    </>
  );
};

export default InventoryPage;
