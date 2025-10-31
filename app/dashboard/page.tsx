'use client'

import { useAuth } from '@/context/AuthContext'
import { PulseIndicator } from '@/components/ui/AnimatedComponents'
import TimeDisplay from '@/components/ui/DashboardWidgets'

export default function DashboardPage() {
  const { user } = useAuth()

  // Función para obtener el nombre completo del usuario
  const getUserDisplayName = () => {
    if (!user) return 'Usuario'
    if (user?.name) return user.name
    if (user?.full_name) return user.full_name
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user?.first_name) return user.first_name
    if (user?.email) return user.email.split('@')[0] // Usar la parte antes del @ como nombre
    return 'Usuario'
  }

  const userDisplayName = getUserDisplayName()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Bienvenido de vuelta, {userDisplayName}! 👋
              </h1>
              <p className="mt-2 text-gray-600">
                Aquí tienes un resumen de tu actividad y el estado del sistema
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <TimeDisplay />
              <PulseIndicator color="green" label="Sistema en línea" />
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

