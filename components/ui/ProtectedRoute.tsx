'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { isPublicRoute, saveRedirectRoute, getAndClearRedirectRoute } from '@/lib/auth-utils'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Si aún está cargando, no hacer nada
    if (loading) {
      return
    }

    // Si es una ruta pública, permitir acceso
    if (isPublicRoute(pathname)) {
      return
    }

    // Si no hay usuario en ruta protegida, redirigir a login
    if (!user) {
      console.log('🔒 [ProtectedRoute] Usuario no autenticado, redirigiendo a /login desde:', pathname)
      
      // Guardar la ruta actual para redirigir después del login
      saveRedirectRoute(pathname)
      
      router.replace('/login')
      return
    }

    // Si hay usuario en página de login, redirigir según corresponda
    if (user && pathname === '/login') {
      const redirectTo = getAndClearRedirectRoute()
      console.log('✅ [ProtectedRoute] Usuario autenticado en /login, redirigiendo a:', redirectTo)
      router.replace(redirectTo)
      return
    }

  }, [user, loading, pathname, router])

  // Mostrar loading mientras se determina el estado de autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Para rutas públicas, mostrar contenido directamente
  if (isPublicRoute(pathname)) {
    return <>{children}</>
  }

  // Para rutas protegidas, solo mostrar si hay usuario
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}