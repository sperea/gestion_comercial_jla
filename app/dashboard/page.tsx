'use client'

import { useAuth } from '@/context/AuthContext'
import Header from '@/components/ui/Header'
import StatsCard from '@/components/ui/StatsCard'
import MetricCard from '@/components/ui/MetricCard'
import ChartCard, { SimpleBarChart, ProgressRing } from '@/components/ui/ChartCard'
import NotificationCard, { ActivityItem } from '@/components/ui/NotificationCard'
import AnimatedCounter, { FloatingActionButton, PulseIndicator } from '@/components/ui/AnimatedComponents'
import TimeDisplay, { WeatherWidget, SystemStatus, QuickAction } from '@/components/ui/DashboardWidgets'

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

  // Datos de ejemplo para las métricas
  const projectData = [
    { label: 'Activos', value: 8, color: 'bg-gradient-to-r from-green-500 to-green-600' },
    { label: 'En revisión', value: 3, color: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
    { label: 'Completados', value: 12, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { label: 'Pendientes', value: 5, color: 'bg-gradient-to-r from-red-500 to-red-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
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

        {/* Metrics Grid */}
        <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Proyectos Activos"
            metric={<AnimatedCounter target={8} />}
            change={{ value: 12, label: "desde el mes pasado", isPositive: true }}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            color="primary"
          />
          
          <MetricCard
            title="Documentos"
            metric={<AnimatedCounter target={156} />}
            change={{ value: 8, label: "nuevos esta semana", isPositive: true }}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="success"
          />
          
          <MetricCard
            title="Eficiencia"
            metric={<AnimatedCounter target={94} suffix="%" />}
            change={{ value: 5, label: "mejora mensual", isPositive: true }}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="info"
          />
          
          <MetricCard
            title="Tiempo Promedio"
            metric={<AnimatedCounter target={2.4} suffix="h" />}
            change={{ value: 15, label: "reducción", isPositive: true }}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="warning"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Sesión Actual"
            value="JWT Activo"
            description="Autenticación segura con tokens"
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
          
          <StatsCard
            title="Estado del Sistema"
            value="Operativo"
            description="Todos los servicios funcionando"
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            trend={{ value: 99.9, isPositive: true }}
          />
          
          <StatsCard
            title="Perfil de Usuario"
            value={user?.email?.split('@')[0] || 'Usuario'}
            description={user?.email || 'Email no disponible'}
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Project Status Chart */}
          <div className="lg:col-span-2">
            <ChartCard 
              title="Estado de Proyectos" 
              subtitle="Distribución actual de proyectos por estado"
              actions={
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  Ver todos
                </button>
              }
            >
              <SimpleBarChart data={projectData} />
            </ChartCard>
          </div>
          
          {/* Progress Ring */}
          <div>
            <ChartCard title="Progreso General">
              <div className="flex justify-center py-4">
                <ProgressRing 
                  percentage={78} 
                  label="Objetivos Completados"
                  subtitle="Meta mensual"
                  color="#d2212b"
                />
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-8">
          <ChartCard title="Stack Tecnológico" subtitle="Herramientas y tecnologías utilizadas">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">⚡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Next.js 15.5.4</h4>
                    <p className="text-sm text-blue-700">App Router</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🔐</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900">JWT Seguro</h4>
                    <p className="text-sm text-green-700">HTTP-Only Cookies</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🎨</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900">Tailwind CSS</h4>
                    <p className="text-sm text-purple-700">Diseño Responsivo</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">📱</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-900">Responsive</h4>
                    <p className="text-sm text-red-700">Mobile First</p>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Notifications and Activity Section */}
        <div className="grid gap-6 lg:grid-cols-3 mt-8">
          {/* Recent Notifications */}
          <ChartCard title="Notificaciones Recientes" subtitle="Últimas actualizaciones del sistema">
            <div className="space-y-3">
              <NotificationCard
                type="success"
                title="Sesión iniciada correctamente"
                message="Tu sesión JWT ha sido validada y está activa"
                time="Hace 2 minutos"
              />
              <NotificationCard
                type="info"
                title="Sistema actualizado"
                message="Nueva versión de la aplicación disponible"
                time="Hace 1 hora"
              />
              <NotificationCard
                type="warning"
                title="Recordatorio"
                message="Revisa los proyectos pendientes de revisión"
                time="Hace 3 horas"
              />
            </div>
          </ChartCard>

          {/* Recent Activity */}
          <ChartCard title="Actividad Reciente" subtitle="Últimas acciones en el sistema">
            <div className="space-y-1">
              <ActivityItem
                user={userDisplayName}
                action="inició sesión en"
                target="el dashboard"
                time="Hace 2 minutos"
              />
              <ActivityItem
                user="Sistema"
                action="actualizó"
                target="las métricas de rendimiento"
                time="Hace 15 minutos"
              />
              <ActivityItem
                user="Administrador"
                action="configuró"
                target="nuevas políticas de seguridad"
                time="Hace 1 hora"
              />
              <ActivityItem
                user={user?.name || "Usuario"}
                action="cambió la contraseña de"
                target="su cuenta"
                time="Hace 2 horas"
              />
            </div>
          </ChartCard>

          {/* System Status and Quick Actions */}
          <div className="space-y-6">
            {/* Weather Widget */}
            <WeatherWidget location="Santiago, Chile" />
            
            {/* System Status */}
            <ChartCard title="Estado del Sistema" subtitle="Monitoreo en tiempo real">
              <SystemStatus 
                services={[
                  { name: 'API Backend', status: 'online', lastCheck: 'Hace 1 min' },
                  { name: 'Base de Datos', status: 'online', lastCheck: 'Hace 2 min' },
                  { name: 'Autenticación JWT', status: 'online', lastCheck: 'Hace 30 seg' },
                  { name: 'Almacenamiento', status: 'warning', lastCheck: 'Hace 5 min' }
                ]}
              />
            </ChartCard>

            {/* Quick Actions */}
            <ChartCard title="Acciones Rápidas" subtitle="Tareas frecuentes">
              <div className="space-y-3">
                <QuickAction
                  title="Nuevo Proyecto"
                  description="Crear un nuevo proyecto colaborativo"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                  onClick={() => alert('Funcionalidad en desarrollo')}
                  color="primary"
                />
                <QuickAction
                  title="Generar Reporte"
                  description="Crear reporte de actividad mensual"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  onClick={() => alert('Funcionalidad en desarrollo')}
                  color="success"
                />
                <QuickAction
                  title="Configuración"
                  description="Ajustar preferencias del sistema"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  onClick={() => alert('Funcionalidad en desarrollo')}
                  color="secondary"
                />
              </div>
            </ChartCard>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => {
          // Scroll to top smooth
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        }
        tooltip="Volver arriba"
        color="primary"
      />
    </div>
  )
}

