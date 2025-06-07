import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found - FinSync360</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Page not found
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sorry, we couldn't find the page you're looking for.
            </p>
          </div>
          <div>
            <Link
              to="/dashboard"
              className="btn-primary"
            >
              Go back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
