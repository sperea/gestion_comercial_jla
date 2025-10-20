'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { profileAPI } from '@/lib/api'
import Header from '@/components/ui/Header'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/Button'
import ProfileImageUpload from '@/components/ui/ProfileImageUpload'
import { toast } from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser, updateUserImage } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
  })

  // Cargar datos del perfil cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      loadProfileData()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfileData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Cargando datos de perfil...')
      
      // Usar datos del contexto como base
      if (user) {
        console.log('👤 Datos del usuario desde contexto:', user)
        const contextData = {
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone: user.phone || '',
        }
        setFormData(contextData)
        setCurrentImageUrl(user.profile_image || null)
        
        // Si el usuario tiene datos completos (sugiere que viene de updateUser reciente),
        // no hacer llamada a la API para evitar sobrescribir
        if (user.phone !== undefined) {
          console.log('✅ Usando datos del contexto (perfil actualizado recientemente)')
          setLoading(false)
          return
        }
      }

      // Solo intentar cargar desde API si no tenemos datos frescos del contexto
      try {
        console.log('📡 Llamando a profileAPI.getProfile()...')
        const response = await profileAPI.getProfile()
        console.log('📡 Respuesta de profileAPI.getProfile():', response)
        
        if (response.success && response.data) {
          console.log('✅ Datos de perfil cargados desde API:', response.data)
          setFormData({
            email: response.data.email || '',
            first_name: response.data.first_name || '',
            last_name: response.data.last_name || '',
            phone: response.data.phone || '',
          })
          setCurrentImageUrl(response.data.profile_image || null)
          toast.success('Datos de perfil actualizados desde el servidor')
        } else {
          console.warn('⚠️ API no disponible, usando datos del contexto:', response.error)
          if (user) {
            toast('Usando datos locales (API no disponible)', { 
              icon: 'ℹ️',
              duration: 3000 
            })
          } else {
            toast.error(response.error || 'Error al cargar datos del perfil')
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Error de conexión con API, usando datos del contexto:', apiError)
        if (user) {
          toast('Usando datos locales (sin conexión al servidor)', { 
            icon: '⚠️',
            duration: 3000 
          })
        } else {
          toast.error('No se pudieron cargar los datos del perfil')
        }
      }
      
    } catch (error) {
      console.error('💥 Error general cargando perfil:', error)
      toast.error('Error al cargar datos del perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpdate = async (newImageUrl: string | null) => {
    // Actualizar el estado local inmediatamente para UI responsiva
    setCurrentImageUrl(newImageUrl)
    // Actualizar la imagen en el contexto del usuario
    await updateUserImage(newImageUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      console.log('💾 Guardando datos de perfil:', {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      })

      // Actualizar el contexto de usuario (que maneja la API internamente)
      const success = await updateUser({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      })
      
      if (success) {
        console.log('✅ Perfil actualizado exitosamente')
        // El useEffect se encargará de actualizar formData cuando user cambie
      } else {
        console.error('❌ Error actualizando perfil')
        toast.error('Error al actualizar el perfil')
      }
      
    } catch (error) {
      console.error('💥 Excepción actualizando perfil:', error)
      toast.error('Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const getUserInitials = () => {
    if (formData.first_name || formData.last_name) {
      return `${formData.first_name?.charAt(0) || ''}${formData.last_name?.charAt(0) || ''}`.toUpperCase()
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600">Cargando datos del perfil...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de la página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="mt-2 text-gray-600">
            Actualiza tu información personal y configuración de cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Foto de perfil */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Foto de Perfil
                </h2>
                
                <ProfileImageUpload
                  currentImageUrl={currentImageUrl}
                  userFullName={user?.full_name || `${formData.first_name} ${formData.last_name}`.trim()}
                  onImageUpdate={handleImageUpdate}
                />
              </Card>
            </div>

            {/* Información personal */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Información Personal
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <Input
                      label="Nombre"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Ingresa tu nombre"
                      required
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <Input
                      label="Apellidos"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Ingresa tus apellidos"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <Input
                      label="Correo Electrónico"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div className="md:col-span-2">
                    <Input
                      label="Teléfono"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+34 123 456 789"
                      helperText="Campo opcional"
                    />
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Recargar datos originales desde la API
                      loadProfileData()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>

        {/* Información adicional */}
        <Card className="mt-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Información de Cuenta
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="font-medium text-gray-700">Usuario:</span>
              <span className="ml-2 text-gray-600">{user?.username}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Rol:</span>
              <span className="ml-2 text-gray-600 capitalize">{user?.role}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Fecha de registro:</span>
              <span className="ml-2 text-gray-600">
                {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('es-ES') : 'No disponible'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Último acceso:</span>
              <span className="ml-2 text-gray-600">
                {user?.last_login ? new Date(user.last_login).toLocaleDateString('es-ES') : 'No disponible'}
              </span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}