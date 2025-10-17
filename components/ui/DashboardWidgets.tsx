'use client'

import { useState, useEffect } from 'react'

interface TimeDisplayProps {
  showSeconds?: boolean
  format24h?: boolean
  showDate?: boolean
  timezone?: string
}

export default function TimeDisplay({ 
  showSeconds = true, 
  format24h = true, 
  showDate = true,
  timezone = 'America/Santiago'
}: TimeDisplayProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: !format24h,
      timeZone: timezone
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    })
  }

  return (
    <div className="text-right">
      <div className="text-2xl font-bold text-gray-900 font-mono tracking-wider">
        {formatTime(time)}
      </div>
      {showDate && (
        <div className="text-sm text-gray-600 capitalize">
          {formatDate(time)}
        </div>
      )}
    </div>
  )
}

interface WeatherWidgetProps {
  location?: string
}

export function WeatherWidget({ location = 'Santiago, Chile' }: WeatherWidgetProps) {
  // Este es un ejemplo estático, en una implementación real conectarías con una API de clima
  const weatherData = {
    temperature: 22,
    condition: 'Soleado',
    humidity: 65,
    icon: '☀️'
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-blue-900">{location}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-2xl">{weatherData.icon}</span>
            <div>
              <p className="text-lg font-bold text-blue-900">{weatherData.temperature}°C</p>
              <p className="text-xs text-blue-700">{weatherData.condition}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-600">Humedad</p>
          <p className="text-sm font-medium text-blue-900">{weatherData.humidity}%</p>
        </div>
      </div>
    </div>
  )
}

interface SystemStatusProps {
  services: Array<{
    name: string
    status: 'online' | 'offline' | 'warning'
    lastCheck?: string
  }>
}

const statusColors = {
  online: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
  offline: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' }
}

export function SystemStatus({ services }: SystemStatusProps) {
  return (
    <div className="space-y-2">
      {services.map((service, index) => {
        const colors = statusColors[service.status]
        return (
          <div key={index} className={`${colors.bg} rounded-lg p-3 border border-opacity-20`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 ${colors.dot} rounded-full animate-pulse`}></div>
                <span className={`text-sm font-medium ${colors.text}`}>
                  {service.name}
                </span>
              </div>
              <span className={`text-xs ${colors.text} capitalize`}>
                {service.status}
              </span>
            </div>
            {service.lastCheck && (
              <p className={`text-xs ${colors.text} opacity-75 mt-1`}>
                Última verificación: {service.lastCheck}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  color?: 'primary' | 'secondary' | 'success' | 'warning'
}

const actionColors = {
  primary: 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-200',
  secondary: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-200',
  success: 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200',
  warning: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200'
}

export function QuickAction({ title, description, icon, onClick, color = 'primary' }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${actionColors[color]}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 text-gray-600">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </button>
  )
}