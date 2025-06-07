import React from 'react';
import { Helmet } from 'react-helmet-async';

const ProfilePage = () => {
  return (
    <>
      <Helmet>
        <title>Profile - FinSync360</title>
      </Helmet>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Profile page coming soon...</p>
      </div>
    </>
  );
};

export default ProfilePage;
