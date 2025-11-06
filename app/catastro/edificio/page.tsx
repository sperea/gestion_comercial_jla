'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import dynamic from 'next/dynamic'

// Importar el mapa dinámicamente para evitar errores de SSR
const MapaUbicacion = dynamic(() => import('./MapaUbicacion'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-gray-100 rounded">Cargando mapa...</div>
}) as React.ComponentType<{
  coord_x: string
  coord_y: string  
  ref_catastral: string
}>

// Interfaz para el resumen del edificio según API
interface EdificioResumen {
  ref_catastral: string
  coord_x: string
  coord_y: string
  superficie_parcela_m2: string
  plantas_bajo_rasante: number
  plantas_en_alto: number
  numero_edificios: number
  numero_escaleras: number
  m2_almacen_estacionamiento: string
  num_almacen_estacionamiento: number
  m2_residencial: string
  num_residencial: number
  m2_industrial: string
  num_industrial: number
  m2_oficinas: string
  num_oficinas: number
  m2_comercial: string
  num_comercial: number
  m2_deportivo: string
  num_deportivo: number
  m2_espectaculos: string
  num_espectaculos: number
  m2_ocio_hosteleria: string
  num_ocio_hosteleria: number
  m2_sanidad_beneficencia: string
  num_sanidad_beneficencia: number
  m2_cultural: string
  num_cultural: number
  m2_religioso: string
  num_religioso: number
  m2_urbanizacion_jardines: string
  num_urbanizacion_jardines: number
  m2_edificio_singular: string
  num_edificio_singular: number
  m2_almacen_agrario: string
  num_almacen_agrario: number
  m2_industrial_agrario: string
  num_industrial_agrario: number
  m2_agrario: string
  num_agrario: number
  superficie_total_construida: string
  total_inmuebles: number
}



