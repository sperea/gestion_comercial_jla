'use client'

import { useEffect, useState } from 'react'

export default function CookieDebugPage() {
  const [cookies, setCookies] = useState<string>('')
  const [localStorage, setLocalStorage] = useState<any>({})
  const [authStatus, setAuthStatus] = useState<any>(null)

  useEffect(() => {
    // Obtener todas las cookies
    setCookies(document.cookie)
    
    // Obtener localStorage
    const localStorageData = {
      jla_remember_me: window.localStorage.getItem('jla_remember_me'),
      allKeys: Object.keys(window.localStorage)
    }
    setLocalStorage(localStorageData)

    // Verificar estado de autenticación
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Haciendo petición a /api/auth/me...')
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })
      const data = await response.json()
      console.log('📥 Respuesta recibida:', { status: response.status, data })
      setAuthStatus({
        status: response.status,
        data: data
      })
    } catch (error) {
      console.log('❌ Error en petición:', error)
      setAuthStatus({
        error: error
      })
    }
  }

  const clearAllStorage = () => {
    // Limpiar localStorage
    window.localStorage.clear()
    
    // Limpiar cookies (solo las que podemos acceder desde JS)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });

    // Recargar para ver el efecto
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Diagnóstico de Cookies y Autenticación
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cookies */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🍪 Cookies del Navegador
            </h2>
            <div className="bg-gray-50 p-4 rounded text-sm font-mono overflow-auto max-h-40">
              {cookies || 'No hay cookies disponibles desde JavaScript'}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ⚠️ Las cookies HTTP-Only (access-token, refresh-token) no se muestran aquí
            </p>
          </div>

          {/* LocalStorage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              💾 LocalStorage
            </h2>
            <div className="bg-gray-50 p-4 rounded text-sm font-mono overflow-auto max-h-40">
              <pre>{JSON.stringify(localStorage, null, 2)}</pre>
            </div>
          </div>

          {/* Estado de Autenticación */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🔐 Estado de Autenticación (API)
            </h2>
            <div className="bg-gray-50 p-4 rounded text-sm font-mono overflow-auto max-h-60">
              <pre>{JSON.stringify(authStatus, null, 2)}</pre>
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🧰 Acciones de Depuración
            </h2>
            <div className="space-y-4">
              <button
                onClick={checkAuthStatus}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-4"
              >
                🔄 Verificar Auth Status
              </button>
              
              <button
                onClick={clearAllStorage}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                🗑️ Limpiar Todo (Cookies + LocalStorage)
              </button>

              <button
                onClick={() => window.location.href = '/login'}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded ml-4"
              >
                🔑 Ir a Login
              </button>

              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded ml-4"
              >
                📊 Ir a Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            📋 Diagnóstico del Problema Actual
          </h3>
          <div className="text-yellow-700 space-y-2 text-sm">
            <p><strong>Problema:</strong> Al refrescar la página, vuelve al login a pesar de tener `jla_remember_me = true`</p>
            <p><strong>Síntoma:</strong> GET http://localhost:3000/api/auth/me 401 (Unauthorized)</p>
            <p><strong>Causa probable:</strong> Las cookies HTTP-Only (access-token, refresh-token) han expirado</p>
            
            <div className="mt-4">
              <h4 className="font-semibold">🔍 Pasos para diagnosticar:</h4>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Verifica si `jla_remember_me` existe en LocalStorage ✓</li>
                <li>Haz click en &quot;Verificar Auth Status&quot; para ver los logs del servidor</li>
                <li>Revisa la consola del navegador para logs detallados</li>
                <li>Si ves &quot;No hay tokens disponibles&quot;, las cookies han expirado</li>
                <li>Si ves &quot;Intentando renovar...&quot;, el refresh token también expiró</li>
              </ol>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">🔧 Soluciones:</h4>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Si las cookies expiraron: Hacer login nuevamente con &quot;Remember Me&quot; activado</li>
                <li>Si persiste: Limpiar todo y empezar desde cero</li>
                <li>Verificar configuración de duración de cookies en el backend</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}