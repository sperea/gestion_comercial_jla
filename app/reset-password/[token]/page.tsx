'use client'


import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/Card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return // El error se muestra en la UI
    }

    if (password.length < 6) {
      return // El error se muestra en la UI
    }

    setLoading(true)

    try {
      const result = await resetPassword(token, password)
      if (result) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch = password === confirmPassword || !confirmPassword
  const passwordValid = password.length >= 6 || !password

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
            Ingresa tu nueva contraseña
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
                  Ir al login
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Input
                  label="Nueva Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  error={!passwordValid ? 'La contraseña debe tener al menos 6 caracteres' : undefined}
                />
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
                  disabled={!password || !confirmPassword || !passwordsMatch || !passwordValid}
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

