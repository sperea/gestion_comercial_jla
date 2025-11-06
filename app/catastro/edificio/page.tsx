'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Interfaz actualizada para el endpoint mejorado del backend
interface InmuebleDetalle {
  ref_catastral: string
  nombre_provincia: string
  nombre_municipio: string
  via_completa: string
  tipo_via: string
  nombre_via: string
  numero: string
  num_policia_1: string
  letra_1: string
  num_policia_2: string
  letra_2: string
  cp: string
  bloque: string
  escalera: string
  planta: string
  puerta: string
  ano_construccion: string
  sup_total_inmueble: string
  sup_suelo: string
  coordenadas: string
  coef_propiedad: string
  uso_cat15: string
  uso_principal: "VIVIENDA" | "ALMACEN" | "APARCAMIENTO" | "CCE" | "ELEMENTOS COMUNES" | string
  superficie_m2: string
  tipo_reforma: string
  fecha_reforma: string
  tipo_elemento: "PRIVATIVO" | "ELEMENTOS COMUNES" | string
}

// Interfaz para datos agregados por edificio (ahora extraída del primer elemento)
interface EdificioInfo {
  ref_catastral: string
  nombre_municipio: string
  nombre_provincia: string
  cp: string
  tipo_via: string
  nombre_via: string
  via_completa: string
  numero: string
  num_policia_1: string
  ano_construccion: string
  sup_suelo: string
  bloque?: string
}

