import React from 'react'
import clsx from 'clsx'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none'
  ]

  const variantClasses = {
    primary: [
      'bg-primary-600 text-white shadow-sm',
      'hover:bg-primary-700 focus:ring-primary-500',
      'active:bg-primary-800'
    ],
    secondary: [
      'bg-gray-600 text-white shadow-sm',
      'hover:bg-gray-700 focus:ring-gray-500',
      'active:bg-gray-800'
    ],
    success: [
      'bg-success-600 text-white shadow-sm',
      'hover:bg-success-700 focus:ring-success-500',
      'active:bg-success-800'
    ],
    warning: [
      'bg-warning-600 text-white shadow-sm',
      'hover:bg-warning-700 focus:ring-warning-500',
      'active:bg-warning-800'
    ],
    error: [
      'bg-error-600 text-white shadow-sm',
      'hover:bg-error-700 focus:ring-error-500',
      'active:bg-error-800'
    ],
    outline: [
      'border border-gray-300 bg-white text-gray-700 shadow-sm',
      'hover:bg-gray-50 focus:ring-primary-500',
      'active:bg-gray-100'
    ],
    ghost: [
      'text-gray-700 bg-transparent',
      'hover:bg-gray-100 focus:ring-primary-500',
      'active:bg-gray-200'
    ]
  }

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  }

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-5 h-5'
  }

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className
  )

  const iconClasses = clsx(
    iconSizeClasses[size],
    children && iconPosition === 'left' && 'mr-2',
    children && iconPosition === 'right' && 'ml-2'
  )

  const LoadingSpinner = () => (
    <svg
      className={clsx(iconSizeClasses[size], children && 'mr-2')}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <LoadingSpinner />}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={iconClasses} />
      )}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={iconClasses} />
      )}
    </button>
  )
}

export default Button
