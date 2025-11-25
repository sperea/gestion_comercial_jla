'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return // Esperar a que cargue el estado de autenticación

    if (user) {
      // Usuario logueado -> dashboard
      console.log('🏠 [HomePage] Usuario autenticado, redirigiendo a /dashboard')
      router.replace('/dashboard')
    } else {
      // Usuario no logueado -> login
      console.log('🏠 [HomePage] Usuario no autenticado, redirigiendo a /login')
      router.replace('/login')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Cargando aplicación...</p>
      </div>
    </div>
  )
}