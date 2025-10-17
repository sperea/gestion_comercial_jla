'use client'

interface MetricCardProps {
  title: string
  metric: string | React.ReactNode
  change: {
    value: number
    label: string
    isPositive: boolean
  }
  icon: React.ReactNode
  color: 'primary' | 'success' | 'warning' | 'info'
}

const colorVariants = {
  primary: {
    bg: 'bg-gradient-to-r from-primary to-red-600',
    text: 'text-primary',
    lightBg: 'bg-red-50'
  },
  success: {
    bg: 'bg-gradient-to-r from-green-500 to-green-600',
    text: 'text-green-600',
    lightBg: 'bg-green-50'
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    text: 'text-yellow-600',
    lightBg: 'bg-yellow-50'
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50'
  }
}

export default function MetricCard({ title, metric, change, icon, color }: MetricCardProps) {
  const colors = colorVariants[color]
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center shadow-sm`}>
          <div className="text-white text-sm">
            {icon}
          </div>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-3xl font-bold text-gray-900">{metric}</div>
      </div>
      
      <div className="flex items-center">
        <div className={`flex items-center ${change.isPositive ? 'text-green-600' : 'text-red-600'} text-sm font-medium`}>
          {change.isPositive ? (
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 8v9h-9" />
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17l-9.2-9.2M8 8v9h9" />
            </svg>
          )}
          {change.isPositive ? '+' : ''}{change.value}%
        </div>
        <span className="text-gray-500 text-sm ml-2">{change.label}</span>
      </div>
    </div>
  )
}