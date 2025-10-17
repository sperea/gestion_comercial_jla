'use client'

import { useState, useEffect } from 'react'

interface AnimatedCounterProps {
  target: number
  duration?: number
  suffix?: string
  prefix?: string
}

export default function AnimatedCounter({ target, duration = 2000, suffix = '', prefix = '' }: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const increment = target / (duration / 16) // 60fps
    let currentValue = 0
    
    const timer = setInterval(() => {
      currentValue += increment
      if (currentValue >= target) {
        setCurrent(target)
        clearInterval(timer)
      } else {
        setCurrent(Math.floor(currentValue))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [target, duration])

  return (
    <span className="font-bold text-gray-900">
      {prefix}{current}{suffix}
    </span>
  )
}

interface FloatingActionButtonProps {
  onClick: () => void
  icon: React.ReactNode
  tooltip: string
  position?: 'bottom-right' | 'bottom-left'
  color?: 'primary' | 'secondary' | 'success' | 'warning'
}

const colorVariants = {
  primary: 'bg-gradient-to-r from-primary to-red-600 hover:from-red-600 hover:to-primary',
  secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-500',
  success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-500',
  warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500'
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6'
}

export function FloatingActionButton({ 
  onClick, 
  icon, 
  tooltip, 
  position = 'bottom-right', 
  color = 'primary' 
}: FloatingActionButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="relative">
        <button
          onClick={onClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`w-14 h-14 ${colorVariants[color]} rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300 flex items-center justify-center text-white`}
        >
          {icon}
        </button>
        
        {showTooltip && (
          <div className={`absolute ${position === 'bottom-right' ? 'right-16 bottom-3' : 'left-16 bottom-3'} bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap transform transition-all duration-200`}>
            {tooltip}
            <div className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 ${position === 'bottom-right' ? '-right-1' : '-left-1'}`}></div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  color?: 'primary' | 'success' | 'warning' | 'danger'
  showPercentage?: boolean
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const progressColors = {
  primary: 'bg-gradient-to-r from-primary to-red-600',
  success: 'bg-gradient-to-r from-green-500 to-green-600',
  warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
  danger: 'bg-gradient-to-r from-red-500 to-red-600'
}

const progressSizes = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
}

export function ProgressBar({ 
  progress, 
  color = 'primary', 
  showPercentage = false, 
  animated = true,
  size = 'md'
}: ProgressBarProps) {
  const [currentProgress, setCurrentProgress] = useState(0)

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setCurrentProgress(progress), 100)
      return () => clearTimeout(timer)
    } else {
      setCurrentProgress(progress)
    }
  }, [progress, animated])

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${progressSizes[size]}`}>
        <div
          className={`${progressColors[color]} ${progressSizes[size]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(currentProgress, 100)}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-right">
          <AnimatedCounter target={progress} suffix="%" />
        </div>
      )}
    </div>
  )
}

interface PulseIndicatorProps {
  color?: 'green' | 'red' | 'yellow' | 'blue'
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const pulseColors = {
  green: 'bg-green-400',
  red: 'bg-red-400',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-400'
}

const pulseSizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
}

export function PulseIndicator({ color = 'green', size = 'md', label }: PulseIndicatorProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`${pulseSizes[size]} ${pulseColors[color]} rounded-full animate-pulse`}></div>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  )
}