'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Usuario autenticado - redirigir al dashboard
        router.replace('/dashboard')
      } else {
        // Usuario no autenticado - redirigir al login
        router.replace('/login')
      }
    }
  }, [user, loading, router])

  // Mostrar spinner mientras se verifica la autenticación
  return <FullPageLoader />
}