'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function DirectLoginTest() {
  const [email, setEmail] = useState('sperea@jlaasociados.es')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { login } = useAuth()

  const testDirectLogin = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🚀 DIRECT TEST: Intentando login directo al backend Django')
      
      // Login directo al backend Django (sin proxy)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      console.log('📨 DIRECT TEST: Status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        setResult({
          success: false,
          error: errorData.message || errorData.detail || 'Error en login directo',
          status: response.status
        })
        return
      }

      const data = await response.json()
      console.log('✅ DIRECT TEST: Data recibida:', data)

      setResult({
        success: true,
        data: data,
        message: 'Login directo exitoso'
      })

    } catch (error) {
      console.log('❌ DIRECT TEST: Error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }

    setLoading(false)
  }

  const testAuthContextLogin = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🚀 AUTH CONTEXT: Probando login con AuthContext')
      const success = await login({ email, password })
      
      setResult({
        success: success,
        message: success ? 'Login con AuthContext exitoso' : 'Login con AuthContext falló',
        fromAuthContext: true
      })
    } catch (error) {
      console.log('❌ AUTH CONTEXT: Error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        fromAuthContext: true
      })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Test Login Directo</h1>
          
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testDirectLogin}
                disabled={loading || !email || !password}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Probando...' : 'Login Directo Backend'}
              </button>

              <button
                onClick={testAuthContextLogin}
                disabled={loading || !email || !password}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Probando...' : 'Login AuthContext'}
              </button>
            </div>

            {result && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">
                  {result.success ? '✅' : '❌'} Resultado:
                </h2>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}