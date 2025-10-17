'use client'

import Image from 'next/image'

interface NotificationCardProps {
  title: string
  message: string
  time: string
  type: 'info' | 'success' | 'warning' | 'error'
  icon?: React.ReactNode
}

const typeStyles = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-900',
    message: 'text-blue-700'
  },
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    title: 'text-green-900',
    message: 'text-green-700'
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-500',
    title: 'text-yellow-900',
    message: 'text-yellow-700'
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    title: 'text-red-900',
    message: 'text-red-700'
  }
}

const defaultIcons = {
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function NotificationCard({ title, message, time, type, icon }: NotificationCardProps) {
  const styles = typeStyles[type]
  const displayIcon = icon || defaultIcons[type]

  return (
    <div className={`p-4 rounded-lg border ${styles.bg} hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {displayIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${styles.title}`}>{title}</h4>
          <p className={`text-sm ${styles.message} mt-1`}>{message}</p>
          <p className="text-xs text-gray-500 mt-2">{time}</p>
        </div>
      </div>
    </div>
  )
}

interface ActivityItemProps {
  user: string
  action: string
  target: string
  time: string
  avatar?: string
}

export function ActivityItem({ user, action, target, time, avatar }: ActivityItemProps) {
  const initials = user.split(' ').map(n => n[0]).join('').toUpperCase()
  
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex-shrink-0">
        {avatar ? (
          <Image className="w-8 h-8 rounded-full" src={avatar} alt={user} width={32} height={32} />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">{initials}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{user}</span> {action} <span className="font-medium">{target}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  )
}