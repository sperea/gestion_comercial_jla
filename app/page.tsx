'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirección automática del lado del cliente - inmediata
    router.replace('/login')
    
    // Meta refresh como respaldo
    const metaRefresh = document.createElement('meta')
    metaRefresh.setAttribute('http-equiv', 'refresh')
    metaRefresh.setAttribute('content', '1;url=/login')
    document.head.appendChild(metaRefresh)

    return () => {
      // Cleanup
      const existingMeta = document.querySelector('meta[http-equiv="refresh"]')
      if (existingMeta) {
        document.head.removeChild(existingMeta)
      }
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirigiendo al login...</h1>
        <p className="text-gray-600 mb-4">Si no es redirigido automáticamente, haga clic en el enlace de abajo.</p>
        <Link 
          href="/login" 
          className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Ir al Login
        </Link>
      </div>
    </div>
  )
}