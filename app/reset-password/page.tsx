'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const token = searchParams.get('token')
    
    if (token) {
      // Redirigir de ?token=xxx a /reset-password/xxx
      router.replace(`/reset-password/${token}`)
    } else {
      // Si no hay token, redirigir a forgot-password
      router.replace('/forgot-password')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}

export default function ResetPasswordRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordRedirectContent />
    </Suspense>
  )
}