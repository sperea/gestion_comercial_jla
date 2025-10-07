'use client'

import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {/* Logo en el header */}
              <div className="flex-shrink-0">
                <Image
                  src="/img/logo.webp"
                  alt="JLA Logo"
                  width={160}
                  height={50}
                  className="object-contain"
                />
              </div>
              
              {/* Separador vertical */}
              <div className="h-8 w-px bg-gray-300"></div>
              
              {/* Info del usuario */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-600">
                    {user?.name || user?.email}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Button onClick={handleLogout} variant="secondary">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* User Info Card */}
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Perfil de Usuario</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
            </Card>

            {/* Security Card */}
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Sesión Segura</h3>
                  <p className="text-sm text-gray-600">Autenticación JWT activa</p>
                </div>
              </div>
            </Card>

            {/* Status Card */}
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Estado del Sistema</h3>
                  <p className="text-sm text-gray-600">Todos los servicios activos</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Welcome Message */}
          <div className="mt-8">
            <Card padding="lg">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  ¡Autenticación Exitosa!
                </h3>
                <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                  Has iniciado sesión exitosamente en el sistema. Esta aplicación utiliza autenticación JWT 
                  con cookies HTTP-Only para garantizar la máxima seguridad de tu sesión. 
                  El diseño responsivo se adapta perfectamente a todos los dispositivos.
                </p>
                
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900">🔐 JWT Seguro</h4>
                    <p className="text-sm text-gray-600 mt-1">Cookies HTTP-Only</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900">📱 Responsivo</h4>
                    <p className="text-sm text-gray-600 mt-1">Móvil y Desktop</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900">🎨 Tailwind CSS</h4>
                    <p className="text-sm text-gray-600 mt-1">Diseño Moderno</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900">⚡ Next.js 14+</h4>
                    <p className="text-sm text-gray-600 mt-1">App Router</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

