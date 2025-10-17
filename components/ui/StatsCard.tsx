'use client'

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  trend?: {
    value: number
    isPositive: boolean
  }
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  red: 'bg-red-50 text-red-600 border-red-200'
}

const iconBgColors = {
  blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
  green: 'bg-gradient-to-r from-green-500 to-green-600',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
  yellow: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
  red: 'bg-gradient-to-r from-red-500 to-red-600'
}

export default function StatsCard({ title, value, description, icon, color, trend }: StatsCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border ${colorClasses[color]} bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className={`flex-shrink-0 w-12 h-12 ${iconBgColors[color]} rounded-lg flex items-center justify-center shadow-sm`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
      
      {/* Decorative background pattern */}
      <div className="absolute -right-4 -top-4 opacity-10">
        <div className={`w-24 h-24 ${iconBgColors[color]} rounded-full`}></div>
      </div>
    </div>
  )
}