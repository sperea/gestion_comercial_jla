'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'

interface CalleResult {
  tipo_via: string
  nombre_via: string
  nombre_municipio: string
  nombre_provincia: string
}

interface InmuebleResult {
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

export default function CatastroPage() {
  const [calle, setCalle] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<CalleResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [calleSeleccionada, setCalleSeleccionada] = useState<number | null>(null)
  const [numeroCalle, setNumeroCalle] = useState('')
  
  // Estados para búsqueda de inmuebles
  const [loadingInmuebles, setLoadingInmuebles] = useState(false)
  const [errorInmuebles, setErrorInmuebles] = useState<string | null>(null)
  const [resultadosInmuebles, setResultadosInmuebles] = useState<InmuebleResult[]>([])
  const [hasBuscadoInmuebles, setHasBuscadoInmuebles] = useState(false)

  // Verificar si el botón debe estar habilitado
  const isSearchEnabled = calle.trim().length > 3

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isSearchEnabled) {
      return
    }

    setLoading(true)
    setError(null)
    setResultados([])
    setHasSearched(true)
    
    try {
      console.log('Buscando calle:', calle)
      
      // Realizar llamada autenticada a la API
      const response = await fetch(`/api/catastro/calles?q=${encodeURIComponent(calle.trim())}`, {
        method: 'GET',
        credentials: 'include', // Incluir cookies para autenticación
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No tienes permisos para acceder a esta información')
        } else if (response.status === 404) {
          throw new Error('No se encontraron resultados para tu búsqueda')
        } else {
          throw new Error(`Error del servidor: ${response.status}`)
        }
      }

      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        setResultados(data.data)
      } else if (Array.isArray(data)) {
        // Si la respuesta es directamente un array
        setResultados(data)
      } else {
        throw new Error('Formato de respuesta inesperado')
      }
      
    } catch (error) {
      console.error('Error en la búsqueda:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido en la búsqueda')
      setResultados([])
    } finally {
      setLoading(false)
    }
  }

  const handleCalleSelect = (resultado: CalleResult, index: number) => {
    console.log('Calle seleccionada:', resultado)
    
    // Si ya está seleccionada, la deseleccionamos
    if (calleSeleccionada === index) {
      setCalleSeleccionada(null)
      setNumeroCalle('')
    } else {
      // Seleccionamos la nueva calle
      setCalleSeleccionada(index)
      setNumeroCalle('')
    }
  }

  const handleNumeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (calleSeleccionada === null) {
      console.error('❌ No hay calle seleccionada')
      return
    }
    
    if (calleSeleccionada >= resultados.length || calleSeleccionada < 0) {
      console.error('❌ Índice de calle seleccionada fuera de rango:', calleSeleccionada, 'de', resultados.length)
      return
    }

    const calleActual = resultados[calleSeleccionada]
    
    if (!calleActual) {
      console.error('❌ No se pudo obtener los datos de la calle seleccionada')
      return
    }

    setLoadingInmuebles(true)
    setErrorInmuebles(null)
    setResultadosInmuebles([])
    setHasBuscadoInmuebles(true)
    
    try {
      console.log('Calle seleccionada:', calleSeleccionada)
      console.log('Búsqueda catastral para:', {
        calle: calleActual,
        numero: numeroCalle.trim()
      })
      console.log('📋 Detalles de calleActual:', {
        tipo_via: calleActual?.tipo_via,
        nombre_via: calleActual?.nombre_via,
        nombre_municipio: calleActual?.nombre_municipio,
        nombre_provincia: calleActual?.nombre_provincia
      })
      
      // Verificar que calleActual tiene las propiedades necesarias
      if (!calleActual || !calleActual.tipo_via || !calleActual.nombre_via || !calleActual.nombre_municipio || !calleActual.nombre_provincia) {
        throw new Error('Los datos de la calle seleccionada están incompletos')
      }
      
      // Construir parámetros para la llamada
      const params = new URLSearchParams({
        tipo_via: calleActual.tipo_via,
        nombre_via: calleActual.nombre_via,
        nombre_municipio: calleActual.nombre_municipio,
        nombre_provincia: calleActual.nombre_provincia,
      })
      
      // Añadir número solo si no está vacío
      if (numeroCalle.trim()) {
        params.set('numero', numeroCalle.trim())
      }
      
      console.log('Llamando a API inmuebles con parámetros:', params.toString())
      console.log('URL completa:', `/api/catastro/inmuebles?${params.toString()}`)
      
      // Realizar llamada autenticada a la API
      const response = await fetch(`/api/catastro/inmuebles?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No tienes permisos para acceder a la información catastral')
        } else if (response.status === 404) {
          throw new Error('No se encontraron inmuebles para los criterios especificados')
        } else {
          throw new Error(`Error del servidor: ${response.status}`)
        }
      }

      const data = await response.json()
      
      console.log('📋 Respuesta completa de la API:', data)
      console.log('📊 Tipo de respuesta:', typeof data)
      console.log('📈 Es array data:', Array.isArray(data))
      console.log('📈 Es array data.data:', Array.isArray(data?.data))
      
      if (data.success && Array.isArray(data.data)) {
        setResultadosInmuebles(data.data)
        console.log('✅ Inmuebles encontrados (success):', data.data.length)
      } else if (Array.isArray(data)) {
        setResultadosInmuebles(data)
        console.log('✅ Inmuebles encontrados (array directo):', data.length)
      } else {
        console.error('❌ Formato de respuesta inesperado:', data)
        throw new Error('Formato de respuesta inesperado')
      }
      
      // Scroll automático hasta los resultados
      setTimeout(() => {
        const resultadosElement = document.getElementById('resultados-inmuebles')
        if (resultadosElement) {
          resultadosElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
      
    } catch (error) {
      console.error('Error en la búsqueda de inmuebles:', error)
      setErrorInmuebles(error instanceof Error ? error.message : 'Error desconocido en la búsqueda de inmuebles')
      setResultadosInmuebles([])
      
      // Scroll automático también en caso de error
      setTimeout(() => {
        const resultadosElement = document.getElementById('resultados-inmuebles')
        if (resultadosElement) {
          resultadosElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } finally {
      setLoadingInmuebles(false)
    }
  }

  // Función para calcular estadísticas del edificio
  const calcularEstadisticasEdificio = (inmuebles: InmuebleResult[]) => {
    if (!inmuebles || inmuebles.length === 0) return null

    const primer = inmuebles[0]
    
    // Formatear el número de calle eliminando ceros a la izquierda
    const numeroFormateado = primer.num_policia_1 ? parseInt(primer.num_policia_1, 10).toString() : ''
    const letraFormateada = primer.letra_1 && primer.letra_1.trim() ? ` ${primer.letra_1.trim()}` : ''
    
    const direccionCompleta = `${primer.tipo_via} ${primer.nombre_via} ${numeroFormateado}${letraFormateada}`
    
    const tiposCounts = inmuebles.reduce((acc, inmueble) => {
      const tipo = inmueble.clave_grupo_bice_o_uso
      const tipoNombre = tipo === 'V' ? 'Viviendas' : 
                       tipo === 'C' ? 'Comerciales' :
                       tipo === 'O' ? 'Oficinas' :
                       tipo === 'A' ? 'Almacenes' :
                       'Otros'
      acc[tipoNombre] = (acc[tipoNombre] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const superficieTotal = inmuebles.reduce((sum, inmueble) => {
      return sum + parseInt(inmueble.sup_inmueble_construido || '0')
    }, 0)

    const plantasUnicas = [...new Set(inmuebles.map(i => i.planta).filter(p => p && p.trim()))]
    const escalerasUnicas = [...new Set(inmuebles.map(i => i.escalera).filter(e => e && e.trim()))]

    return {
      direccion: direccionCompleta,
      municipio: `${primer.nombre_municipio}, ${primer.nombre_provincia}`,
      cp: primer.cp,
      totalInmuebles: inmuebles.length,
      tiposCounts,
      superficieTotal,
      añoConstruccion: primer.anyo_antiguedad_bien,
      totalPlantas: plantasUnicas.length,
      totalEscaleras: escalerasUnicas.length,
      refCatastral: primer.ref_catastral
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título de la página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Búsqueda Catastral
          </h1>
          <p className="text-gray-600">
            Introduce una dirección para obtener información catastral
          </p>
        </div>

        {/* Barra de búsqueda destacada */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-8">
          <form onSubmit={handleBuscar} className="space-y-6">
            {/* Instrucciones para el usuario */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Introduce una calle
              </h2>
              <p className="text-gray-600">
                Escribe el nombre de la calle que deseas buscar en el catastro. <b>No es necesario incluir tipo de vía, números o códigos postales.</b>
              </p>
            </div>

            {/* Campo de búsqueda */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    value={calle}
                    onChange={(e) => setCalle(e.target.value)}
                    placeholder="Ej: Calle Mayor, Avenida de la Constitución..."
                    className="text-lg p-4 h-14 pr-12"
                    required
                  />
                  {/* Indicador de caracteres */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {calle.length > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isSearchEnabled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {calle.length}/3
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                loading={loading}
                disabled={!isSearchEnabled || loading}
                className="px-8 h-14 text-lg font-semibold whitespace-nowrap"
              >
                <span className="flex items-center">
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {loading ? 'Buscando...' : 'Buscar'}
                </span>
              </Button>
            </div>
          </form>

          {/* Ejemplo de uso */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Ejemplos de búsqueda:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalle('Calle Mayor')}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  Calle Mayor
                </button>
                <button
                  type="button"
                  onClick={() => setCalle('Avenida de la Constitución')}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  Avenida de la Constitución
                </button>
                <button
                  type="button"
                  onClick={() => setCalle('Plaza de España')}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  Plaza de España
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Área de resultados */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
            <div className="animate-pulse">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-4">
                <svg className="animate-spin w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-600">Buscando información catastral...</p>
            </div>
          </div>
        )}

        {/* Mostrar error si existe */}
        {error && !loading && (
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-6">
            <div className="flex items-center text-red-600 mb-2">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Error en la búsqueda</span>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Mostrar resultados */}
        {!loading && !error && hasSearched && resultados.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Resultados encontrados ({resultados.length})
              </h3>
              <p className="text-sm text-gray-600">
                Haz clic en cualquier calle para ver más detalles
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {resultados.map((resultado, index) => (
                <div key={index}>
                  <button
                    onClick={() => handleCalleSelect(resultado, index)}
                    className={`w-full px-6 py-4 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors ${
                      calleSeleccionada === index ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-gray-900 mb-1">
                          {resultado.tipo_via} {resultado.nombre_via}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {resultado.nombre_municipio}
                          </span>
                          <span>{resultado.nombre_provincia}</span>
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                          calleSeleccionada === index ? 'rotate-90' : ''
                        }`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* Área expandida con campo de número */}
                  {calleSeleccionada === index && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <form onSubmit={handleNumeroSubmit} className="max-w-md">
                        <label htmlFor={`numero-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                          Número de la calle
                        </label>
                        <div className="flex gap-3">
                          <Input
                            id={`numero-${index}`}
                            type="text"
                            value={numeroCalle}
                            onChange={(e) => setNumeroCalle(e.target.value)}
                            placeholder="Ej: 123, 45B, 12-14..."
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            type="submit"
                            loading={loadingInmuebles}
                            disabled={loadingInmuebles}
                            className="px-4 py-2 whitespace-nowrap"
                          >
                            {loadingInmuebles ? 'Buscando...' : 'Buscar Catastro'}
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Introduce el número exacto del inmueble que deseas consultar
                        </p>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {!loading && !error && hasSearched && resultados.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600">
              Intenta con un término de búsqueda diferente o verifica la ortografía
            </p>
          </div>
        )}

        {/* Área de resultados de inmuebles */}
        
        {/* Loading de inmuebles */}
        {loadingInmuebles && (
          <div id="resultados-inmuebles" className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
            <div className="animate-pulse">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-4">
                <svg className="animate-spin w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-600">Buscando información catastral del inmueble...</p>
            </div>
          </div>
        )}

        {/* Error de inmuebles */}
        {errorInmuebles && !loadingInmuebles && (
          <div id="resultados-inmuebles" className="bg-white rounded-lg shadow-lg border border-red-200 p-6">
            <div className="flex items-center text-red-600 mb-2">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Error en la búsqueda catastral</span>
            </div>
            <p className="text-red-700">{errorInmuebles}</p>
          </div>
        )}

        {/* Resultados de inmuebles - Resumen del edificio */}
        {!loadingInmuebles && !errorInmuebles && hasBuscadoInmuebles && resultadosInmuebles.length > 0 && (() => {
          const estadisticas = calcularEstadisticasEdificio(resultadosInmuebles)
          if (!estadisticas) return null

          return (
            <div id="resultados-inmuebles" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  🏢 Edificio encontrado
                </h3>
                <p className="text-sm text-green-700">
                  Información catastral del edificio consultado
                </p>
              </div>
              
              {/* Información del edificio */}
              <div className="p-6">
                {/* Dirección principal */}
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {estadisticas.direccion}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {estadisticas.municipio}
                    </span>
                    <span>CP: {estadisticas.cp}</span>
                    {estadisticas.añoConstruccion && (
                      <span>Año: {estadisticas.añoConstruccion}</span>
                    )}
                  </div>
                </div>

                {/* Estadísticas del edificio */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Total de inmuebles */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total inmuebles</p>
                        <p className="text-2xl font-bold text-blue-900">{estadisticas.totalInmuebles}</p>
                      </div>
                      <div className="bg-blue-100 rounded-full p-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Superficie total */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Superficie total</p>
                        <p className="text-2xl font-bold text-green-900">{estadisticas.superficieTotal.toLocaleString()} m²</p>
                      </div>
                      <div className="bg-green-100 rounded-full p-2">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4m0 0V1m0 2h2m-6 8h6m-6 4h6m2 4H7a1 1 0 01-1-1v-4m8 0V9a1 1 0 00-1-1h-4m0 0V6m0 2H9" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Total plantas */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Plantas</p>
                        <p className="text-2xl font-bold text-purple-900">{estadisticas.totalPlantas}</p>
                      </div>
                      <div className="bg-purple-100 rounded-full p-2">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Total escaleras */}
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Escaleras</p>
                        <p className="text-2xl font-bold text-orange-900">{estadisticas.totalEscaleras}</p>
                      </div>
                      <div className="bg-orange-100 rounded-full p-2">
                        <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distribución por tipos de inmueble */}
                <div className="mb-6">
                  <h5 className="text-lg font-medium text-gray-900 mb-3">Distribución de inmuebles</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(estadisticas.tiposCounts).map(([tipo, cantidad]) => (
                      <div key={tipo} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-semibold text-gray-900">{cantidad}</p>
                        <p className="text-xs text-gray-600">{tipo}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Referencia catastral */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Referencia Catastral</h5>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <p className="text-sm font-mono text-gray-900 break-all">{estadisticas.refCatastral}</p>
                      <button
                        onClick={() => {
                          // Aquí irá la URL específica del catastro que me proporciones
                          console.log('Abrir detalle catastral para:', estadisticas.refCatastral)
                          // window.open('URL_DEL_CATASTRO', '_blank')
                        }}
                        className="ml-2 inline-flex items-center p-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        title="Ver en Web del Catastro"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">

                      <Button
                        onClick={() => {
                          // Construir la dirección de búsqueda
                          const calleResult = resultados[calleSeleccionada!]
                          const direccionBusqueda = `${calleResult.tipo_via} ${calleResult.nombre_via}${numeroCalle ? ' ' + numeroCalle : ''}`
                          window.location.href = `/catastro/edificio?ref=${encodeURIComponent(estadisticas.refCatastral)}&direccion_busqueda=${encodeURIComponent(direccionBusqueda)}`
                        }}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Ver DETALLE del edificio {estadisticas.refCatastral}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección técnica expandible */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <details className="group">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 flex items-center">
                    <svg className="w-4 h-4 mr-2 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Ver datos técnicos detallados
                  </summary>
                  <div className="mt-3">
                    <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-xs max-h-60 overflow-y-auto">
                      {JSON.stringify(resultadosInmuebles, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          )
        })()}

        {/* No se encontraron inmuebles */}
        {!loadingInmuebles && !errorInmuebles && hasBuscadoInmuebles && resultadosInmuebles.length === 0 && (
          <div id="resultados-inmuebles" className="bg-white rounded-lg shadow-lg border border-yellow-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-900 mb-2">
              No se encontraron inmuebles
            </h3>
            <p className="text-yellow-700">
              No hay información catastral disponible para los criterios especificados. 
              {numeroCalle.trim() ? ' Intenta sin especificar número o con un número diferente.' : ' Intenta especificando un número de calle.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}