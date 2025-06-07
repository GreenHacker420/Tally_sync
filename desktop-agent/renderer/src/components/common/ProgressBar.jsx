import React from 'react'
import clsx from 'clsx'

const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  label,
  className,
  animated = false,
  striped = false,
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const containerClasses = clsx(
    'bg-gray-200 rounded-full overflow-hidden',
    {
      'h-1': size === 'xs',
      'h-2': size === 'sm',
      'h-3': size === 'md',
      'h-4': size === 'lg',
      'h-6': size === 'xl'
    },
    className
  )

  const barClasses = clsx(
    'h-full transition-all duration-300 ease-out rounded-full',
    {
      'bg-primary-600': variant === 'primary',
      'bg-success-600': variant === 'success',
      'bg-warning-600': variant === 'warning',
      'bg-error-600': variant === 'error',
      'bg-gray-600': variant === 'gray'
    },
    striped && 'bg-gradient-to-r from-transparent via-white to-transparent bg-size-200',
    animated && striped && 'animate-pulse'
  )

  const labelClasses = clsx(
    'text-center font-medium',
    {
      'text-xs': size === 'xs' || size === 'sm',
      'text-sm': size === 'md',
      'text-base': size === 'lg' || size === 'xl'
    }
  )

  return (
    <div {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className={labelClasses}>
            {label || `${Math.round(percentage)}%`}
          </span>
          {showLabel && label && (
            <span className={clsx(labelClasses, 'text-gray-500')}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={containerClasses}>
        <div 
          className={barClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

export default ProgressBar
