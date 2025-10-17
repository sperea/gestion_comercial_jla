'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/Card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { forgotPassword } = useAuth()

  // Validación de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const isFormValid = email.trim().length > 0 && isValidEmail(email.trim())

  // Debug effect
  useEffect(() => {
    console.log('🔄 State updated:', { email, isFormValid, emailLength: email.length })
  }, [email, isFormValid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      console.log('❌ Formulario no válido:', { email, isValidEmail: isValidEmail(email) })
      return
    }
    
    setLoading(true)
    console.log('🔐 Enviando solicitud de recuperación para:', email.trim())

    try {
      const success = await forgotPassword(email.trim())
      if (success) {
        setSent(true)
      }
    } finally {
      setLoading(false)
    }
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {sent 
              ? 'Hemos enviado un enlace de recuperación a tu email'
              : 'Ingresa tu email para recibir un enlace de recuperación'
            }
          </p>
        </div>

        {/* Form or Success Message */}
        <Card>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Email enviado</h3>
              <p className="text-sm text-gray-600">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setSent(false)}
                  variant="secondary"
                  className="w-full"
                >
                  Enviar a otro email
                </Button>
                <Link href="/login">
                  <Button variant="primary" className="w-full">
                    Volver al login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Input
                  label="Correo Electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const newEmail = e.target.value
                    console.log('📧 Email event triggered:', { 
                      newValue: newEmail, 
                      currentState: email,
                      eventTarget: e.target.value 
                    })
                    setEmail(newEmail)
                  }}
                  onInput={(e) => {
                    console.log('📧 onInput triggered:', (e.target as HTMLInputElement).value)
                  }}
                  required
                  placeholder="sperea@jlaasociados.es"
                  autoComplete="email"
                  helperText="Ingresa el email asociado a tu cuenta"
                  error={email.length > 0 && !isValidEmail(email) ? 'Formato de email inválido' : undefined}
                />
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  disabled={!isFormValid || loading}
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>

                {/* Debug info - solo en desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                    Debug: Email=&quot;{email}&quot; | Valid={isFormValid.toString()} | Length={email.length}
                  </div>
                )}

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

