'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [email, setEmail] = useState('sperea@jlaasociados.es')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/debug/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Error en el fetch',
        details: error instanceof Error ? error.message : String(error)
      })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Debug Backend Connection</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button
              onClick={testLogin}
              disabled={loading || !email || !password}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Probando conexión...' : 'Probar Login Backend'}
            </button>

            {result && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">📋 Resultado:</h2>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>

                {result.debug && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">🔧 Debug Info:</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>URL:</strong> {result.debug.url}</p>
                      <p><strong>Status:</strong> {result.status}</p>
                      {result.debug.responseText && (
                        <div>
                          <strong>Respuesta Raw:</strong>
                          <div className="bg-red-50 p-2 rounded mt-1 font-mono text-xs">
                            {result.debug.responseText}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Información de configuración:</h3>
            <p className="text-blue-700 text-sm">
              Backend URL configurado: <code>{process.env.NEXT_PUBLIC_API_URL || 'No configurado'}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}