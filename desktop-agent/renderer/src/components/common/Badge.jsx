import React from 'react'
import clsx from 'clsx'

const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = true,
  className,
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center font-medium',
    rounded ? 'rounded-full' : 'rounded',
    'select-none'
  ]

  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    info: 'bg-blue-100 text-blue-800'
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-3 py-1 text-sm',
    xl: 'px-4 py-1.5 text-base'
  }

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  )

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

export default Badge
