'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { authAPI } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/Card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  // Validar el token al cargar la página
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Token no proporcionado')
        setValidating(false)
        return
      }

      try {
        const result = await authAPI.validateResetToken(token)
        
        if (result.success && result.data) {
          setTokenValid(true)
          setUserEmail(result.data.email)
        } else {
          setTokenError(result.error || 'Token inválido o expirado')
        }
      } catch (err) {
        setTokenError('Error al validar el token')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    // Validar complejidad
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('La contraseña debe contener mayúsculas, minúsculas y números')
      return
    }

    setLoading(true)

    try {
      const result = await authAPI.resetPassword(token, password, confirmPassword)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.error || 'Error al restablecer la contraseña')
      }
    } catch (err) {
      setError('Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch = password === confirmPassword || !confirmPassword
  const passwordLengthValid = password.length >= 8 || !password
  const passwordComplexityValid = !password || (
    /[A-Z]/.test(password) && 
    /[a-z]/.test(password) && 
    /\d/.test(password)
  )

  // Loading state mientras valida el token
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600">Validando token de recuperación...</p>
          </div>
        </Card>
      </div>
    )
  }

  // Token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100 inline-block">
              <Image
                src="/img/logo.webp"
                alt="JLA Logo"
                width={120}
                height={80}
                className="object-contain"
              />
            </div>
          </div>

          <Card>
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Token Inválido</h3>
              <p className="text-sm text-gray-600">
                {tokenError || 'El enlace de recuperación es inválido o ha expirado.'}
              </p>
              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full">
                    Solicitar nuevo enlace
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" className="w-full">
                    Volver al login
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          {/* Logo Container */}
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100 inline-block">
            <Image
              src="/img/logo.webp"
              alt="JLA Logo"
              width={120}
              height={80}
              className="object-contain"
            />
          </div>
          
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2H7v-2H4a1 1 0 01-1-1v-4c0-2.946 2.33-5.32 5.244-5.9A4.002 4.002 0 0113 3a6 6 0 016 6z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Restablecer Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Estableciendo nueva contraseña para: <span className="font-medium text-gray-900">{userEmail}</span>
          </p>
        </div>

        {/* Form or Success Message */}
        <Card>
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">¡Contraseña restablecida!</h3>
              <p className="text-sm text-gray-600">
                Tu contraseña ha sido restablecida exitosamente. Serás redirigido al login en unos segundos.
              </p>
              <Link href="/login">
                <Button className="w-full">
                  Ir al login ahora
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <Input
                  label="Nueva Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 8 caracteres"
                  error={!passwordLengthValid ? 'La contraseña debe tener al menos 8 caracteres' : 
                         !passwordComplexityValid ? 'Debe contener mayúsculas, minúsculas y números' : undefined}
                />
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-xs">
                      <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                        {password.length >= 8 ? '✓' : '○'} Al menos 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                        {/[A-Z]/.test(password) ? '✓' : '○'} Una letra mayúscula
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                        {/[a-z]/.test(password) ? '✓' : '○'} Una letra minúscula
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={/\d/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                        {/\d/.test(password) ? '✓' : '○'} Un número
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="Confirmar Nueva Contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repite tu nueva contraseña"
                  error={!passwordsMatch ? 'Las contraseñas no coinciden' : undefined}
                />
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  disabled={!password || !confirmPassword || !passwordsMatch || !passwordLengthValid || !passwordComplexityValid}
                >
                  {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                </Button>

                <Link href="/login">
                  <Button variant="secondary" className="w-full">
                    Volver al login
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

