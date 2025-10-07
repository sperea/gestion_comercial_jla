'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'loading'
  message: string
  duration?: number
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearLoadingToasts: () => void
  toasts: Toast[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    // Si es un toast de success o error, eliminar todos los toasts de loading primero
    if (toast.type === 'success' || toast.type === 'error') {
      setToasts(prev => prev.filter(t => t.type !== 'loading'))
    }
    
    setToasts(prev => [...prev, newToast])
    
    if (toast.type !== 'loading') {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 4000) // Reducido a 4 segundos para mejor UX
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearLoadingToasts = () => {
    setToasts(prev => prev.filter(toast => toast.type !== 'loading'))
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearLoadingToasts, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastComponentProps {
  toast: Toast
  onRemove: (id: string) => void
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onRemove }) => {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-white border-l-4 border-green-500 shadow-xl'
      case 'error':
        return 'bg-white border-l-4 border-red-500 shadow-xl'
      case 'loading':
        return 'bg-white border-l-4 border-blue-500 shadow-xl'
      default:
        return 'bg-white border-l-4 border-gray-300 shadow-xl'
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'loading':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )
    }
  }

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'loading':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  return (
    <div className={`
      w-full rounded-lg p-4 transform transition-all duration-500 ease-in-out
      animate-slide-in-right
      ${getToastStyles()}
    `}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className={`text-base font-semibold leading-6 ${getTextColor()}`}>
            {toast.message}
          </p>
        </div>
        {toast.type !== 'loading' && (
          <div className="flex-shrink-0">
            <button
              onClick={() => onRemove(toast.id)}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}