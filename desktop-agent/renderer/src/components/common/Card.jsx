import React from 'react'
import clsx from 'clsx'

const Card = ({
  children,
  title,
  subtitle,
  actions,
  padding = 'default',
  shadow = 'default',
  border = true,
  className,
  headerClassName,
  bodyClassName,
  ...props
}) => {
  const cardClasses = clsx(
    'bg-white rounded-lg overflow-hidden',
    border && 'border border-gray-200',
    {
      'shadow-sm': shadow === 'sm',
      'shadow-md': shadow === 'default',
      'shadow-lg': shadow === 'lg',
      'shadow-xl': shadow === 'xl',
      'shadow-none': shadow === 'none'
    },
    className
  )

  const headerClasses = clsx(
    'px-6 py-4 border-b border-gray-200 bg-gray-50',
    headerClassName
  )

  const bodyClasses = clsx(
    {
      'p-6': padding === 'default',
      'p-4': padding === 'sm',
      'p-8': padding === 'lg',
      'p-0': padding === 'none'
    },
    bodyClassName
  )

  const hasHeader = title || subtitle || actions

  return (
    <div className={cardClasses} {...props}>
      {hasHeader && (
        <div className={headerClasses}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2 ml-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={bodyClasses}>
        {children}
      </div>
    </div>
  )
}

// Card.Header component for more flexible layouts
Card.Header = ({ children, className, ...props }) => (
  <div 
    className={clsx(
      'px-6 py-4 border-b border-gray-200 bg-gray-50',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

// Card.Body component for more flexible layouts
Card.Body = ({ children, className, padding = 'default', ...props }) => (
  <div 
    className={clsx(
      {
        'p-6': padding === 'default',
        'p-4': padding === 'sm',
        'p-8': padding === 'lg',
        'p-0': padding === 'none'
      },
      className
    )}
    {...props}
  >
    {children}
  </div>
)

// Card.Footer component for more flexible layouts
Card.Footer = ({ children, className, ...props }) => (
  <div 
    className={clsx(
      'px-6 py-4 border-t border-gray-200 bg-gray-50',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export default Card
