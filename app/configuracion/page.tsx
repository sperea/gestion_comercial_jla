'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { profileAPI, UserSettings, UserSettingsUpdate } from '@/lib/api'
import Header from '@/components/ui/Header'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

const ConfiguracionPage = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<UserSettingsUpdate>({
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    timezone: 'Europe/Madrid',
    is_dark_theme: 'false',
    email_notifications: true
  })

  // Opciones disponibles
  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (22/10/2025)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (10/22/2025)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-10-22)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (22-10-2025)' }
  ]

  const timeFormatOptions = [
    { value: '24h', label: '24 horas (14:30)' },
    { value: '12h', label: '12 horas (2:30 PM)' }
  ]

  const timezoneOptions = [
    { value: 'Europe/Madrid', label: 'Europa/Madrid (CET/CEST)' },
    { value: 'Europe/London', label: 'Europa/Londres (GMT/BST)' },
    { value: 'America/New_York', label: 'América/Nueva York (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'América/Los Ángeles (PST/PDT)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokio (JST)' },
    { value: 'Australia/Sydney', label: 'Australia/Sídney (AEST/AEDT)' }
  ]

  const themeOptions = [
    { value: 'false', label: 'Tema Claro' },
    { value: 'true', label: 'Tema Oscuro' }
  ]

  // Cargar configuración del usuario
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        
        const response = await profileAPI.getUserSettings()
        
        if (response.success && response.data?.results && response.data.results.length > 0) {
          const userSettings = response.data.results[0]
          setSettings(userSettings)
          setFormData({
            date_format: userSettings.date_format || 'DD/MM/YYYY',
            time_format: userSettings.time_format || '24h',
            timezone: userSettings.timezone || 'Europe/Madrid',
            is_dark_theme: userSettings.is_dark_theme || 'false',
            email_notifications: userSettings.email_notifications ?? true
          })
        } else {
          // Si no hay configuración, usar valores por defecto
          console.log('🔧 No hay configuración guardada, usando valores por defecto')
        }
      } catch (err) {
        console.error('❌ Error cargando configuración:', err)
        setError('Error al cargar la configuración')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user])

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof UserSettingsUpdate, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Limpiar mensajes al hacer cambios
    setError(null)
    setSuccess(null)
  }

  // Guardar configuración
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await profileAPI.updateUserSettings(formData)

      if (response.success) {
        setSuccess('Configuración guardada correctamente')
        // Recargar la configuración para obtener datos actualizados
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      } else {
        setError(response.error || 'Error al guardar la configuración')
      }
    } catch (err) {
      console.error('❌ Error guardando configuración:', err)
      setError('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  // Renderizar campo de configuración
  const renderConfigField = (
    label: string,
    description: string,
    field: keyof UserSettingsUpdate,
    type: 'select' | 'toggle',
    options?: { value: string; label: string }[]
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      
      {type === 'select' && options && (
        <select
          value={String(formData[field])}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      
      {type === 'toggle' && (
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => handleInputChange(field, !formData[field])}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              formData[field] ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData[field] ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            {formData[field] ? 'Activado' : 'Desactivado'}
          </span>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="bg-gray-50 min-h-screen">
          <Header />
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            Personaliza tu experiencia en la plataforma
          </p>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Configuración de Fecha y Hora */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Fecha y Hora
            </h2>
            <p className="text-sm text-gray-600">
              Configura cómo se muestran las fechas y horas en la aplicación
            </p>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            {renderConfigField(
              'Formato de Fecha',
              'Selecciona cómo prefieres ver las fechas',
              'date_format',
              'select',
              dateFormatOptions
            )}

            {renderConfigField(
              'Formato de Hora',
              'Elige entre formato de 12 o 24 horas',
              'time_format',
              'select',
              timeFormatOptions
            )}

            {renderConfigField(
              'Zona Horaria',
              'Selecciona tu zona horaria para mostrar las horas correctamente',
              'timezone',
              'select',
              timezoneOptions
            )}
          </div>
        </Card>

        {/* Configuración de Apariencia */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Apariencia
            </h2>
            <p className="text-sm text-gray-600">
              Personaliza la apariencia de la interfaz
            </p>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            {renderConfigField(
              'Tema',
              'Elige entre tema claro u oscuro',
              'is_dark_theme',
              'select',
              themeOptions
            )}
          </div>
        </Card>

        {/* Configuración de Notificaciones */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Notificaciones
            </h2>
            <p className="text-sm text-gray-600">
              Controla qué notificaciones recibes por email
            </p>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            {renderConfigField(
              'Notificaciones por Email',
              'Recibe notificaciones importantes en tu correo electrónico',
              'email_notifications',
              'toggle'
            )}
          </div>
        </Card>

        {/* Información de configuración actual */}
        {settings && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Información de Configuración
              </h2>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Última actualización:</span>
                  <p className="text-gray-600">
                    {new Date(settings.updated_at).toLocaleString('es-ES')}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Configuración creada:</span>
                  <p className="text-gray-600">
                    {new Date(settings.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="secondary"
            onClick={() => {
              // Recargar configuración original
              if (settings) {
                setFormData({
                  date_format: settings.date_format || 'DD/MM/YYYY',
                  time_format: settings.time_format || '24h',
                  timezone: settings.timezone || 'Europe/Madrid',
                  is_dark_theme: settings.is_dark_theme || 'false',
                  email_notifications: settings.email_notifications ?? true
                })
                setError(null)
                setSuccess(null)
              }
            }}
            disabled={saving}
          >
            Restablecer
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
          </div>
        </main>
      </div>
    </AuthenticatedLayout>
  )
}

export default ConfiguracionPage