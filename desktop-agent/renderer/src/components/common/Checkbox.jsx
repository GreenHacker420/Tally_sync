import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { CheckIcon } from '@heroicons/react/24/solid'

const Checkbox = forwardRef(({
  label,
  description,
  error,
  size = 'md',
  className,
  labelClassName,
  checked,
  onChange,
  ...props
}, ref) => {
  const checkboxClasses = clsx(
    'relative border border-gray-300 rounded cursor-pointer',
    'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'transition-all duration-200',
    {
      'w-4 h-4': size === 'sm',
      'w-5 h-5': size === 'md',
      'w-6 h-6': size === 'lg'
    },
    checked 
      ? 'bg-primary-600 border-primary-600' 
      : 'bg-white hover:bg-gray-50',
    error && 'border-error-300 focus:ring-error-500',
    props.disabled && 'opacity-50 cursor-not-allowed'
  )

  const iconClasses = clsx(
    'absolute inset-0 text-white pointer-events-none',
    {
      'w-3 h-3': size === 'sm',
      'w-4 h-4': size === 'md',
      'w-5 h-5': size === 'lg'
    }
  )

  return (
    <div className={clsx('flex items-start', className)}>
      <div className="flex items-center h-5">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={onChange}
            {...props}
          />
          
          <div 
            className={checkboxClasses}
            onClick={() => !props.disabled && onChange?.({ target: { checked: !checked } })}
          >
            {checked && (
              <CheckIcon className={iconClasses} />
            )}
          </div>
        </div>
      </div>
      
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label 
              className={clsx(
                'font-medium text-gray-700 cursor-pointer',
                props.disabled && 'opacity-50 cursor-not-allowed',
                labelClassName
              )}
              onClick={() => !props.disabled && onChange?.({ target: { checked: !checked } })}
            >
              {label}
            </label>
          )}
          
          {description && (
            <p className={clsx(
              'text-gray-500',
              props.disabled && 'opacity-50'
            )}>
              {description}
            </p>
          )}
          
          {error && (
            <p className="mt-1 text-error-600">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox
