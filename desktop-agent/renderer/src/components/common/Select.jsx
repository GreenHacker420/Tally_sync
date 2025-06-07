import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  size = 'md',
  fullWidth = false,
  className,
  labelClassName,
  selectClassName,
  ...props
}, ref) => {
  const selectClasses = clsx(
    'block border border-gray-300 rounded-lg shadow-sm bg-white',
    'focus:ring-primary-500 focus:border-primary-500',
    'text-gray-900 appearance-none cursor-pointer',
    'transition-colors duration-200',
    'pr-10', // Space for dropdown icon
    {
      'px-3 py-2 text-sm': size === 'sm',
      'px-4 py-2.5 text-sm': size === 'md',
      'px-4 py-3 text-base': size === 'lg'
    },
    error && 'border-error-300 focus:ring-error-500 focus:border-error-500',
    fullWidth && 'w-full',
    props.disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
    selectClassName
  )

  const iconClasses = clsx(
    'absolute right-3 text-gray-400 pointer-events-none',
    {
      'w-4 h-4 top-2': size === 'sm',
      'w-5 h-5 top-2.5': size === 'md',
      'w-6 h-6 top-3': size === 'lg'
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
        <select
          ref={ref}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option, index) => {
            if (typeof option === 'string') {
              return (
                <option key={index} value={option}>
                  {option}
                </option>
              )
            }
            
            return (
              <option 
                key={option.value || index} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            )
          })}
        </select>
        
        <ChevronDownIcon className={iconClasses} />
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

Select.displayName = 'Select'

export default Select
