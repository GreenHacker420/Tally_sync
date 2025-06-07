import React, { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  size = 'md',
  fullWidth = false,
  className,
  labelClassName,
  inputClassName,
  type = 'text',
  ...props
}, ref) => {
  const inputClasses = clsx(
    'block border border-gray-300 rounded-lg shadow-sm',
    'focus:ring-primary-500 focus:border-primary-500',
    'placeholder-gray-400 text-gray-900',
    'transition-colors duration-200',
    {
      'px-3 py-2 text-sm': size === 'sm',
      'px-4 py-2.5 text-sm': size === 'md',
      'px-4 py-3 text-base': size === 'lg'
    },
    {
      'pl-10': LeftIcon && size === 'sm',
      'pl-11': LeftIcon && size === 'md',
      'pl-12': LeftIcon && size === 'lg',
      'pr-10': RightIcon && size === 'sm',
      'pr-11': RightIcon && size === 'md',
      'pr-12': RightIcon && size === 'lg'
    },
    error && 'border-error-300 focus:ring-error-500 focus:border-error-500',
    fullWidth && 'w-full',
    props.disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
    inputClassName
  )

  const iconClasses = clsx(
    'absolute text-gray-400 pointer-events-none',
    {
      'w-4 h-4': size === 'sm',
      'w-5 h-5': size === 'md',
      'w-6 h-6': size === 'lg'
    }
  )

  const leftIconClasses = clsx(
    iconClasses,
    {
      'left-3 top-2': size === 'sm',
      'left-3 top-2.5': size === 'md',
      'left-3 top-3': size === 'lg'
    }
  )

  const rightIconClasses = clsx(
    iconClasses,
    {
      'right-3 top-2': size === 'sm',
      'right-3 top-2.5': size === 'md',
      'right-3 top-3': size === 'lg'
    }
  )

  return (
    <div className={clsx(fullWidth && 'w-full', className)}>
      {label && (
        <label 
          className={clsx(
            'block text-sm font-medium text-gray-700 mb-2',
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <LeftIcon className={leftIconClasses} />
        )}
        
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
        
        {RightIcon && (
          <RightIcon className={rightIconClasses} />
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-error-600">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
