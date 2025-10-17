'use client'

import { forwardRef } from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', ...props }, ref) => {
    return (
      <div className="flex items-start space-x-3">
        <div className="flex items-center h-5 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            className={`
              h-5 w-5 text-primary border-gray-300 rounded 
              focus:ring-primary focus:ring-2 focus:ring-offset-0
              disabled:cursor-not-allowed disabled:opacity-50
              transition-colors duration-200
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${className}
            `}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="text-sm leading-relaxed">
            {label && (
              <label htmlFor={props.id} className="font-medium text-gray-700 cursor-pointer block">
                {label}
              </label>
            )}
            {description && (
              <p className="text-gray-500 mt-1 leading-relaxed">{description}</p>
            )}
            {error && (
              <p className="text-red-600 text-xs mt-1">{error}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'