// Componente del mapa
function MapComponent({ address, municipio, provincia }: { address: string; municipio: string; provincia: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const originalView = useRef<{ coords: [number, number]; zoom: number } | null>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    // Solo cargar el mapa en el cliente
    if (typeof window === 'undefined') return

    const initMap = async () => {
      try {
        // Cargar Leaflet dinámicamente
        const L = (await import('leaflet')).default
        
        // CSS de Leaflet
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        if (mapRef.current && !mapInstance.current) {
          // Crear el mapa centrado en Madrid por defecto
          mapInstance.current = L.map(mapRef.current).setView([40.4168, -3.7038], 13)

          // Añadir tiles de OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapInstance.current)

          // Buscar la dirección usando Nominatim (geocodificador gratuito de OpenStreetMap)
          // Intentar múltiples formatos de búsqueda para mejorar la precisión
          const searchQueries = [
            `${address}, ${municipio}, ${provincia}, España`,
            `${address}, ${municipio}, España`, 
            `${address.replace('CL ', 'Calle ')}, ${municipio}, ${provincia}, España`,
            `${municipio}, ${provincia}, España` // Fallback al municipio
          ]
          
          let foundCoords: [number, number] | null = null
          
          for (const searchAddress of searchQueries) {
            if (foundCoords) break // Si ya encontramos coordenadas, salir del loop
            
            console.log('🗺️ Intentando búsqueda:', searchAddress)
            
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&countrycodes=es`
              )
              
              if (response.ok) {
                const results = await response.json()
                if (results && results.length > 0) {
                  const { lat, lon } = results[0]
                  foundCoords = [parseFloat(lat), parseFloat(lon)]
                  console.log('🎯 Coordenadas encontradas:', foundCoords)
                  break // Salir del loop si encontramos coordenadas
                }
              }
            } catch (error) {
              console.warn(`⚠️ Error en búsqueda "${searchAddress}":`, error)
              continue // Continuar con la siguiente búsqueda
            }
          }
          
          if (foundCoords) {
            // Guardar la vista original
            originalView.current = { coords: foundCoords, zoom: 17 }
            
            // Centrar el mapa en la ubicación encontrada
            mapInstance.current.setView(foundCoords, 17)
            
            // Añadir marcador
            markerRef.current = L.marker(foundCoords).addTo(mapInstance.current)
            markerRef.current.bindPopup(`
              <div class="text-sm">
                <strong>${address}</strong><br>
                ${municipio}, ${provincia}
              </div>
            `).openPopup()
          } else {
            console.warn('⚠️ No se encontraron coordenadas para ninguna variación de la dirección')
            // Fallback: centrar en Madrid
            const madridCoords: [number, number] = [40.4168, -3.7038]
            originalView.current = { coords: madridCoords, zoom: 12 }
            mapInstance.current.setView(madridCoords, 12)
            
            // Añadir marcador genérico en Madrid
            markerRef.current = L.marker(madridCoords).addTo(mapInstance.current)
            markerRef.current.bindPopup(`
              <div class="text-sm">
                <strong>Ubicación aproximada</strong><br>
                ${municipio}, ${provincia}<br>
                <em>Coordenadas exactas no encontradas</em>
              </div>
            `).openPopup()
          }
        }
      } catch (error) {
        console.error('Error cargando el mapa:', error)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [address, municipio, provincia])

  // Función para resetear la vista del mapa
  const resetMapView = () => {
    if (mapInstance.current && originalView.current) {
      mapInstance.current.setView(originalView.current.coords, originalView.current.zoom)
      if (markerRef.current) {
        markerRef.current.openPopup()
      }
    }
  }

  // Función para centrar en el edificio
  const centerOnBuilding = () => {
    if (mapInstance.current && originalView.current) {
      mapInstance.current.setView(originalView.current.coords, 18) // Zoom más cercano
      if (markerRef.current) {
        markerRef.current.openPopup()
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              🗺️ Ubicación del Edificio
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Mapa interactivo de la dirección catastral
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={resetMapView}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              🔄 Reset Vista
            </Button>
            <Button
              onClick={centerOnBuilding}
              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              🎯 Centrar
            </Button>
          </div>
        </div>
      </div>
      <div className="relative">
        <div 
          ref={mapRef} 
          className="h-64 w-full"
          style={{ height: '300px' }}
        />
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          📍 {address}, {municipio}, {provincia} • Mapa proporcionado por OpenStreetMap
        </p>
      </div>
    </div>
  )
}

export default function EdificioDetallePage() {
  const searchParams = useSearchParams()
  const refCatastral = searchParams.get('ref')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inmuebles, setInmuebles] = useState<InmuebleDetalle[]>([])
  const [elementosComunes, setElementosComunes] = useState<InmuebleDetalle[]>([])
  const [todosLosElementos, setTodosLosElementos] = useState<InmuebleDetalle[]>([])
  const [edificioInfo, setEdificioInfo] = useState<EdificioInfo | null>(null)
  const [selectedInmuebles, setSelectedInmuebles] = useState<Set<number>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)

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

      console.log('🏗️ Obteniendo detalle del edificio para referencia:', refcat)

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
      
      if (data.success && Array.isArray(data.data)) {
        // Debug: Verificar estructura de datos del nuevo endpoint
        console.log('🔍 DATOS COMPLETOS DEL NUEVO BACKEND:', data.data)
        console.log('🔍 PRIMER ELEMENTO COMPLETO:', data.data[0])
        
        // Guardar todos los elementos
        setTodosLosElementos(data.data)
        
        // Filtrar elementos privados y comunes por separado usando tipo_elemento
        const elementosPrivados = data.data.filter((item: InmuebleDetalle) => 
          item.tipo_elemento === 'PRIVATIVO'
        )
        const elementosComu = data.data.filter((item: InmuebleDetalle) => 
          item.tipo_elemento === 'ELEMENTOS COMUNES' || item.uso_principal === 'ELEMENTOS COMUNES'
        )
        
        // Crear información del edificio a partir del primer elemento
        if (data.data.length > 0) {
          const primerElemento = data.data[0]
          setEdificioInfo({
            ref_catastral: primerElemento.ref_catastral,
            nombre_municipio: primerElemento.nombre_municipio,
            nombre_provincia: primerElemento.nombre_provincia,
            cp: primerElemento.cp,
            tipo_via: primerElemento.tipo_via,
            nombre_via: primerElemento.nombre_via,
            via_completa: primerElemento.via_completa,
            numero: primerElemento.numero,
            num_policia_1: primerElemento.num_policia_1,
            ano_construccion: primerElemento.ano_construccion,
            sup_suelo: primerElemento.sup_suelo,
            bloque: primerElemento.bloque
          })
        }
        
        console.log('📋 ELEMENTOS PRIVADOS FILTRADOS:', elementosPrivados)
        console.log('🏢 ELEMENTOS COMUNES:', elementosComu)
        
        setInmuebles(elementosPrivados)
        setElementosComunes(elementosComu)
        
        // Seleccionar automáticamente todos los elementos privados al cargar
        const allIndices = new Set<number>()
        for (let i = 0; i < elementosPrivados.length; i++) {
          allIndices.add(i)
        }
        setSelectedInmuebles(allIndices)
        setLastSelectedIndex(elementosPrivados.length - 1)
        console.log(`✅ Auto-seleccionados ${elementosPrivados.length} inmuebles privados`)
        console.log(`ℹ️ Encontrados ${elementosComu.length} elementos comunes`)
      } else if (Array.isArray(data)) {
        setInmuebles(data)
        // Seleccionar automáticamente todos los inmuebles al cargar
        const allIndices = new Set<number>()
        for (let i = 0; i < data.length; i++) {
          allIndices.add(i)
        }
        setSelectedInmuebles(allIndices)
        setLastSelectedIndex(data.length - 1)
        console.log(`✅ Auto-seleccionados ${data.length} inmuebles por defecto`)
      } else {
        throw new Error('Formato de respuesta inesperado')
      }

    } catch (error) {
      console.error('Error obteniendo detalle del edificio:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
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

  const formatearDireccion = (info: EdificioInfo | null) => {
    if (!info) return 'Dirección no disponible'
    
    let direccion = ''
    let numero = info.numero || info.num_policia_1 || 'S/N'
    
    // Usar la vía completa si está disponible, sino construir la dirección
    if (info.via_completa) {
      direccion = info.via_completa
    } else {
      direccion = `${info.tipo_via || ''} ${info.nombre_via || ''}`.trim()
    }
    
    // Formatear el número eliminando ceros a la izquierda
    if (numero && numero !== 'S/N') {
      const numeroLimpio = parseInt(numero).toString()
      return `${direccion} ${numeroLimpio}`
    }
    
    return `${direccion} ${numero}`
  }

  const obtenerTipoInmueble = (inmueble: InmuebleDetalle) => {
    // Usar uso_principal como preferencia, uso_cat15 como respaldo
    const tipo = inmueble.uso_principal || inmueble.uso_cat15 || 'OTRO'
    
    // Mapear los tipos de uso principal a colores e iconos
    if (tipo.includes('VIVIENDA') || tipo === 'V') {
      return { 
        nombre: 'Vivienda', 
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      }
    }
    
    if (tipo.includes('ALMACEN') || tipo === 'A') {
      return { 
        nombre: 'Almacén', 
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      }
    }
    
    if (tipo.includes('APARCAMIENTO') || tipo === 'P') {
      return { 
        nombre: 'Aparcamiento', 
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 6H4L2 4h14l2 2-1 11H4l-1-11z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 11h16M6 6v5M18 6v5" />
          </svg>
        )
      }
    }
    
    if (tipo.includes('COMERCIAL') || tipo === 'C') {
      return { 
        nombre: 'Comercial', 
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      }
    }
    
    if (tipo.includes('CCE') || tipo.includes('ELEMENTOS COMUNES')) {
      return { 
        nombre: 'Elementos Comunes', 
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      }
    }
    
    // Otros usos (O99) - Usos no especificados
    if (tipo === 'O99' || tipo.includes('O99')) {
      return { 
        nombre: 'Otros Usos', 
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    }
    
    // Tipo por defecto para códigos no reconocidos
    return { 
      nombre: tipo, 
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  const toggleInmuebleSelection = (originalIndex: number, shiftKey: boolean = false) => {
    const newSelected = new Set(selectedInmuebles)
    
    if (shiftKey && lastSelectedIndex !== null) {
      // Para selección múltiple, necesitamos trabajar con los índices en el orden mostrado
      const sortedIndices = inmuebles
        .map((inmueble, idx) => ({ originalIndex: idx, ...inmueble }))
        .sort((a, b) => {
          // Ordenamiento simplificado
          const escaleraA = parseInt(a.escalera || '0') || 0
          const escaleraB = parseInt(b.escalera || '0') || 0
          if (escaleraA !== escaleraB) return escaleraA - escaleraB
          
          const plantaA = a.planta === 'BJ' ? -1 : (parseInt(a.planta) || 0)
          const plantaB = b.planta === 'BJ' ? -1 : (parseInt(b.planta) || 0)
          if (plantaA !== plantaB) return plantaB - plantaA
          
          const puertaA = a.puerta || ''
          const puertaB = b.puerta || ''
          return puertaA.localeCompare(puertaB)
        })
        .map(item => item.originalIndex)
      
      // Encontrar posiciones en el array ordenado
      const currentPos = sortedIndices.indexOf(originalIndex)
      const lastPos = sortedIndices.indexOf(lastSelectedIndex)
      
      if (currentPos !== -1 && lastPos !== -1) {
        const start = Math.min(lastPos, currentPos)
        const end = Math.max(lastPos, currentPos)
        
        // Seleccionar todos los índices originales en el rango
        for (let i = start; i <= end; i++) {
          newSelected.add(sortedIndices[i])
        }
      }
      setLastSelectedIndex(originalIndex)
    } else {
      // Selección normal: toggle individual
      if (newSelected.has(originalIndex)) {
        newSelected.delete(originalIndex)
      } else {
        newSelected.add(originalIndex)
      }
      setLastSelectedIndex(originalIndex)
    }
    
    setSelectedInmuebles(newSelected)
  }

  const selectAllInmuebles = () => {
    const allIndices = new Set(inmuebles.map((_, index) => index))
    setSelectedInmuebles(allIndices)
    setLastSelectedIndex(inmuebles.length - 1)
  }

  const clearSelection = () => {
    setSelectedInmuebles(new Set())
    setLastSelectedIndex(null)
  }

  // Función para obtener estadísticas agrupadas por tipo de los inmuebles seleccionados
  const getSelectedStats = () => {
    if (selectedInmuebles.size === 0) return null

    const stats: Record<string, { count: number; superficie: number; color: string; icon: JSX.Element }> = {}
    
    Array.from(selectedInmuebles).forEach(index => {
      const inmueble = inmuebles[index]
      if (!inmueble) return
      
      const tipo = obtenerTipoInmueble(inmueble)
      const superficie = parseFloat(inmueble.superficie_m2) || 0
      
      if (!stats[tipo.nombre]) {
        stats[tipo.nombre] = {
          count: 0,
          superficie: 0,
          color: tipo.color,
          icon: tipo.icon
        }
      }
      
      stats[tipo.nombre].count++
      stats[tipo.nombre].superficie += superficie
    })
    
    return stats
  }

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

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
            <div className="animate-pulse">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-4">
                <svg className="animate-spin w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-600">Cargando información detallada del edificio...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Error al cargar información</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => fetchDetalleEdificio(refCatastral)} className="px-4 py-2">
              Reintentar
            </Button>
          </div>
        )}

        {/* Resultados - Inmuebles privados */}
        {!loading && !error && inmuebles.length > 0 && (
          <div className="space-y-6">
            
            {/* Información general del edificio */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-blue-900">
                      🏢 {formatearDireccion(edificioInfo)}
                    </h2>
                    <p className="text-xs text-blue-700">
                      {edificioInfo?.nombre_municipio}, {edificioInfo?.nombre_provincia} - CP: {edificioInfo?.cp}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">
                      {edificioInfo?.ano_construccion || 'N/A'}
                    </div>
                    <div className="text-xs text-blue-600">
                      Año construcción
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {/* Estadísticas principales en dos filas compactas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-gray-900">{inmuebles.length}</div>
                    <div className="text-xs text-gray-600">Privados</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-gray-900">
                      {inmuebles.reduce((sum, i) => sum + (parseFloat(i.superficie_m2) || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">m² Privados</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-gray-900">{elementosComunes.length}</div>
                    <div className="text-xs text-gray-600">Comunes</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-gray-900">
                      {elementosComunes.reduce((sum, i) => sum + (parseFloat(i.superficie_m2) || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">m² Comunes</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Mapa de ubicación */}
            {inmuebles.length > 0 && edificioInfo && (
              <MapComponent
                address={formatearDireccion(edificioInfo)}
                municipio={edificioInfo?.nombre_municipio || 'Madrid'}
                provincia={edificioInfo?.nombre_provincia || 'Madrid'}
              />
            )}

            {/* Controles de selección y filtros */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                    Inmuebles del Edificio ({inmuebles.length})
                  </h3>
                  
                  {/* Estadísticas por tipo cuando hay selección */}
                  {selectedInmuebles.size > 0 && (() => {
                    const stats = getSelectedStats()
                    return stats ? (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(stats).map(([tipo, data]) => (
                            <div 
                              key={tipo}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${data.color}`}
                            >
                              <div className="w-3 h-3 flex-shrink-0">
                                {data.icon}
                              </div>
                              <span>
                                {data.count} {tipo}{data.count > 1 ? 's' : ''}
                              </span>
                              <span className="text-xs opacity-75">
                                ({data.superficie.toLocaleString()} m²)
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Total seleccionado: {selectedInmuebles.size} inmuebles • {Array.from(selectedInmuebles)
                            .reduce((sum, index) => sum + (parseFloat(inmuebles[index]?.superficie_m2) || 0), 0)
                            .toLocaleString()} m²
                        </p>
                      </div>
                    ) : null
                  })()}
                  
                  {/* Información cuando no hay selección */}
                  {selectedInmuebles.size === 0 && (
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <p className="text-sm text-gray-600">
                        Haz clic en las filas para seleccionar inmuebles
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <kbd className="px-2 py-1 bg-gray-100 rounded font-mono">Click</kbd>
                        <span>Selección individual</span>
                        <kbd className="px-2 py-1 bg-gray-100 rounded font-mono">Shift+Click</kbd>
                        <span>Selección múltiple</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={selectAllInmuebles}
                    className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Todos
                  </Button>
                  {selectedInmuebles.size > 0 && (
                    <Button
                      onClick={clearSelection}
                      className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabla compacta de inmuebles */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto" style={{ minWidth: '800px' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedInmuebles.size === inmuebles.length && inmuebles.length > 0}
                          onChange={(e) => e.target.checked ? selectAllInmuebles() : clearSelection()}
                          className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                        />
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Esc
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Planta
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puerta
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        m²
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inmuebles
                      .map((inmueble, originalIndex) => ({ ...inmueble, originalIndex }))
                      .sort((a, b) => {
                        // Ordenar por: escalera, planta (desc), puerta
                        const escaleraA = parseInt(a.escalera || '0') || 0
                        const escaleraB = parseInt(b.escalera || '0') || 0
                        if (escaleraA !== escaleraB) return escaleraA - escaleraB
                        
                        const plantaA = a.planta === 'BJ' ? -1 : (parseInt(a.planta) || 0)
                        const plantaB = b.planta === 'BJ' ? -1 : (parseInt(b.planta) || 0)
                        if (plantaA !== plantaB) return plantaB - plantaA
                        
                        const puertaA = a.puerta || ''
                        const puertaB = b.puerta || ''
                        return puertaA.localeCompare(puertaB)
                      })
                      .map((inmueble, index) => {
                        const tipo = obtenerTipoInmueble(inmueble)
                        const isSelected = selectedInmuebles.has(inmueble.originalIndex)
                        
                        return (
                          <tr
                            key={inmueble.originalIndex}
                            className={`cursor-pointer transition-colors duration-150 hover:bg-gray-50 ${
                              isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                            onClick={(e) => toggleInmuebleSelection(inmueble.originalIndex, e.shiftKey)}
                          >
                            {/* Checkbox */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // Manejado por el onClick del tr
                                className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            
                            {/* Tipo con icono y color */}
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-medium ${tipo.color}`}>
                                <div className="w-3 h-3 flex-shrink-0">
                                  {tipo.icon}
                                </div>
                                <span className="truncate" title={tipo.nombre}>
                                  {tipo.nombre}
                                </span>
                              </div>
                            </td>
                            
                            {/* Escalera */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                                {inmueble.escalera || '-'}
                              </span>
                            </td>
                            
                            {/* Planta */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                inmueble.planta === 'BJ' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {inmueble.planta === 'BJ' ? 'B' : inmueble.planta || '-'}
                              </span>
                            </td>
                            
                            {/* Puerta */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                {inmueble.puerta || '-'}
                              </span>
                            </td>
                            
                            {/* Superficie */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-gray-900">
                                {parseFloat(inmueble.superficie_m2)?.toLocaleString() || 0}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
              
              {/* Footer con estadísticas */}
              <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    {selectedInmuebles.size > 0 
                      ? `${selectedInmuebles.size}/${inmuebles.length} seleccionados`
                      : `${inmuebles.length} inmuebles`
                    }
                  </span>
                  {selectedInmuebles.size > 0 && (
                    <span className="font-medium">
                      {Array.from(selectedInmuebles)
                        .reduce((sum, index) => sum + (parseFloat(inmuebles[index]?.superficie_m2) || 0), 0)
                        .toLocaleString()} m²
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* No hay inmuebles privados, pero sí elementos comunes */}
        {!loading && !error && inmuebles.length === 0 && elementosComunes.length > 0 && (
          <div className="space-y-6">
            {/* Información general del edificio con elementos comunes */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
                <h2 className="text-xl font-semibold text-orange-900">
                  🏢 Edificio con elementos comunes únicamente
                </h2>
                <p className="text-sm text-orange-700">
                  Referencia catastral: {refCatastral}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{elementosComunes.length}</div>
                    <div className="text-sm text-gray-600">Registros de elementos comunes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {elementosComunes.reduce((sum, i) => sum + (parseFloat(i.superficie_m2) || 0), 0).toLocaleString()} m²
                    </div>
                    <div className="text-sm text-gray-600">Superficie de elementos comunes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {edificioInfo?.ano_construccion || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Año construcción</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-orange-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-orange-900">
                        Información importante
                      </h4>
                      <div className="mt-2 text-sm text-orange-800">
                        <p>Esta referencia catastral corresponde únicamente a <strong>elementos comunes</strong> del edificio.</p>
                        <p className="mt-1">No se han encontrado inmuebles privados (viviendas, locales, etc.) asociados a esta referencia.</p>
                        <p className="mt-2">Esto puede ocurrir cuando:</p>
                        <ul className="mt-1 ml-4 list-disc">
                          <li>La referencia corresponde solo a zonas comunes</li>
                          <li>Los inmuebles privados tienen referencias catastrales diferentes</li>
                          <li>El edificio está en proceso de actualización catastral</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles de elementos comunes */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Detalles de elementos comunes</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Superficie unitaria:</span>
                        <span className="ml-2 text-gray-900">{parseFloat(elementosComunes[0]?.superficie_m2)?.toFixed(2) || 'N/A'} m²</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Tipo de uso:</span>
                        <span className="ml-2 text-gray-900">{elementosComunes[0]?.uso_principal || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Número de registros:</span>
                        <span className="ml-2 text-gray-900">{elementosComunes.length}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Superficie total:</span>
                        <span className="ml-2 text-gray-900">
                          {(parseFloat(elementosComunes[0]?.superficie_m2) * elementosComunes.length)?.toFixed(2) || 'N/A'} m²
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No hay resultados en absoluto */}
        {!loading && !error && inmuebles.length === 0 && elementosComunes.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">
              No se encontraron datos
            </h3>
            <p className="text-red-700">
              No hay información catastral disponible para la referencia: {refCatastral}
            </p>
          </div>
        )}

      </main>
    </div>
  )
}