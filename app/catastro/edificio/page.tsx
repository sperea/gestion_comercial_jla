'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface InmuebleDetalle {
  ref_catastral: string
  nombre_municipio: string
  nombre_provincia: string
  cp: string
  tipo_via: string
  nombre_via: string
  num_policia_1: string
  letra_1: string
  num_policia_2: string
  letra_2: string
  bloque: string
  escalera: string
  planta: string
  puerta: string
  anyo_antiguedad_bien: string
  sup_inmueble_construido: string
  clave_grupo_bice_o_uso: string
}

// Componente del mapa
function MapComponent({ address, municipio, provincia }: { address: string; municipio: string; provincia: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

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
          const searchAddress = `${address}, ${municipio}, ${provincia}, España`
          console.log('🗺️ Buscando coordenadas para:', searchAddress)
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
          )
          
          if (response.ok) {
            const results = await response.json()
            if (results && results.length > 0) {
              const { lat, lon } = results[0]
              const coords: [number, number] = [parseFloat(lat), parseFloat(lon)]
              
              console.log('🎯 Coordenadas encontradas:', coords)
              
              // Centrar el mapa en la ubicación encontrada
              mapInstance.current.setView(coords, 17)
              
              // Añadir marcador
              const marker = L.marker(coords).addTo(mapInstance.current)
              marker.bindPopup(`
                <div class="text-sm">
                  <strong>${address}</strong><br>
                  ${municipio}, ${provincia}
                </div>
              `).openPopup()
              
            } else {
              console.warn('⚠️ No se encontraron coordenadas para la dirección')
            }
          } else {
            console.error('❌ Error en la geocodificación')
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

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          🗺️ Ubicación del Edificio
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Mapa interactivo de la dirección catastral
        </p>
      </div>
      <div 
        ref={mapRef} 
        className="h-64 w-full"
        style={{ height: '300px' }}
      />
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
        setInmuebles(data.data)
      } else if (Array.isArray(data)) {
        setInmuebles(data)
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

  const formatearDireccion = (inmueble: InmuebleDetalle) => {
    const numero = inmueble.num_policia_1 ? parseInt(inmueble.num_policia_1, 10).toString() : ''
    const letra = inmueble.letra_1 && inmueble.letra_1.trim() ? ` ${inmueble.letra_1.trim()}` : ''
    return `${inmueble.tipo_via} ${inmueble.nombre_via} ${numero}${letra}`
  }

  const obtenerTipoInmueble = (clave: string) => {
    switch (clave) {
      case 'V': return { 
        nombre: 'Vivienda', 
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      }
      case 'C': return { 
        nombre: 'Comercial', 
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      }
      case 'O': return { 
        nombre: 'Oficina', 
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
          </svg>
        )
      }
      case 'A': return { 
        nombre: 'Almacén', 
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      }
      default: return { 
        nombre: 'Otro', 
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    }
  }

  const toggleInmuebleSelection = (originalIndex: number, shiftKey: boolean = false) => {
    const newSelected = new Set(selectedInmuebles)
    
    if (shiftKey && lastSelectedIndex !== null) {
      // Para selección múltiple, necesitamos trabajar con los índices en el orden mostrado
      const sortedIndices = inmuebles
        .map((inmueble, idx) => ({ originalIndex: idx, ...inmueble }))
        .sort((a, b) => {
          // Mismo ordenamiento que en el render
          const numA = a.num_policia_1 ? parseInt(a.num_policia_1) || 0 : 0
          const numB = b.num_policia_1 ? parseInt(b.num_policia_1) || 0 : 0
          if (numA !== numB) return numA - numB
          
          const plantaA = a.planta === 'BJ' ? -1 : (parseInt(a.planta) || 0)
          const plantaB = b.planta === 'BJ' ? -1 : (parseInt(b.planta) || 0)
          if (plantaA !== plantaB) return plantaA - plantaB
          
          const puertaA = a.puerta || ''
          const puertaB = b.puerta || ''
          if (puertaA !== puertaB) return puertaA.localeCompare(puertaB)
          
          const escaleraA = parseInt(a.escalera) || 0
          const escaleraB = parseInt(b.escalera) || 0
          if (escaleraA !== escaleraB) return escaleraA - escaleraB
          
          const bloqueA = parseInt(a.bloque) || 0
          const bloqueB = parseInt(b.bloque) || 0
          return bloqueA - bloqueB
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

        {/* Resultados */}
        {!loading && !error && inmuebles.length > 0 && (
          <div className="space-y-6">
            
            {/* Información general del edificio */}
            {inmuebles.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                  <h2 className="text-xl font-semibold text-blue-900">
                    🏢 {formatearDireccion(inmuebles[0])}
                  </h2>
                  <p className="text-sm text-blue-700">
                    {inmuebles[0].nombre_municipio}, {inmuebles[0].nombre_provincia} - CP: {inmuebles[0].cp}
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{inmuebles.length}</div>
                      <div className="text-sm text-gray-600">Total de inmuebles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {inmuebles.reduce((sum, i) => sum + parseInt(i.sup_inmueble_construido || '0'), 0).toLocaleString()} m²
                      </div>
                      <div className="text-sm text-gray-600">Superficie total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {inmuebles[0].anyo_antiguedad_bien || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Año construcción</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mapa de ubicación */}
            {inmuebles.length > 0 && (
              <MapComponent
                address={formatearDireccion(inmuebles[0])}
                municipio={inmuebles[0].nombre_municipio}
                provincia={inmuebles[0].nombre_provincia}
              />
            )}

            {/* Información de inmuebles seleccionados */}
            {selectedInmuebles.size > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-blue-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">
                        📊 Inmuebles Seleccionados
                      </h3>
                      <p className="text-sm text-blue-700">
                        Resumen de los {selectedInmuebles.size} inmueble{selectedInmuebles.size > 1 ? 's' : ''} que has seleccionado
                      </p>
                    </div>
                    <Button 
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        // TODO: Implementar lógica del informe
                        console.log('Generar informe para inmuebles:', selectedInmuebles)
                      }}
                    >
                      📋 MOSTRAR INFORME DE LA SELECCIÓN
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">{selectedInmuebles.size}</div>
                      <div className="text-sm text-blue-600">Inmuebles seleccionados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {Array.from(selectedInmuebles)
                          .reduce((sum, index) => sum + parseInt(inmuebles[index].sup_inmueble_construido || '0'), 0)
                          .toLocaleString()} m²
                      </div>
                      <div className="text-sm text-blue-600">Superficie seleccionada</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {((Array.from(selectedInmuebles)
                          .reduce((sum, index) => sum + parseInt(inmuebles[index].sup_inmueble_construido || '0'), 0) /
                          inmuebles.reduce((sum, i) => sum + parseInt(i.sup_inmueble_construido || '0'), 0)) * 100
                        ).toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-600">% del total</div>
                    </div>
                  </div>

                  {/* Desglose por tipo de inmueble seleccionado */}
                  <div className="mt-6 pt-6 border-t border-blue-100">
                    <h4 className="text-sm font-medium text-blue-800 mb-3">Desglose por tipo:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(() => {
                        const tiposSeleccionados = Array.from(selectedInmuebles).reduce((acc, index) => {
                          const inmueble = inmuebles[index]
                          const tipo = inmueble.clave_grupo_bice_o_uso
                          const tipoNombre = tipo === 'V' ? 'Viviendas' : 
                                           tipo === 'C' ? 'Comerciales' :
                                           tipo === 'O' ? 'Oficinas' :
                                           tipo === 'A' ? 'Almacenes' :
                                           'Otros'
                          acc[tipoNombre] = (acc[tipoNombre] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                        
                        return Object.entries(tiposSeleccionados).map(([tipo, cantidad]) => (
                          <div key={tipo} className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                            <p className="text-lg font-semibold text-blue-900">{cantidad}</p>
                            <p className="text-xs text-blue-600">{tipo}</p>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controles de selección */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Inmuebles del Edificio ({inmuebles.length})
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedInmuebles.size > 0 
                      ? `${selectedInmuebles.size} inmueble${selectedInmuebles.size > 1 ? 's' : ''} seleccionado${selectedInmuebles.size > 1 ? 's' : ''}`
                      : 'Selecciona los inmuebles que deseas consultar'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 <span className="font-medium">Tip:</span> Mantén presionada la tecla <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs font-mono">Shift</kbd> para seleccionar múltiples inmuebles de una vez
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={selectAllInmuebles}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700"
                  >
                    Seleccionar todos
                  </Button>
                  {selectedInmuebles.size > 0 && (
                    <Button
                      onClick={clearSelection}
                      className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700"
                    >
                      Limpiar selección
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Mosaico de cards de inmuebles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {inmuebles
                .map((inmueble, originalIndex) => ({ ...inmueble, originalIndex }))
                .sort((a, b) => {
                  // Ordenar por: número, planta, letra, escalera, bloque
                  
                  // 1. Por número de policía
                  const numA = a.num_policia_1 ? parseInt(a.num_policia_1) || 0 : 0
                  const numB = b.num_policia_1 ? parseInt(b.num_policia_1) || 0 : 0
                  if (numA !== numB) return numA - numB
                  
                  // 2. Por planta
                  const plantaA = a.planta === 'BJ' ? -1 : (parseInt(a.planta) || 0)
                  const plantaB = b.planta === 'BJ' ? -1 : (parseInt(b.planta) || 0)
                  if (plantaA !== plantaB) return plantaA - plantaB
                  
                  // 3. Por letra/puerta
                  const puertaA = a.puerta || ''
                  const puertaB = b.puerta || ''
                  if (puertaA !== puertaB) return puertaA.localeCompare(puertaB)
                  
                  // 4. Por escalera
                  const escaleraA = parseInt(a.escalera) || 0
                  const escaleraB = parseInt(b.escalera) || 0
                  if (escaleraA !== escaleraB) return escaleraA - escaleraB
                  
                  // 5. Por bloque
                  const bloqueA = parseInt(a.bloque) || 0
                  const bloqueB = parseInt(b.bloque) || 0
                  return bloqueA - bloqueB
                })
                .map((inmueble, index) => {
                const tipo = obtenerTipoInmueble(inmueble.clave_grupo_bice_o_uso)
                const isSelected = selectedInmuebles.has(inmueble.originalIndex)
                
                return (
                  <div
                    key={inmueble.originalIndex}
                    className={`relative rounded-lg border-2 transition-all duration-200 cursor-pointer select-none transform hover:scale-105 ${
                      isSelected 
                        ? 'bg-blue-100 border-blue-500 shadow-lg ring-2 ring-blue-300 scale-105' 
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={(e) => toggleInmuebleSelection(inmueble.originalIndex, e.shiftKey)}
                  >

                    {/* Indicador de selección en esquina */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                    )}

                    <div className="p-3">
                      {/* Header compacto con icono, tipo y número */}
                      <div className={`flex items-center gap-2 mb-2 p-2 rounded transition-all duration-200 ${
                        isSelected 
                          ? tipo.color.replace('50', '200').replace('100', '300') // Colores más intensos cuando está seleccionado
                          : tipo.color
                      }`}>
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5">{tipo.icon}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-xs truncate">{tipo.nombre}</h4>
                            <div className="flex items-center ml-2">
                              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                {inmueble.num_policia_1 ? parseInt(inmueble.num_policia_1, 10) : 'S/N'}
                              </span>
                              {inmueble.letra_1 && inmueble.letra_1.trim() && (
                                <span className="text-xs ml-1 font-semibold">{inmueble.letra_1.trim()}</span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs opacity-75 truncate">
                            {parseInt(inmueble.sup_inmueble_construido || '0').toLocaleString()} m²
                          </p>
                        </div>
                      </div>

                      {/* Ubicación ultra-compacta */}
                                    {/* Ubicación ultra-compacta con iconos representativos */}
              <div className="flex flex-wrap gap-1 text-xs">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 flex items-center gap-1" title="Planta">
                  <span className="text-xs">⬆</span>{inmueble.planta === 'BJ' ? 'B' : inmueble.planta || 'N/A'}
                </span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600" title="Letra/Puerta">
                  {inmueble.puerta || 'N/A'}
                </span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 flex items-center gap-1" title="Escalera">
                  <span className="text-xs">↗</span>E{inmueble.escalera || 'N/A'}
                </span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 flex items-center gap-1" title="Bloque">
                  <span className="text-xs">🏢</span>Bl{inmueble.bloque || 'N/A'}
                </span>
              </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Acciones con inmuebles seleccionados */}
            {selectedInmuebles.size > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Acciones con {selectedInmuebles.size} inmueble{selectedInmuebles.size > 1 ? 's' : ''} seleccionado{selectedInmuebles.size > 1 ? 's' : ''}
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700">
                    📊 Generar informe
                  </Button>
                  <Button className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700">
                    📋 Exportar datos
                  </Button>
                  <Button className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700">
                    📧 Enviar por email
                  </Button>
                  <Button className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700">
                    🔍 Análisis comparativo
                  </Button>
                </div>
              </div>
            )}

            {/* Datos técnicos completos */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <details className="group">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 flex items-center">
                    <svg className="w-4 h-4 mr-2 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Ver datos técnicos completos (JSON)
                  </summary>
                  <div className="mt-4">
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs max-h-96 overflow-y-auto">
                      {JSON.stringify(inmuebles, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>

          </div>
        )}

        {/* No hay resultados */}
        {!loading && !error && inmuebles.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-yellow-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-900 mb-2">
              No se encontraron datos
            </h3>
            <p className="text-yellow-700">
              No hay información disponible para la referencia catastral: {refCatastral}
            </p>
          </div>
        )}

      </main>
    </div>
  )
}