function EdificioDetallePageContent() {
  const searchParams = useSearchParams()
  const refCatastral = searchParams.get('ref')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [edificioData, setEdificioData] = useState<EdificioResumen | null>(null)

  useEffect(() => {
    if (!refCatastral) {
      setError('No se proporcionó referencia catastral')
      setLoading(false)
      return
    }

    fetchDetalleEdificio(refCatastral)
  }, [refCatastral])

  const fetchDetalleEdificio = async (refcat: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🏗️ Obteniendo datos del edificio para referencia:', refcat)

      const response = await fetch(`/api/catastro/edificio-detalle?refcat=${encodeURIComponent(refcat)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No tienes permisos para acceder a esta información')
        } else if (response.status === 404) {
          throw new Error('No se encontró información para la referencia catastral proporcionada')
        } else {
          throw new Error(`Error del servidor: ${response.status}`)
        }
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        console.log('✅ Datos del edificio recibidos:', data.data)
        console.log('📊 Tipo de datos:', typeof data.data)
        console.log('📋 Es array?:', Array.isArray(data.data))
        
        // Los datos vienen directamente en formato EdificioResumen desde la API
        if (Array.isArray(data.data) && data.data.length > 0) {
          // Si viene como array, tomar el primer elemento (debería ser el resumen del edificio)
          console.log('🏠 Primer elemento del array:', JSON.stringify(data.data[0], null, 2))
          setEdificioData(data.data[0])
        } else if (data.data && typeof data.data === 'object') {
          // Si viene como objeto único (formato esperado)
          console.log('� Datos del edificio:', data.data)
          setEdificioData(data.data)
        } else {
          throw new Error('Formato de datos no reconocido')
        }
      } else {
        throw new Error('No se encontraron datos para esta referencia catastral')
      }

    } catch (error) {
      console.error('Error obteniendo resumen del edificio:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener los tipos de propiedad con sus datos
  const getTiposPropiedad = () => {
    if (!edificioData) return []
    
    const tipos = [
      { 
        nombre: 'Residencial', 
        m2: parseFloat(edificioData.m2_residencial || '0'), 
        num: edificioData.num_residencial || 0, 
        color: 'bg-blue-100 text-blue-800',
        icon: '🏠'
      },
      { 
        nombre: 'Comercial', 
        m2: parseFloat(edificioData.m2_comercial || '0'), 
        num: edificioData.num_comercial || 0, 
        color: 'bg-green-100 text-green-800',
        icon: '🏪'
      },
      { 
        nombre: 'Oficinas', 
        m2: parseFloat(edificioData.m2_oficinas || '0'), 
        num: edificioData.num_oficinas || 0, 
        color: 'bg-purple-100 text-purple-800',
        icon: '🏢'
      },
      { 
        nombre: 'Industrial', 
        m2: parseFloat(edificioData.m2_industrial || '0'), 
        num: edificioData.num_industrial || 0, 
        color: 'bg-orange-100 text-orange-800',
        icon: '🏭'
      },
      { 
        nombre: 'Almacén/Estacionamiento', 
        m2: parseFloat(edificioData.m2_almacen_estacionamiento || '0'), 
        num: edificioData.num_almacen_estacionamiento || 0, 
        color: 'bg-gray-100 text-gray-800',
        icon: '🚗'
      },
      { 
        nombre: 'Deportivo', 
        m2: parseFloat(edificioData.m2_deportivo || '0'), 
        num: edificioData.num_deportivo || 0, 
        color: 'bg-indigo-100 text-indigo-800',
        icon: '🏃'
      },
      { 
        nombre: 'Ocio y Hostelería', 
        m2: parseFloat(edificioData.m2_ocio_hosteleria || '0'), 
        num: edificioData.num_ocio_hosteleria || 0, 
        color: 'bg-pink-100 text-pink-800',
        icon: '🍽️'
      },
      { 
        nombre: 'Cultural', 
        m2: parseFloat(edificioData.m2_cultural || '0'), 
        num: edificioData.num_cultural || 0, 
        color: 'bg-yellow-100 text-yellow-800',
        icon: '🎭'
      },
      { 
        nombre: 'Sanidad y Beneficencia', 
        m2: parseFloat(edificioData.m2_sanidad_beneficencia || '0'), 
        num: edificioData.num_sanidad_beneficencia || 0, 
        color: 'bg-red-100 text-red-800',
        icon: '🏥'
      },
      { 
        nombre: 'Espectáculos', 
        m2: parseFloat(edificioData.m2_espectaculos || '0'), 
        num: edificioData.num_espectaculos || 0, 
        color: 'bg-purple-100 text-purple-800',
        icon: '🎪'
      }
    ]
    
    // Filtrar solo los tipos que tienen datos (cantidad > 0 o superficie > 0)
    return tipos.filter(tipo => tipo.num > 0 || tipo.m2 > 0)
  }

  if (!refCatastral) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-red-900 mb-4">Error</h1>
            <p className="text-red-700">No se proporcionó una referencia catastral válida</p>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del edificio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-red-900 mb-4">Error</h1>
            <p className="text-red-700 mb-4">{error}</p>
            <Button 
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700"
            >
              ← Volver
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const tiposPropiedad = getTiposPropiedad()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Detalle del Edificio
              </h1>
              <p className="text-gray-600">
                Referencia Catastral: <span className="font-mono font-semibold">{refCatastral}</span>
              </p>
            </div>
            <Button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700"
            >
              ← Volver
            </Button>
          </div>
        </div>

        {/* Grid de Información del Edificio y Mapa */}
        {edificioData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Información del Edificio */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Referencia Catastral</p>
                  <p className="font-mono font-semibold">{edificioData.ref_catastral}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Superficie Total Construida</p>
                  <p className="font-semibold">{parseFloat(edificioData.superficie_total_construida || '0').toLocaleString()} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Inmuebles</p>
                  <p className="font-semibold">{edificioData.total_inmuebles || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Superficie de Parcela</p>
                  <p className="font-semibold">{parseFloat(edificioData.superficie_parcela_m2 || '0').toLocaleString()} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plantas en Alto</p>
                  <p className="font-semibold">{edificioData.plantas_en_alto}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plantas Bajo Rasante</p>
                  <p className="font-semibold">{edificioData.plantas_bajo_rasante}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Edificios</p>
                  <p className="font-semibold">{edificioData.numero_edificios}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Escaleras</p>
                  <p className="font-semibold">{edificioData.numero_escaleras}</p>
                </div>
              </div>
            </div>

            {/* Mapa de Ubicación */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Ubicación</h2>
              <div className="h-80">
                <MapaUbicacion 
                  coord_x={edificioData.coord_x}
                  coord_y={edificioData.coord_y}
                  ref_catastral={edificioData.ref_catastral}
                />
              </div>
            </div>

          </div>
        )}

        {/* Desglose por Tipo de Propiedad */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Desglose por Tipo de Propiedad</h2>
          
          {tiposPropiedad.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No hay datos de propiedades disponibles</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiposPropiedad.map((tipo, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${tipo.color}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="text-xl">{tipo.icon}</span>
                      {tipo.nombre}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Cantidad:</span>
                      <span className="font-semibold">{tipo.num}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Superficie:</span>
                      <span className="font-semibold">{tipo.m2.toLocaleString()} m²</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

export default function EdificioDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando página...</p>
        </div>
      </div>
    }>
      <EdificioDetallePageContent />
    </Suspense>
  )
}