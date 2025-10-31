'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

// Interfaz para el nuevo endpoint
interface InmuebleDetalle {
  ref_catastral: string
  uso_principal: "VIVIENDA" | "ALMACEN" | "APARCAMIENTO" | "CCE" | "ELEMENTOS COMUNES" | string
  escalera: string
  planta: string
  puerta: string
  superficie_m2: number
  tipo_reforma: string
  fecha_reforma: string
}

export default function EdificioDetallePageNewAPI() {
  const searchParams = useSearchParams()
  const refCatastral = searchParams.get('ref')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [elementos, setElementos] = useState<InmuebleDetalle[]>([])
  const [selectedElementos, setSelectedElementos] = useState<Set<number>>(new Set())

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
        throw new Error(`Error del servidor: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        console.log('🔍 DATOS NUEVO ENDPOINT:', data.data)
        
        setElementos(data.data)
        
        // Seleccionar automáticamente elementos privados (no comunes)
        const elementosPrivados = data.data
          .map((elem: InmuebleDetalle, index: number) => ({ elem, index }))
          .filter(({ elem }: { elem: InmuebleDetalle, index: number }) => elem.uso_principal !== 'ELEMENTOS COMUNES')
          .map(({ index }: { elem: InmuebleDetalle, index: number }) => index)
        
        setSelectedElementos(new Set(elementosPrivados))
        
        console.log('✅ Datos cargados correctamente')
      } else {
        throw new Error(data.error || 'Respuesta inválida del servidor')
      }
    } catch (err) {
      console.error('❌ Error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const toggleElemento = (index: number) => {
    setSelectedElementos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del edificio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button 
            onClick={() => refCatastral && fetchDetalleEdificio(refCatastral)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Análisis de elementos seleccionados
  const analisisPorUso = Array.from(selectedElementos).reduce((acc, index) => {
    const elemento = elementos[index]
    if (!elemento) return acc

    if (!acc[elemento.uso_principal]) {
      acc[elemento.uso_principal] = { cantidad: 0, superficie: 0 }
    }
    
    acc[elemento.uso_principal].cantidad += 1
    acc[elemento.uso_principal].superficie += elemento.superficie_m2
    
    return acc
  }, {} as Record<string, { cantidad: number; superficie: number }>)

  const totalSuperficie = Array.from(selectedElementos)
    .reduce((sum, index) => sum + (elementos[index]?.superficie_m2 || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Detalle del Edificio (Nueva API)
          </h1>
          <p className="text-sm text-blue-600">
            Referencia Catastral: {refCatastral}
          </p>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Total elementos: </span>
              <span className="text-blue-600">{elementos.length}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Seleccionados: </span>
              <span className="text-green-600">{selectedElementos.size}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Superficie total: </span>
              <span className="text-purple-600">{totalSuperficie.toLocaleString()} m²</span>
            </div>
          </div>
        </div>

        {/* Análisis por uso */}
        {selectedElementos.size > 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Análisis por uso principal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analisisPorUso).map(([uso, stats]) => {
                const colorClasses = {
                  'VIVIENDA': 'bg-blue-50 border-blue-200 text-blue-800',
                  'APARCAMIENTO': 'bg-gray-50 border-gray-200 text-gray-800', 
                  'ALMACEN': 'bg-orange-50 border-orange-200 text-orange-800',
                  'CCE': 'bg-purple-50 border-purple-200 text-purple-800',
                  'ELEMENTOS COMUNES': 'bg-green-50 border-green-200 text-green-800'
                }[uso] || 'bg-gray-50 border-gray-200 text-gray-800'
                
                return (
                  <div key={uso} className={`rounded-lg p-4 border ${colorClasses}`}>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats.cantidad}</p>
                      <p className="text-sm font-medium">{uso}</p>
                      <p className="text-xs mt-1">{stats.superficie.toLocaleString()} m²</p>
                      <p className="text-xs opacity-75">
                        Promedio: {Math.round(stats.superficie / stats.cantidad)} m²/unidad
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lista de elementos */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Lista de elementos ({elementos.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {elementos.map((elemento, index) => {
              const isSelected = selectedElementos.has(index)
              const isComun = elemento.uso_principal === 'ELEMENTOS COMUNES'
              
              return (
                <div
                  key={index}
                  onClick={() => toggleElemento(index)}
                  className={`
                    relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-50 border-blue-500 shadow-lg ring-2 ring-blue-200' 
                      : isComun 
                        ? 'bg-green-50 border-green-300 hover:border-green-400'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${elemento.uso_principal === 'VIVIENDA' ? 'bg-blue-100 text-blue-800' :
                          elemento.uso_principal === 'APARCAMIENTO' ? 'bg-gray-100 text-gray-800' :
                          elemento.uso_principal === 'ALMACEN' ? 'bg-orange-100 text-orange-800' :
                          elemento.uso_principal === 'CCE' ? 'bg-purple-100 text-purple-800' :
                          elemento.uso_principal === 'ELEMENTOS COMUNES' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {elemento.uso_principal}
                      </span>
                      <span className="text-lg font-bold text-gray-700">
                        {elemento.superficie_m2.toLocaleString()} m²
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      {elemento.escalera && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                          Esc: {elemento.escalera}
                        </span>
                      )}
                      {elemento.planta && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                          Pl: {elemento.planta}
                        </span>
                      )}
                      {elemento.puerta && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                          Pta: {elemento.puerta}
                        </span>
                      )}
                    </div>
                    
                    {elemento.tipo_reforma && elemento.fecha_reforma && elemento.fecha_reforma !== '0000' && (
                      <div className="text-xs text-gray-500">
                        Reforma {elemento.tipo_reforma} ({elemento.fecha_reforma})
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
      </div>
    </div>
  )
}