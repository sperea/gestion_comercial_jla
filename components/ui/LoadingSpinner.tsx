'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export default function LoadingSpinner({ size = 'md', color = '#d2212b' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-2 ${sizeClasses[size]}`}
         style={{ borderTopColor: color }}>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Skeleton */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="hidden md:flex space-x-8">
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section Skeleton */}
        <div className="mb-8">
          <div className="w-80 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Secondary Stats Skeleton */}
        <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="w-24 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="flex justify-center py-4">
              <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando Dashboard</h2>
        <p className="text-gray-600">Preparando tu experiencia personalizada...</p>
      </div>
    </div>
  )
}