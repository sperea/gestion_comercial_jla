'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'

interface FormData {
  colaborador: number
  comercial: number
  rsocial: string
  direccion_linea1: string
  direccion_linea2: string
  cif: string
  anyo_construccion: number
  anyo_rehabilitacion: number
  tipo_rehabilitacion: 'total' | 'parcial' | 'ninguna'
  numero_viviendas: number
  numero_locales: number
  numero_garajes: number
  metros_vivienda: number
  metros_locales: number
  metros_garaje: number
  numero_portales: number
  alturas_sobre_rasante: number
  alturas_ajo_rasante: number
  tipo_calefaccion: 'INDIVIDUAL' | 'CENTRAL' | 'NO TIENE'
  portero: boolean
  numero_piscinas: number
  urbanizacion: boolean
  numero_ascensores: number
  vencimiento: string
  observaciones: string
}

export default function NuevoComparativoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    colaborador: 1,
    comercial: user?.id ? parseInt(user.id) : 0,
    rsocial: '',
    direccion_linea1: '',
    direccion_linea2: '',
    cif: '',
    anyo_construccion: 0,
    anyo_rehabilitacion: 0,
    tipo_rehabilitacion: 'ninguna',
    numero_viviendas: 0,
    numero_locales: 0,
    numero_garajes: 0,
    metros_vivienda: 0,
    metros_locales: 0,
    metros_garaje: 0,
    numero_portales: 0,
    alturas_sobre_rasante: 0,
    alturas_ajo_rasante: 0,
    tipo_calefaccion: 'NO TIENE',
    portero: false,
    numero_piscinas: 0,
    urbanizacion: false,
    numero_ascensores: 0,
    vencimiento: '',
    observaciones: ''
  })

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateChange = (value: string) => {
    // Convertir de dd/mm/yyyy a yyyy-mm-dd para el backend
    const [day, month, year] = value.split('/')
    if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
      const isoDate = `${year}-${month}-${day}`
      setFormData(prev => ({ ...prev, vencimiento: isoDate }))
    }
  }

  const formatDateForDisplay = (isoDate: string) => {
    // Convertir de yyyy-mm-dd a dd/mm/yyyy para mostrar
    if (!isoDate) return ''
    const [year, month, day] = isoDate.split('-')
    return `${day}/${month}/${year}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.rsocial.trim()) {
      toast.error('La razón social es obligatoria')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/intranet/proyectos-comunidad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newProject = await response.json()
        toast.success('Comparativo creado exitosamente')
        router.push(`/proyectos/comunidades/${newProject.id}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al crear el comparativo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión al crear el comparativo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg p-8 mb-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center mb-2">
              <div className="bg-white/10 rounded-full p-2 mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold">Nuevo Comparativo</h1>
            </div>
            <p className="text-red-100 text-lg">Crear un nuevo proyecto de comunidad de propietarios</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Información Básica</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón Social <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.rsocial}
                onChange={(e) => handleInputChange('rsocial', e.target.value)}
                maxLength={100}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CIF/NIF <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.cif}
                  onChange={(e) => handleInputChange('cif', e.target.value)}
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comercial
                </label>
                <Input
                  type="text"
                  value={user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'Usuario actual'}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venc. seguro
                </label>
                <Input
                  type="date"
                  value={formData.vencimiento}
                  onChange={(e) => handleInputChange('vencimiento', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Línea 1 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.direccion_linea1}
                onChange={(e) => handleInputChange('direccion_linea1', e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Línea 2
              </label>
              <Input
                type="text"
                value={formData.direccion_linea2}
                onChange={(e) => handleInputChange('direccion_linea2', e.target.value)}
                maxLength={100}
              />
            </div>
          </div>
        </Card>

        {/* Información del Edificio */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Información del Edificio</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año constr. <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.anyo_construccion || ''}
                onChange={(e) => handleInputChange('anyo_construccion', parseInt(e.target.value) || 0)}
                min="1800"
                max="2030"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año rehab.
              </label>
              <Input
                type="number"
                value={formData.anyo_rehabilitacion || ''}
                onChange={(e) => handleInputChange('anyo_rehabilitacion', parseInt(e.target.value) || 0)}
                min="1800"
                max="2030"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo rehab. <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-sm"
                value={formData.tipo_rehabilitacion}
                onChange={(e) => handleInputChange('tipo_rehabilitacion', e.target.value)}
              >
                <option value="ninguna">Ninguna</option>
                <option value="parcial">Parcial</option>
                <option value="total">Total</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nº portales
              </label>
              <Input
                type="number"
                value={formData.numero_portales || ''}
                onChange={(e) => handleInputChange('numero_portales', parseInt(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alturas s/rasante
              </label>
              <Input
                type="number"
                value={formData.alturas_sobre_rasante || ''}
                onChange={(e) => handleInputChange('alturas_sobre_rasante', parseInt(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alturas b/rasante
              </label>
              <Input
                type="number"
                value={formData.alturas_ajo_rasante || ''}
                onChange={(e) => handleInputChange('alturas_ajo_rasante', parseInt(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>
          </div>
        </Card>

        {/* Distribución */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Distribución</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nº viviendas
              </label>
              <Input
                type="number"
                value={formData.numero_viviendas || ''}
                onChange={(e) => handleInputChange('numero_viviendas', parseInt(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nº locales
              </label>
              <Input
                type="number"
                value={formData.numero_locales || ''}
                onChange={(e) => handleInputChange('numero_locales', parseInt(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nº garajes
              </label>
              <Input
                type="number"
                value={formData.numero_garajes || ''}
                onChange={(e) => handleInputChange('numero_garajes', parseInt(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M² vivienda
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.metros_vivienda || ''}
                onChange={(e) => handleInputChange('metros_vivienda', parseFloat(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M² locales
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.metros_locales || ''}
                onChange={(e) => handleInputChange('metros_locales', parseFloat(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M² garaje
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.metros_garaje || ''}
                onChange={(e) => handleInputChange('metros_garaje', parseFloat(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>
          </div>
        </Card>

        {/* Instalaciones */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Instalaciones y Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo calefacción <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={formData.tipo_calefaccion}
                onChange={(e) => handleInputChange('tipo_calefaccion', e.target.value)}
              >
                <option value="NO TIENE">NO TIENE</option>
                <option value="INDIVIDUAL">INDIVIDUAL</option>
                <option value="CENTRAL">CENTRAL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nº ascensores
              </label>
              <Input
                type="number"
                value={formData.numero_ascensores || ''}
                onChange={(e) => handleInputChange('numero_ascensores', parseInt(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiene portero
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.portero ? 'si' : 'no'}
                onChange={(e) => handleInputChange('portero', e.target.value === 'si')}
              >
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urbanización
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.urbanizacion ? 'si' : 'no'}
                onChange={(e) => handleInputChange('urbanizacion', e.target.value === 'si')}
              >
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nº piscinas
              </label>
              <Input
                type="number"
                value={formData.numero_piscinas || ''}
                onChange={(e) => handleInputChange('numero_piscinas', parseInt(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>
          </div>
        </Card>

        {/* IDs del Sistema - Oculto, solo para envío al backend */}
        <input type="hidden" name="colaborador" value={1} />
        <input type="hidden" name="comercial" value={user?.id || 0} />

        {/* Observaciones */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Observaciones</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales sobre el proyecto..."
            />
          </div>
        </Card>

        {/* Botones */}
        <div className="flex justify-end space-x-4 pb-16">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Comparativo'}
          </Button>
        </div>
      </form>
    </div>
  )
}