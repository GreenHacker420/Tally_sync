'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const { forgotPassword, loading } = useAuth();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await forgotPassword(data.email);
      setEmailSent(true);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-success-100">
              <span className="text-success-600 text-xl">✓</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a password reset link to{' '}
              <span className="font-medium text-gray-900">
                {getValues('email')}
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="text-sm text-blue-700">
                <p className="font-medium">Didn't receive the email?</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the correct email address</li>
                  <li>Wait a few minutes for the email to arrive</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setEmailSent(false)}
              >
                Try a different email
              </Button>
              
              <Link href="/login">
                <Button variant="ghost" fullWidth>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <span className="text-primary-600 text-xl font-bold">FS</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                  message: 'Please enter a valid email address',
                },
              })}
            />
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Send reset link
            </Button>
          </div>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
