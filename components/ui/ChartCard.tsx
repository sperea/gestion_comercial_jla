'use client'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export default function ChartCard({ title, subtitle, children, actions }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}

interface SimpleBarChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  maxValue?: number
}

export function SimpleBarChart({ data, maxValue }: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value))
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm text-gray-600 font-medium">
            {item.label}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                item.color || 'bg-gradient-to-r from-primary to-red-600'
              }`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <div className="w-12 text-sm text-gray-900 font-medium text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

interface ProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  subtitle?: string
}

export function ProgressRing({ 
  percentage, 
  size = 120, 
  strokeWidth = 8, 
  color = '#d2212b',
  label,
  subtitle 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
        </div>
      </div>
      {label && (
        <div className="text-center mt-3">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
        </div>
      )}
    </div>
  )
}