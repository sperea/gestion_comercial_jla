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

// Interfaz para inmueble individual del listado
interface InmuebleDetalle {
  ref_catastral: string
  parcela_catastral: string
  num_bien: string
  uso_principal: string
  uso_descripcion: string
  bloque: string
  escalera: string
  planta: string
  puerta: string
  superficie_m2: string
  ano_construccion: string
  tipo_reforma: string | null
  fecha_reforma: string | null
}



function EdificioDetallePageContent() {
  const searchParams = useSearchParams()
  const refCatastral = searchParams.get('ref')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [edificioData, setEdificioData] = useState<EdificioResumen | null>(null)
  const [inmuebles, setInmuebles] = useState<InmuebleDetalle[]>([])
  const [selectedInmuebles, setSelectedInmuebles] = useState<Set<number>>(new Set())
  const [loadingInmuebles, setLoadingInmuebles] = useState(false)
  const [errorInmuebles, setErrorInmuebles] = useState<string | null>(null)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InmuebleDetalle | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

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

  // Función para cargar lista detallada de inmuebles
  const cargarInmuebles = async () => {
    if (!refCatastral || !edificioData) return

    try {
      setLoadingInmuebles(true)
      setErrorInmuebles(null)
      
      console.log('🏠 Cargando inmuebles para referencia:', refCatastral)
      
      const response = await fetch(`/api/catastro/inmuebles/listado/refcat?ref=${encodeURIComponent(refCatastral)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        // Intentar leer el error como JSON
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // Si no es JSON, podría ser HTML (error de autenticación)
          const errorText = await response.text()
          if (errorText.includes('<!DOCTYPE')) {
            errorMessage = 'Error de autenticación. Por favor, inicia sesión nuevamente.'
          }
        }
        throw new Error(errorMessage)
      }

      // Verificar que la respuesta es JSON válido
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta no es JSON válido. Posible problema de autenticación.')
      }

      const responseData = await response.json()
      
      console.log('📋 Respuesta inmuebles:', responseData)

      // Manejar diferentes formatos de respuesta
      let inmueblesList: InmuebleDetalle[] = []
      
      if (responseData.success && responseData.data) {
        inmueblesList = responseData.data
      } else if (Array.isArray(responseData)) {
        inmueblesList = responseData
      } else {
        throw new Error('Formato de datos no reconocido en la respuesta')
      }

      setInmuebles(inmueblesList)
      console.log(`✅ ${inmueblesList.length} inmuebles cargados correctamente`)
      
    } catch (err) {
      console.error('Error cargando inmuebles:', err)
      setErrorInmuebles(err instanceof Error ? err.message : 'Error desconocido al cargar inmuebles')
    } finally {
      setLoadingInmuebles(false)
    }
  }

  // Función para manejar selección de inmuebles con soporte para Ctrl y Shift
  const handleSelection = (originalIndex: number, sortedIndex: number, event?: React.MouseEvent) => {
    const newSelection = new Set(selectedInmuebles)
    
    if (event?.ctrlKey || event?.metaKey) {
      // Ctrl/Cmd + Click: Toggle individual selection
      if (newSelection.has(originalIndex)) {
        newSelection.delete(originalIndex)
      } else {
        newSelection.add(originalIndex)
      }
      setLastSelectedIndex(sortedIndex)
    } else if (event?.shiftKey && lastSelectedIndex !== null) {
      // Shift + Click: Select range basado en la vista ordenada
      const sortedInmuebles = getSortedInmuebles()
      const start = Math.min(lastSelectedIndex, sortedIndex)
      const end = Math.max(lastSelectedIndex, sortedIndex)
      
      for (let i = start; i <= end; i++) {
        // Encontrar el índice original del inmueble en la posición ordenada i
        const inmuebleEnPosicion = sortedInmuebles[i]
        const originalIndexForPosition = inmuebles.findIndex(item => 
          item.ref_catastral === inmuebleEnPosicion.ref_catastral && 
          item.num_bien === inmuebleEnPosicion.num_bien
        )
        if (originalIndexForPosition !== -1) {
          newSelection.add(originalIndexForPosition)
        }
      }
    } else {
      // Click normal: Select only this item
      newSelection.clear()
      newSelection.add(originalIndex)
      setLastSelectedIndex(sortedIndex)
    }
    
    setSelectedInmuebles(newSelection)
  }

  // Función simple para checkboxes (mantiene comportamiento original)
  const toggleSelection = (originalIndex: number) => {
    const newSelection = new Set(selectedInmuebles)
    if (newSelection.has(originalIndex)) {
      newSelection.delete(originalIndex)
    } else {
      newSelection.add(originalIndex)
    }
    setSelectedInmuebles(newSelection)
    
    // Encontrar el índice en la vista ordenada para actualizar lastSelectedIndex
    const sortedInmuebles = getSortedInmuebles()
    const inmuebleOriginal = inmuebles[originalIndex]
    const sortedIndex = sortedInmuebles.findIndex(item => 
      item.ref_catastral === inmuebleOriginal.ref_catastral && 
      item.num_bien === inmuebleOriginal.num_bien
    )
    setLastSelectedIndex(sortedIndex)
  }

  const selectAll = () => {
    setSelectedInmuebles(new Set(inmuebles.map((_, index) => index)))
    // El último seleccionado en vista ordenada sería el último elemento visible
    const sortedInmuebles = getSortedInmuebles()
    setLastSelectedIndex(sortedInmuebles.length - 1)
  }

  const clearSelection = () => {
    setSelectedInmuebles(new Set())
    setLastSelectedIndex(null)
  }

  // Función para manejar el ordenamiento por columna
  const handleSort = (key: keyof InmuebleDetalle) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
  }

  // Función para obtener los inmuebles ordenados
  const getSortedInmuebles = () => {
    if (!sortConfig.key) return inmuebles

    const sortedInmuebles = [...inmuebles].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]
      
      // Manejo especial para números (superficie, año)
      if (sortConfig.key === 'superficie_m2' || sortConfig.key === 'ano_construccion') {
        const aNum = parseFloat(aValue?.toString() || '0')
        const bNum = parseFloat(bValue?.toString() || '0')
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum
      }
      
      // Manejo para strings
      const aStr = (aValue || '').toString().toLowerCase()
      const bStr = (bValue || '').toString().toLowerCase()
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    
    return sortedInmuebles
  }

  // Obtener los inmuebles ordenados para mostrar
  const sortedInmuebles = getSortedInmuebles()

  // Componente para encabezados de columna ordenables
  const SortableHeader = ({ 
    children, 
    sortKey, 
    className = "p-3 text-left font-semibold text-gray-700" 
  }: { 
    children: React.ReactNode
    sortKey: keyof InmuebleDetalle
    className?: string 
  }) => (
    <th 
      className={`${className} cursor-pointer hover:bg-gray-100 transition-colors select-none`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        <div className="flex flex-col ml-1">
          <svg 
            className={`w-3 h-3 ${
              sortConfig.key === sortKey && sortConfig.direction === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg 
            className={`w-3 h-3 -mt-1 ${
              sortConfig.key === sortKey && sortConfig.direction === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </th>
  )

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

        {/* Listado Detallado de Inmuebles */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Listado Detallado de Inmuebles</h2>
            {inmuebles.length === 0 && !loadingInmuebles && !errorInmuebles && (
              <button
                onClick={cargarInmuebles}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cargar Inmuebles
              </button>
            )}
          </div>

          {loadingInmuebles && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando inmuebles...</p>
            </div>
          )}

          {errorInmuebles && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-red-800 font-semibold">Error al cargar inmuebles</h4>
                  <p className="text-red-700 text-sm mt-1">{errorInmuebles}</p>
                  <button
                    onClick={cargarInmuebles}
                    className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {inmuebles.length > 0 && (
            <>
              {/* Controles de selección */}
              <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-col">
                  <div className="text-sm text-gray-600">
                    {selectedInmuebles.size} de {inmuebles.length} inmuebles seleccionados
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    💡 <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">Ctrl</kbd> + clic para selección múltiple • 
                    <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs mx-1">Shift</kbd> + clic para selección en rango • 
                    Clic en columnas para ordenar
                  </div>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Seleccionar Todos
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Limpiar Selección
                  </button>
                </div>
              </div>

              {/* Tabla de inmuebles */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedInmuebles.size === sortedInmuebles.length && sortedInmuebles.length > 0}
                          onChange={() => selectedInmuebles.size === sortedInmuebles.length ? clearSelection() : selectAll()}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <SortableHeader sortKey="num_bien">Nº Bien</SortableHeader>
                      <SortableHeader sortKey="uso_descripcion">Uso</SortableHeader>
                      <SortableHeader sortKey="escalera">Escalera</SortableHeader>
                      <SortableHeader sortKey="planta">Planta</SortableHeader>
                      <SortableHeader sortKey="puerta">Puerta</SortableHeader>
                      <SortableHeader sortKey="superficie_m2" className="p-3 text-right font-semibold text-gray-700">Superficie</SortableHeader>
                      <SortableHeader sortKey="ano_construccion">Año Const.</SortableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedInmuebles.map((inmueble, sortedIndex) => {
                      // Encontrar el índice original del inmueble en la lista sin ordenar
                      const originalIndex = inmuebles.findIndex(item => 
                        item.ref_catastral === inmueble.ref_catastral && 
                        item.num_bien === inmueble.num_bien
                      )
                      return (
                        <tr 
                          key={`${inmueble.ref_catastral}-${inmueble.num_bien}`}
                          className={`hover:bg-gray-50 cursor-pointer transition-colors select-none ${
                            selectedInmuebles.has(originalIndex) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={(e) => handleSelection(originalIndex, sortedIndex, e)}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedInmuebles.has(originalIndex)}
                              onChange={() => toggleSelection(originalIndex)}
                              className="rounded border-gray-300"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-3 font-medium text-gray-900">{inmueble.num_bien}</td>
                          <td className="p-3 text-gray-600">
                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded-full">
                              {inmueble.uso_descripcion}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{inmueble.escalera || '-'}</td>
                          <td className="p-3 text-gray-600">{inmueble.planta || '-'}</td>
                          <td className="p-3 text-gray-600">{inmueble.puerta || '-'}</td>
                          <td className="p-3 text-right font-medium text-gray-900">
                            {parseFloat(inmueble.superficie_m2 || '0').toLocaleString()} m²
                          </td>
                          <td className="p-3 text-gray-600">{inmueble.ano_construccion}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Resumen de selección */}
              {selectedInmuebles.size > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Inmuebles Seleccionados</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Cantidad:</span>
                      <span className="ml-2 font-semibold">{selectedInmuebles.size}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Superficie Total:</span>
                      <span className="ml-2 font-semibold">
                        {Array.from(selectedInmuebles)
                          .reduce((total, index) => {
                            const inmueble = inmuebles[index]
                            return total + parseFloat(inmueble?.superficie_m2 || '0')
                          }, 0)
                          .toLocaleString()} m²
                      </span>
                    </div>
                    <div className="md:text-right">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        Exportar Selección
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {inmuebles.length === 0 && !loadingInmuebles && !errorInmuebles && (
            <div className="text-center py-8 text-gray-600">
              <p>Haz clic en &quot;Cargar Inmuebles&quot; para ver el listado detallado</p>
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