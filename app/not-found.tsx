'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function NotFound() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Si no hay usuario, redirigir al login
    if (!user) {
      console.log('🔍 [404] Usuario no autenticado, redirigiendo a /login')
      router.replace('/login')
    }
  }, [user, loading, router])

  // Mostrar loading mientras se determina la autenticación
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

  // Si no hay usuario, mostrar loading para redirección
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

  // Para usuarios autenticados, mostrar página 404 personalizada
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página no encontrada</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          La página que estás buscando no existe o ha sido movida.
        </p>
        <div className="space-x-4">
          <Link 
            href="/dashboard"
            className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Ir al Dashboard
          </Link>
          <button 
            onClick={() => router.back()}
            className="inline-block px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  )
}