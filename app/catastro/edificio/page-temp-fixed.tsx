'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Toast } from "@/components/ui/Toast"
import { jsPDF } from "jspdf"
import { MapComponent } from "@/app/catastro/components/MapComponent"
import autoTable from 'jspdf-autotable'
import { generateCompleteReport } from '@/lib/pdfGenerator'
import { EdificioInfo, InmuebleDetalle } from '@/lib/types/catastro'

export default function EdificioDetalle() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const refCatastral = searchParams.get('ref')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [edificioInfo, setEdificioInfo] = useState<EdificioInfo | null>(null)
  const [inmuebles, setInmuebles] = useState<InmuebleDetalle[]>([])
  const [selectedInmuebles, setSelectedInmuebles] = useState<Set<number>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const formatearDireccion = (info: EdificioInfo | null): string => {
    if (!info) return 'Dirección no disponible'
    
    const partes = [
      info.tipo_via || 'C/',
      info.nombre_via || 'Desconocida',
      info.num_policia_1 || 'S/N'
    ].filter(Boolean)
    
    return partes.join(' ')
  }

  const obtenerTipoInmueble = (usoTipo: string): string => {
    switch (usoTipo) {
      case 'VIVIENDA': return '🏠 Vivienda'
      case 'APARCAMIENTO': return '🚗 Aparcamiento'
      case 'ALMACEN': return '📦 Almacén'
      case 'CCE': return '🏪 Comercial'
      case 'ELEMENTOS COMUNES': return '🏢 Común'
      default: return '❓ Otro'
    }
  }

  const fetchDetalleEdificio = async (refCatastral: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/catastro/edificio-detalle?ref=${encodeURIComponent(refCatastral)}`)
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        console.log('🔍 DATOS COMPLETOS DEL NUEVO BACKEND:', data.data)
        
        // Filtrar solo elementos privados (no comunes) para la lista de inmuebles
        const elementosPrivados = data.data.filter((item: InmuebleDetalle) => 
          item.uso_principal !== 'ELEMENTOS COMUNES'
        )
        
        // Crear información del edificio simulada (mantener compatibilidad con diseño original)
        if (data.data.length > 0) {
          const primerElemento = data.data[0]
          setEdificioInfo({
            ref_catastral: primerElemento.ref_catastral,
            nombre_municipio: 'Madrid',
            nombre_provincia: 'Madrid',
            cp: '28001', 
            tipo_via: 'C/',
            nombre_via: 'Ejemplo',
            num_policia_1: '1',
            anyo_antiguedad_bien: '2000'
          })
        }
        
        // Ordenar por escalera, planta y puerta
        const sortedInmuebles = [...elementosPrivados].sort((a, b) => {
          const escaleraA = parseInt(a.escalera || '0') || 0
          const escaleraB = parseInt(b.escalera || '0') || 0
          
          if (escaleraA !== escaleraB) {
            return escaleraA - escaleraB
          }
          
          const plantaA = a.planta === 'BJ' ? -1 : (parseInt(a.planta) || 0)
          const plantaB = b.planta === 'BJ' ? -1 : (parseInt(b.planta) || 0)
          
          if (plantaA !== plantaB) {
            return plantaB - plantaA
          }
          
          const puertaA = a.puerta || ''
          const puertaB = b.puerta || ''
          
          return puertaA.localeCompare(puertaB)
        })
        
        setInmuebles(sortedInmuebles)
        
        // Seleccionar automáticamente todos los elementos al cargar
        const allIndices = new Set<number>()
        for (let i = 0; i < sortedInmuebles.length; i++) {
          allIndices.add(i)
        }
        setSelectedInmuebles(allIndices)
        setLastSelectedIndex(sortedInmuebles.length - 1)

        showToast('success', `✅ ${sortedInmuebles.length} inmuebles cargados correctamente`)
      } else {
        throw new Error(data.message || 'No se pudieron cargar los datos del edificio')
      }
    } catch (error) {
      console.error('Error al obtener detalle del edificio:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      showToast('error', '❌ Error al cargar los datos del edificio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!refCatastral) {
      setError('No se proporcionó referencia catastral')
      setLoading(false)
      return
    }

    fetchDetalleEdificio(refCatastral)
  }, [refCatastral])

  const handleInmuebleClick = (originalIndex: number, event: React.MouseEvent) => {
    const { shiftKey } = event

    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(originalIndex, lastSelectedIndex)
      const end = Math.max(originalIndex, lastSelectedIndex)
      const newSelection = new Set(selectedInmuebles)
      
      for (let i = start; i <= end; i++) {
        if (selectedInmuebles.has(originalIndex)) {
          newSelection.delete(i)
        } else {
          newSelection.add(i)
        }
      }
      
      setSelectedInmuebles(newSelection)
    } else {
      const newSelection = new Set(selectedInmuebles)
      if (newSelection.has(originalIndex)) {
        newSelection.delete(originalIndex)
      } else {
        newSelection.add(originalIndex)
      }
      setSelectedInmuebles(newSelection)
    }

    setLastSelectedIndex(originalIndex)
  }

  const handleGenerarPDF = async () => {
    try {
      showToast('info', '📄 Generando informe PDF...')

      if (selectedInmuebles.size === 0) {
        showToast('error', '❌ Debe seleccionar al menos un inmueble')
        return
      }

      const inmueblesFiltrados = Array.from(selectedInmuebles)
        .sort((a, b) => a - b)
        .map(index => inmuebles[index])

      console.log('🏠 Inmuebles seleccionados para PDF:', inmueblesFiltrados)

      const blob = await generateCompleteReport(
        inmueblesFiltrados,
        edificioInfo || {
          ref_catastral: refCatastral || '',
          nombre_municipio: 'Madrid',
          nombre_provincia: 'Madrid',
          cp: '28001',
          tipo_via: 'C/',
          nombre_via: 'Ejemplo',
          num_policia_1: '1',
          anyo_antiguedad_bien: '2000'
        }
      )

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `informe-catastro-${refCatastral}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast('success', '✅ PDF generado correctamente')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      showToast('error', '❌ Error al generar el PDF')
    }
  }

  const handleSeleccionarTodos = () => {
    const allIndices = new Set<number>()
    for (let i = 0; i < inmuebles.length; i++) {
      allIndices.add(i)
    }
    setSelectedInmuebles(allIndices)
    setLastSelectedIndex(inmuebles.length - 1)
    showToast('info', `📋 ${inmuebles.length} inmuebles seleccionados`)
  }

  const handleDeseleccionarTodos = () => {
    setSelectedInmuebles(new Set())
    setLastSelectedIndex(null)
    showToast('info', '🗑️ Selección limpiada')
  }

  if (loading) {
    return <LoadingSpinner message="Cargando detalle del edificio..." />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-red-50 border-red-200">
          <h1 className="text-xl font-bold text-red-700 mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => router.push('/catastro')}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Volver al buscador
          </Button>
        </Card>
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
    )
  }

  if (!edificioInfo || inmuebles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-gray-600">No se encontraron datos para esta referencia catastral.</p>
          <Button 
            onClick={() => router.push('/catastro')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Volver al buscador
          </Button>
        </Card>
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
    )
  }

  // Cálculos para el análisis
  const superficiePrivada = inmuebles.reduce((sum, inmueble) => {
    const esEspacioComun = inmueble.uso_principal === 'ELEMENTOS COMUNES'
    return esEspacioComun ? sum : sum + inmueble.superficie_m2
  }, 0)

  const superficieTotal = inmuebles.reduce((sum, i) => sum + i.superficie_m2, 0)
  const porcentajePrivado = superficieTotal > 0 ? (superficiePrivada / superficieTotal * 100) : 0

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      {/* Header con información del edificio */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Detalle del Edificio
            </h1>
            <p className="text-lg text-gray-700">
              🏢 {formatearDireccion(edificioInfo)}
            </p>
            <p className="text-sm text-gray-600">
              Ref. Catastral: <span className="font-mono font-medium">{refCatastral}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">{inmuebles.length}</div>
            <div className="text-sm text-blue-600">Inmuebles</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleGenerarPDF}
            disabled={selectedInmuebles.size === 0}
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
          >
            📄 Generar PDF ({selectedInmuebles.size} seleccionados)
          </Button>
          <Button 
            onClick={handleSeleccionarTodos}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            ✅ Seleccionar Todos
          </Button>
          <Button 
            onClick={handleDeseleccionarTodos}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            🗑️ Limpiar Selección
          </Button>
          <Button 
            onClick={() => router.push('/catastro')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            🔍 Nuevo Búsqueda
          </Button>
        </div>
      </Card>

      {/* Análisis Superficie Privada vs Común */}
      {inmuebles.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🏢</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Análisis de Superficies</h3>
                <p className="text-sm text-gray-600">Distribución de espacios en el edificio</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{superficiePrivada.toLocaleString()} m²</div>
                <div className="text-sm text-green-600 font-medium">Superficie Privada</div>
                <div className="text-xs text-green-500 mt-1">{porcentajePrivado.toFixed(1)}% del total</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{(superficieTotal - superficiePrivada).toLocaleString()} m²</div>
                <div className="text-sm text-blue-600 font-medium">Superficie Común</div>
                <div className="text-xs text-blue-500 mt-1">{(100 - porcentajePrivado).toFixed(1)}% del total</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{superficieTotal.toLocaleString()} m²</div>
                <div className="text-sm text-purple-600 font-medium">Superficie Total</div>
                <div className="text-xs text-purple-500 mt-1">100% del edificio</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mapa de ubicación */}
      {inmuebles.length > 0 && (
        <MapComponent
          address={formatearDireccion(edificioInfo)}
          municipio={edificioInfo?.nombre_municipio || 'Madrid'}
          provincia={edificioInfo?.nombre_provincia || 'Madrid'}
        />
      )}

      {/* Información de inmuebles seleccionados */}
      {selectedInmuebles.size > 0 && (
        <div className="bg-white rounded-lg shadow-lg border border-blue-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📋</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Inmuebles Seleccionados</h3>
                <p className="text-sm text-blue-600">{selectedInmuebles.size} de {inmuebles.length} inmuebles</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{selectedInmuebles.size}</div>
                <div className="text-sm text-blue-600">Inmuebles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {Array.from(selectedInmuebles)
                    .reduce((sum, index) => sum + inmuebles[index].superficie_m2, 0)
                    .toLocaleString()} m²
                </div>
                <div className="text-sm text-blue-600">Superficie seleccionada</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {((Array.from(selectedInmuebles)
                    .reduce((sum, index) => sum + inmuebles[index].superficie_m2, 0) /
                    inmuebles.reduce((sum, i) => sum + i.superficie_m2, 0)) * 100
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
                    const tipoNombre = inmueble.uso_principal === 'VIVIENDA' ? 'Viviendas' : 
                                     inmueble.uso_principal === 'APARCAMIENTO' ? 'Aparcamientos' :
                                     inmueble.uso_principal === 'ALMACEN' ? 'Almacenes' :
                                     inmueble.uso_principal === 'CCE' ? 'Comerciales' :
                                     'Otros'
                    
                    if (!acc[tipoNombre]) {
                      acc[tipoNombre] = { cantidad: 0, superficie: 0 }
                    }
                    acc[tipoNombre].cantidad += 1
                    acc[tipoNombre].superficie += inmueble.superficie_m2
                    return acc
                  }, {} as Record<string, { cantidad: number; superficie: number }>)
                  
                  return Object.entries(tiposSeleccionados).map(([tipo, stats]) => (
                    <div key={tipo} className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                      <p className="text-lg font-semibold text-blue-900">{stats.cantidad}</p>
                      <p className="text-xs text-blue-600 font-medium">{tipo}</p>
                      <p className="text-xs text-blue-500 mt-1">{stats.superficie.toLocaleString()} m²</p>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de inmuebles */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🏠</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lista de Inmuebles</h3>
                <p className="text-sm text-gray-600">Haga clic para seleccionar • Shift+clic para selección múltiple</p>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {inmuebles.map((inmueble, index) => {
            const isSelected = selectedInmuebles.has(index)
            const tipo = obtenerTipoInmueble(inmueble.uso_principal)
            
            return (
              <div
                key={index}
                onClick={(e) => handleInmuebleClick(index, e)}
                className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  isSelected 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-inner' 
                    : 'hover:border-l-4 hover:border-l-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`text-2xl ${isSelected ? 'transform scale-110' : ''}`}>
                        {inmueble.escalera || 'N/A'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            Escalera {inmueble.escalera || 'N/A'} • Planta {inmueble.planta || 'N/A'} • Puerta {inmueble.puerta || 'N/A'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {inmueble.superficie_m2.toLocaleString()} m² • {tipo}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isSelected && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}