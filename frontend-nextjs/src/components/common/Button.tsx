import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 border border-transparent shadow-sm',
      secondary: 'text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500 border border-gray-300 shadow-sm',
      outline: 'text-primary-600 bg-transparent hover:bg-primary-50 focus:ring-primary-500 border border-primary-600',
      danger: 'text-white bg-error-600 hover:bg-error-700 focus:ring-error-500 border border-transparent shadow-sm',
      ghost: 'text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-primary-500 border border-transparent'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          widthClasses,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <LoadingSpinner
            size="sm"
            color={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'}
            className="mr-2"
          />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
