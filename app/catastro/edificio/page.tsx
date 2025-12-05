'use client'

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import dynamic from 'next/dynamic'

// Importar el mapa dinámicamente para evitar errores de SSR
const MapaUbicacion = dynamic(() => import('./MapaUbicacion'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-gray-100 rounded">Cargando mapa...</div>
}) as React.ComponentType<{
  coord_wgs84: {
    lat: number
    lng: number
    zoom_level: number
  } | null
  ref_catastral: string
}>

// Interfaz para el resumen del edificio según API (nuevo formato del backend)
interface EdificioResumen {
  ref_catastral_base: string
  coord_x: string | null
  coord_y: string | null
  coord_wgs84: {
    lat: number
    lng: number
    zoom_level: number
  } | null
  total_inmuebles: number
  superficie_total: number
  distribucion: {
    viviendas: number
    locales: number
    garajes: number
    comercial: number
    oficinas: number
    otros: number
  }
  plantas: number
  plantas_sobre_rasante: number
  plantas_bajo_rasante: number
  escaleras: number
  bloques: number
  anyo_construccion: number | null
  anyo_reforma: number | null
  direccion: {
    tipo_via: string
    nombre_via: string
    numero: number
    municipio: string
    provincia: string
    cp: number
  } | string
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
  const direccionBusqueda = searchParams.get('direccion_busqueda') // Nueva parámetro
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [edificioData, setEdificioData] = useState<EdificioResumen | null>(null)
  const [inmuebles, setInmuebles] = useState<InmuebleDetalle[]>([])
  const [selectedInmuebles, setSelectedInmuebles] = useState<Set<number>>(new Set())
  const [loadingInmuebles, setLoadingInmuebles] = useState(false)
  const [errorInmuebles, setErrorInmuebles] = useState<string | null>(null)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InmuebleDetalle | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

  // useMemo debe ir antes de cualquier return condicional
  const tiposPropiedad = useMemo(() => {
    console.log('🔄 useMemo ejecutándose...')
    console.log('🏢 edificioData completo:', edificioData)
    
    if (!edificioData?.distribucion || edificioData.superficie_total === undefined) {
      console.log('⚠️ No hay datos de distribución disponibles o datos incompletos')
      console.log('📦 edificioData:', edificioData)
      return []
    }

    const dist = edificioData.distribucion
    const superficiePorUnidad = edificioData.superficie_total / Math.max(edificioData.total_inmuebles, 1)
    
    console.log('📊 Distribución recibida:', dist)
    console.log('📏 Superficie por unidad:', superficiePorUnidad)
    console.log('🏠 Tipos individuales:', {
      viviendas: dist.viviendas,
      locales: dist.locales,
      garajes: dist.garajes,
      comercial: dist.comercial,
      oficinas: dist.oficinas,
      otros: dist.otros
    })
    
    const tipos = [
      { 
        nombre: 'Viviendas', 
        m2: Math.round(dist.viviendas * superficiePorUnidad), 
        num: dist.viviendas || 0, 
        color: 'border-blue-300 bg-blue-50',
        icon: '🏠'
      },
      { 
        nombre: 'Locales', 
        m2: Math.round(dist.locales * superficiePorUnidad), 
        num: dist.locales || 0, 
        color: 'border-green-300 bg-green-50',
        icon: '🏪'
      },
      { 
        nombre: 'Garajes', 
        m2: Math.round(dist.garajes * superficiePorUnidad), 
        num: dist.garajes || 0, 
        color: 'border-gray-300 bg-gray-50',
        icon: '🚗'
      },
      { 
        nombre: 'Comercial', 
        m2: Math.round(dist.comercial * superficiePorUnidad), 
        num: dist.comercial || 0, 
        color: 'border-purple-300 bg-purple-50',
        icon: '🛍️'
      },
      { 
        nombre: 'Oficinas', 
        m2: Math.round(dist.oficinas * superficiePorUnidad), 
        num: dist.oficinas || 0, 
        color: 'border-indigo-300 bg-indigo-50',
        icon: '🏢'
      },
      { 
        nombre: 'Otros', 
        m2: Math.round(dist.otros * superficiePorUnidad), 
        num: dist.otros || 0, 
        color: 'border-orange-300 bg-orange-50',
        icon: '📦'
      }
    ]

    console.log('📋 Todos los tipos generados:', tipos.map(t => `${t.nombre}: ${t.num} (${t.m2}m²)`))
    
    // Filtrar solo tipos que tienen datos > 0
    const tiposConDatos = tipos.filter(tipo => tipo.num > 0)
    console.log('📋 Tipos con datos > 0:', tiposConDatos.length, tiposConDatos.map(t => `${t.nombre}: ${t.num}`))
    console.log('📋 Tipos finales a mostrar:', tiposConDatos)
    
    return tiposConDatos
  }, [edificioData])

  useEffect(() => {
    if (!refCatastral) {
      setError('No se proporcionó referencia catastral')
      setLoading(false)
      return
    }

    fetchDetalleEdificio(refCatastral)
  }, [refCatastral]) // eslint-disable-line react-hooks/exhaustive-deps

  // useEffect para debug de dirección
  useEffect(() => {
    if (edificioData) {
      console.log('✅ Datos del edificio recibidos:', edificioData)
      console.log('📍 Dirección:', edificioData.direccion)
      console.log('📊 Distribución:', edificioData.distribucion)
    }
  }, [edificioData])

  // Debug de tiposPropiedad
  useEffect(() => {
    console.log('🔍 [RENDER] tiposPropiedad length:', tiposPropiedad.length)
    console.log('🔍 [RENDER] tiposPropiedad data:', tiposPropiedad)
    console.log('🔍 [RENDER] edificioData existe:', !!edificioData)
    console.log('🔍 [RENDER] distribución existe:', !!edificioData?.distribucion)
  }, [tiposPropiedad, edificioData])

  // Función para construir la dirección completa a partir de los datos del edificio
  const construirDireccionCompleta = useCallback((datos: EdificioResumen): string => {
    if (!datos.direccion) return ''
    
    // Si la dirección ya es un string, devolverla directamente
    if (typeof datos.direccion === 'string') {
      return datos.direccion
    }
    
    const dir = datos.direccion
    const partes: string[] = []
    
    // Tipo de vía y nombre
    if (dir.tipo_via && dir.nombre_via) {
      partes.push(`${dir.tipo_via} ${dir.nombre_via}`)
    }
    
    // Número
    if (dir.numero) {
      const numeroStr = String(dir.numero)
      // Quitar decimales .00 si existen
      const numeroLimpio = numeroStr.replace(/\.0+$/, '')
      partes.push(numeroLimpio)
    }
    
    // Código postal y municipio
    const ubicacion = []
    if (dir.cp) {
      ubicacion.push(String(dir.cp))
    }
    if (dir.municipio) {
      ubicacion.push(dir.municipio)
    }
    if (dir.provincia && dir.provincia !== dir.municipio) {
      ubicacion.push(`(${dir.provincia})`)
    }
    
    const direccionBase = partes.join(' ')
    const ubicacionCompleta = ubicacion.join(' ')
    
    return `${direccionBase}${ubicacionCompleta ? ', ' + ubicacionCompleta : ''}`
  }, [])

  const fetchDetalleEdificio = useCallback(async (refcat: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🏢 Obteniendo datos del edificio (endpoint optimizado) para referencia:', refcat)

      const response = await fetch(`/api/catastro/edificio-general?refcat=${encodeURIComponent(refcat)}`, {
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
        console.log('✅ Datos generales del edificio cargados (endpoint optimizado - sin inmuebles):', data)
        console.log('📊 Tipo de datos:', typeof data.data)
        console.log('📋 Es array?:', Array.isArray(data.data))
        console.log('🔍 Estructura de data:', {
          hasSuccess: 'success' in data,
          hasData: 'data' in data,
          dataType: typeof data.data,
          dataKeys: data.data ? Object.keys(data.data) : 'no data'
        })
        
        // Los datos vienen en data.data desde la API
        const edificioInfo = data.data
        console.log('🏢 Datos del edificio extraídos:', edificioInfo)
        console.log('📊 Distribución disponible:', edificioInfo?.distribucion)
        
        // Si edificioInfo tiene a su vez success y data, acceder a la estructura anidada
        let datosReales = edificioInfo
        if (edificioInfo.success && edificioInfo.data) {
          console.log('🔍 Detectada estructura doblemente anidada, accediendo a edificioInfo.data')
          datosReales = edificioInfo.data
        }
        
        console.log('📦 Datos reales del edificio:', datosReales)
        console.log('📊 Distribución en datos reales:', datosReales?.distribucion)
        console.log('🗺️ Coordenadas del edificio:', {
          coord_x: datosReales?.coord_x,
          coord_y: datosReales?.coord_y
        })
        
        // Construir la dirección completa si existe
        let direccionCompleta = ''
        if (datosReales?.direccion) {
          direccionCompleta = construirDireccionCompleta(datosReales)
        }
        
        // Asignar solo los datos del edificio, no la estructura de respuesta
        const edificioFinal = {
          ...datosReales,  // Esto contiene: distribucion, superficie_total, etc.
          direccion: direccionCompleta
        }
        
        console.log('🎯 Edificio final a asignar:', edificioFinal)
        console.log('🔍 Distribución en edificio final:', edificioFinal.distribucion)
        setEdificioData(edificioFinal)
        
      } else {
        throw new Error('No se encontraron datos para esta referencia catastral')
      }

    } catch (error) {
      console.error('Error obteniendo resumen del edificio:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [construirDireccionCompleta])

  // Función para cargar lista detallada de inmuebles
  const cargarInmuebles = async () => {
    if (!refCatastral || !edificioData) {
      console.error('❌ No se puede cargar inmuebles:', {
        refCatastral,
        edificioData: !!edificioData
      })
      return
    }

    try {
      setLoadingInmuebles(true)
      setErrorInmuebles(null)
      
      console.log('🏠 Cargando inmuebles para referencia:', refCatastral)
      console.log('🏢 Datos del edificio disponibles:', !!edificioData)
      
      const url = `/api/catastro/inmuebles/listado/refcat?ref=${encodeURIComponent(refCatastral)}`
      console.log('🔗 URL del frontend que se va a llamar:', url)
      console.log('🌍 window.location.origin:', window.location.origin)
      console.log('🌐 URL completa:', `${window.location.origin}${url}`)
      console.log('📋 Referencia catastral encoded:', encodeURIComponent(refCatastral))
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        console.error(`❌ Error HTTP ${response.status}:`, response.statusText)
        console.error('🔗 URL que falló:', `${window.location.origin}${url}`)
        
        // Intentar leer el error como JSON
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        let errorDetails = null
        
        try {
          const errorData = await response.json()
          console.error('📄 Detalles del error JSON:', errorData)
          errorDetails = errorData
          
          // Manejar errores específicos del backend
          if (errorData.detail && errorData.detail.includes('no existe la columna')) {
            errorMessage = '⚠️ Error en la base de datos del catastro. El equipo técnico ha sido notificado y está trabajando para solucionarlo.'
          } else if (errorData.detail && errorData.detail.includes('sintaxis de entrada no es válida')) {
            errorMessage = '⚠️ Error en el servidor: hay un problema con los datos del catastro. El equipo técnico ha sido notificado.'
          } else if (response.status === 500) {
            errorMessage = `⚠️ Error interno del servidor (${response.status}). Detalles: ${errorData.error || errorData.message || errorData.detail || 'Error desconocido'}`
          } else if (response.status === 401) {
            errorMessage = `🔐 Error de autenticación. El token JWT ha expirado o es inválido. Por favor, inicia sesión nuevamente.`
          } else {
            errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage
          }
        } catch (jsonError) {
          console.error('❌ No se pudo parsear la respuesta de error como JSON:', jsonError)
          
          // Si no es JSON, podría ser HTML (error de autenticación) o texto plano
          try {
            const errorText = await response.text()
            console.error('📄 Respuesta de error como texto:', errorText)
            
            if (errorText.includes('<!DOCTYPE')) {
              errorMessage = 'Error de autenticación. Por favor, inicia sesión nuevamente.'
            } else if (response.status === 500) {
              errorMessage = `⚠️ Error interno del servidor (500). El servidor encontró un problema procesando la solicitud.`
            }
          } catch (textError) {
            console.error('❌ No se pudo leer la respuesta de error como texto:', textError)
            if (response.status === 500) {
              errorMessage = `⚠️ Error interno del servidor (500). El servidor no pudo procesar la solicitud.`
            }
          }
        }
        throw new Error(errorMessage)
      }
      
      // Verificar que la respuesta es JSON válido
      const contentType = response.headers.get('content-type')
      console.log('📄 Content-Type de respuesta:', contentType)
      
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Respuesta no es JSON:', contentType)
        throw new Error('La respuesta no es JSON válido. Posible problema de autenticación.')
      }

      const responseData = await response.json()
      
      console.log('📋 Respuesta inmuebles cruda:', responseData)
      console.log('🔍 Estructura de respuesta:', {
        type: typeof responseData,
        isArray: Array.isArray(responseData),
        keys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : [],
        hasSuccess: responseData && 'success' in responseData,
        hasData: responseData && 'data' in responseData
      })
      
      // Verificar si hay errores de autenticación en la respuesta exitosa
      if (responseData && responseData.error && responseData.error.includes('No autenticado')) {
        console.error('❌ Error de autenticación en respuesta exitosa:', responseData)
        throw new Error('🔐 Error de autenticación. Por favor, inicia sesión nuevamente.')
      }

      // Manejar diferentes formatos de respuesta
      let inmueblesList: InmuebleDetalle[] = []
      
      console.log('🔍 Tipo de responseData:', typeof responseData)
      console.log('📋 responseData:', responseData)
      console.log('🔢 Es array responseData?', Array.isArray(responseData))
      
      if (responseData.success && responseData.data) {
        console.log('✅ Usando responseData.data')
        console.log('🔢 Es array responseData.data?', Array.isArray(responseData.data))
        inmueblesList = Array.isArray(responseData.data) ? responseData.data : []
      } else if (Array.isArray(responseData)) {
        console.log('✅ Usando responseData directamente (es array)')
        inmueblesList = responseData
      } else {
        console.error('❌ Formato de datos no reconocido:', {
          isArray: Array.isArray(responseData),
          hasSuccess: 'success' in responseData,
          hasData: 'data' in responseData,
          keys: Object.keys(responseData || {})
        })
        throw new Error('Formato de datos no reconocido en la respuesta')
      }
      
      // Verificar que inmueblesList es un array válido
      if (!Array.isArray(inmueblesList)) {
        console.error('❌ inmueblesList no es un array:', inmueblesList)
        throw new Error('Los datos de inmuebles no tienen el formato esperado')
      }
      
      console.log(`📊 Array de inmuebles válido con ${inmueblesList.length} elementos`)
      
      setInmuebles(inmueblesList)
      console.log(`✅ ${inmueblesList.length} inmuebles cargados correctamente`)
      
      // 🔍 DATOS EN BRUTO PARA DEPURACIÓN
      console.group('📊 DEPURACIÓN - DATOS EN BRUTO DE INMUEBLES')
      console.log('🏠 Lista completa de inmuebles:', inmueblesList)
      
      console.log('\n📋 TABLA RESUMEN POR CÓDIGO DE USO:')
      const codigoCount: Record<string, number> = {}
      const codigoSamples: Record<string, { ejemplo: InmuebleDetalle; indices: number[] }> = {}
      
      inmueblesList.forEach((inmueble, index) => {
        const codigo = inmueble.uso_principal || 'SIN_CODIGO'
        codigoCount[codigo] = (codigoCount[codigo] || 0) + 1
        
        if (!codigoSamples[codigo]) {
          codigoSamples[codigo] = {
            ejemplo: inmueble,
            indices: []
          }
        }
        codigoSamples[codigo].indices.push(index)
      })
      
      console.table(Object.entries(codigoCount).map(([codigo, cantidad]) => ({
        'Código': codigo,
        'Cantidad': cantidad,
        'Descripción': codigoSamples[codigo]?.ejemplo?.uso_descripcion || 'N/A',
        'Indices ejemplos': codigoSamples[codigo]?.indices.slice(0, 3).join(', ') + (codigoSamples[codigo]?.indices.length > 3 ? '...' : '')
      })))
      
      console.log('\n📝 EJEMPLOS DETALLADOS POR CÓDIGO:')
      Object.entries(codigoSamples).forEach(([codigo, data]) => {
        console.group(`🔸 Código: ${codigo} (${codigoCount[codigo]} inmuebles)`)
        console.log('📄 Ejemplo completo:', data.ejemplo)
        console.log('🏷️ uso_principal:', data.ejemplo.uso_principal)
        console.log('📝 uso_descripcion:', data.ejemplo.uso_descripcion)
        console.log('📍 Ubicación:', `Bloque: ${data.ejemplo.bloque || 'N/A'}, Escalera: ${data.ejemplo.escalera || 'N/A'}, Planta: ${data.ejemplo.planta || 'N/A'}, Puerta: ${data.ejemplo.puerta || 'N/A'}`)
        console.log('📐 Superficie:', data.ejemplo.superficie_m2, 'm²')
        console.log('🏗️ Año construcción:', data.ejemplo.ano_construccion || 'N/A')
        console.log('🎯 Cómo se categoriza:', (() => {
          const { categoria, subcategoria } = categorizarInmueble(data.ejemplo.uso_principal, data.ejemplo.uso_descripcion)
          return `${categoria} → ${subcategoria}`
        })())
        console.groupEnd()
      })
      
      console.groupEnd()
      
      // Seleccionar todos los inmuebles por defecto
      const todosLosIndices = new Set(inmueblesList.map((_, index) => index))
      setSelectedInmuebles(todosLosIndices)
      setLastSelectedIndex(inmueblesList.length - 1)
      
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

  // Funciones para manejar la expansión de grupos
  const toggleGroup = (categoria: string) => {
    const newExpandedGroups = new Set(expandedGroups)
    if (expandedGroups.has(categoria)) {
      newExpandedGroups.delete(categoria)
    } else {
      newExpandedGroups.add(categoria)
    }
    setExpandedGroups(newExpandedGroups)
  }

  const expandAllGroups = () => {
    const allCategories = Object.keys(getInmueblesAgrupados())
    setExpandedGroups(new Set(allCategories))
  }

  const collapseAllGroups = () => {
    setExpandedGroups(new Set())
  }

  // Función para exportar selección a Excel
  const exportarExcel = () => {
    if (selectedInmuebles.size === 0) {
      alert('No hay inmuebles seleccionados para exportar')
      return
    }

    // Preparar datos para Excel
    const inmuebleSeleccionadosList = Array.from(selectedInmuebles)
      .map(index => inmuebles[index])
      .filter(Boolean)

    // Crear contenido CSV
    const headers = [
      'Referencia Catastral',
      'Número Bien',
      'Tipo de Uso',
      'Escalera',
      'Planta', 
      'Puerta',
      'Superficie (m²)',
      'Año Construcción',
      'Tipo Reforma',
      'Fecha Reforma'
    ].join(',')

    const rows = inmuebleSeleccionadosList.map(inmueble => [
      `"${inmueble.ref_catastral}"`,
      `"${inmueble.num_bien}"`,
      `"${inmueble.uso_descripcion}"`,
      `"${inmueble.escalera || ''}"`,
      `"${inmueble.planta || ''}"`,
      `"${inmueble.puerta || ''}"`,
      `"${inmueble.superficie_m2}"`,
      `"${inmueble.ano_construccion}"`,
      `"${inmueble.tipo_reforma || ''}"`,
      `"${inmueble.fecha_reforma || ''}"`
    ].join(',')).join('\n')

    const csvContent = headers + '\n' + rows

    // Crear archivo y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `inmuebles_${edificioData?.ref_catastral_base || 'seleccionados'}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para convertir coordenadas UTM a latitud/longitud (para España - UTM zona 30N)
  const convertirUTMaLatLon = (x: string, y: string) => {
    // Las coordenadas vienen en formato sin decimales, hay que dividir por 100
    // Ejemplo: 44808810 = 448088.10 metros
    const utmX = parseFloat(x) / 100
    const utmY = parseFloat(y) / 100
    
    // Validar que las coordenadas son válidas
    if (isNaN(utmX) || isNaN(utmY)) {
      return { lat: 40.416775, lon: -3.703790 } // Madrid como fallback
    }
    
    // Conversión usando el mismo método que MapaUbicacion.tsx
    const latFactor = 1 / 111320; // metros por grado de latitud
    const lngFactor = 1 / (111320 * Math.cos(40.4 * Math.PI / 180)); // metros por grado de longitud
    
    // Punto de referencia (centro aproximado de Madrid)
    const refX = 440000;
    const refY = 4474000;
    const refLat = 40.4168;
    const refLng = -3.7038;
    
    // Calcular diferencias
    const deltaX = utmX - refX;
    const deltaY = utmY - refY;
    
    // Convertir a lat/lng
    const lat = refLat + (deltaY * latFactor);
    const lon = refLng + (deltaX * lngFactor);
    
    // Validar que las coordenadas están en España
    if (lat < 35 || lat > 44 || lon < -10 || lon > 5) {
      return { lat: 40.416775, lon: -3.703790 } // Madrid como fallback
    }
    
    return { lat, lon }
  }

  // Función para generar PDF del informe
  const generarPDF = async () => {
    if (!edificioData) return

    // Crear contenido HTML para el PDF
    const desgloseTipos = tiposPropiedad
    const desgloseSeleccionados = getDesgloseSeleccionados()
    const inmuebleSeleccionadosList = Array.from(selectedInmuebles).map(index => inmuebles[index]).filter(Boolean)
    
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Capturar el mapa real que se está mostrando en la página
    let mapaImagenDataUrl = ''
    
    try {
      // Buscar el contenedor del mapa en la página
      const mapaContainer = document.querySelector('.leaflet-container') as HTMLElement
      
      if (mapaContainer) {
        // Importar html2canvas dinámicamente
        const html2canvas = (await import('html2canvas')).default
        
        // Capturar el mapa como canvas
        const canvas = await html2canvas(mapaContainer, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          scale: 2, // Mayor resolución
          logging: false
        })
        
        // Convertir a data URL
        mapaImagenDataUrl = canvas.toDataURL('image/png')
        console.log('✅ Mapa capturado exitosamente')
      } else {
        console.warn('⚠️ No se encontró el mapa en la página')
      }
    } catch (error) {
      console.error('❌ Error al capturar el mapa:', error)
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Informe Catastral - ${edificioData.ref_catastral_base}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #dc2626; }
          .logo { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 10px; }
          .title { font-size: 20px; margin: 10px 0; }
          .subtitle { color: #666; font-size: 14px; }
          .section { margin: 25px 0; }
          .section-title { font-size: 16px; font-weight: bold; color: #dc2626; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .section-title-main { font-size: 20px; font-weight: bold; color: #dc2626; margin-bottom: 20px; text-align: center; padding: 15px 0; border-bottom: 2px solid #dc2626; }
          .two-column-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0; }
          .column { min-height: 300px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 15px 0; }
          .info-item { background: #f8f9fa; padding: 10px; border-radius: 5px; }
          .info-label { font-weight: bold; color: #666; font-size: 12px; }
          .info-value { font-size: 14px; margin-top: 2px; }
          .map-container { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; height: 300px; background: white; display: flex; align-items: center; justify-content: center; }
          .map-image { width: 100%; height: 100%; object-fit: contain; }
          .map-placeholder { text-align: center; color: #374151; font-size: 12px; padding: 20px; line-height: 1.4; width: 100%; }
          .tipos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0; }
          .tipo-card { border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #f9f9f9; }
          .tipo-header { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
          .tipo-data { font-size: 12px; color: #666; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background: #f5f5f5; font-weight: bold; }
          .table tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; color: #666; font-size: 12px; }
          .footer-left { text-align: left; }
          .footer-right { text-align: right; }
          @media print {
            .page-break { page-break-before: always; }
            /* Ocultar encabezado automático del navegador */
            @page {
              margin-top: 0.5in;
              margin-bottom: 0.5in;
              margin-left: 0.5in;
              margin-right: 0.5in;
            }
            /* Ocultar elementos del navegador */
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">JLA ASOCIADOS</div>
          <div class="title">Informe Catastral Detallado</div>
          <div class="subtitle">Fecha: ${fechaActual}</div>
        </div>

          <div class="section">
          <div class="section-title">Información General</div>
          
          <div class="info-item" style="grid-column: 1/-1; background: #eff6ff; border: 3px solid #3b82f6; margin-bottom: 20px; padding: 15px; border-radius: 8px;">
            <div class="info-label" style="color: #2563eb; font-weight: bold; font-size: 14px; margin-bottom: 10px;">📍 Dirección de Búsqueda</div>
            <div class="info-value" style="font-size: 20px; font-weight: bold; color: #1f2937; line-height: 1.4; margin-bottom: 10px;">${direccionBusqueda || 'Dirección no especificada'}</div>
            ${edificioData.direccion ? `
              <div class="info-value" style="font-size: 14px; color: #4b5563; margin-top: 5px;">${edificioData.direccion}</div>
            ` : ''}
          </div>
          
          <div class="two-column-layout">
            <!-- Columna de información -->
            <div class="column">
              <div class="info-grid" style="grid-template-columns: 1fr; gap: 15px;">
                <div class="info-item">
                  <div class="info-label">Referencia Catastral</div>
                  <div class="info-value">${edificioData.ref_catastral_base}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Superficie Total Construida</div>
                  <div class="info-value">${parseFloat(edificioData.superficie_total?.toString() || '0').toLocaleString()} m²</div>
                </div>
                <div class="info-item">
                  <div class="info-label">⬆️ Plantas sobre rasante</div>
                  <div class="info-value">${Math.max(0, (parseInt(edificioData.plantas?.toString() || '0') - 1))} plantas</div>
                </div>
                <div class="info-item">
                  <div class="info-label">⬇️ Plantas bajo rasante</div>
                  <div class="info-value">1 sótanos</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Escaleras</div>
                  <div class="info-value">${edificioData.escaleras}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">🏗️ Año de construcción</div>
                  <div class="info-value">${edificioData.anyo_construccion || 'No especificado'}</div>
                </div>
              </div>
            </div>
            
            <!-- Columna del mapa -->
            <div class="column">
              <div class="map-container">
                ${mapaImagenDataUrl ? `
                  <img 
                    class="map-image" 
                    src="${mapaImagenDataUrl}" 
                    alt="Mapa de ubicación del edificio" 
                    style="width: 100%; height: 100%; object-fit: contain;" 
                  />
                ` : `
                  <div style="display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; color: #666;">
                    <div>
                      <p style="font-weight: bold; margin-bottom: 10px;">Mapa no disponible</p>
                      <p style="font-size: 12px;">Consulte la versión web para ver el mapa interactivo</p>
                    </div>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>

        ${selectedInmuebles.size > 0 ? `
        <div class="section page-break">
          <div class="section-title-main">Inmuebles Seleccionados (${selectedInmuebles.size} de ${inmuebles.length})</div>
          
          <div class="info-item" style="grid-column: 1/-1; background: #eff6ff; border: 3px solid #3b82f6; margin-bottom: 20px; padding: 15px; border-radius: 8px;">
            <div class="info-label" style="color: #2563eb; font-weight: bold; font-size: 14px; margin-bottom: 10px;">📍 Dirección de Búsqueda</div>
            <div class="info-value" style="font-size: 20px; font-weight: bold; color: #1f2937; line-height: 1.4; margin-bottom: 10px;">${direccionBusqueda || 'Dirección no especificada'}</div>
            ${edificioData.direccion ? `
              <div class="info-label" style="color: #6b7280; font-size: 12px; margin-bottom: 5px;">Dirección catastral:</div>
              <div class="info-value" style="font-size: 14px; color: #4b5563;">${edificioData.direccion}</div>
            ` : ''}
          </div>
          
          <div class="tipos-grid">
            ${Object.entries(desgloseSeleccionados).map(([tipo, datos]) => `
              <div class="tipo-card">
                <div class="tipo-header">${tipo}</div>
                <div class="tipo-data">Cantidad: ${datos.cantidad}</div>
                <div class="tipo-data">Superficie: ${datos.superficie.toLocaleString()} m²</div>
              </div>
            `).join('')}
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Nº Bien</th>
                <th>Tipo</th>
                <th>Código</th>
                <th>Bloque</th>
                <th>Escalera</th>
                <th>Planta</th>
                <th>Puerta</th>
                <th>Superficie</th>
              </tr>
            </thead>
            <tbody>
              ${inmuebleSeleccionadosList.map(inmueble => {
                // Extraer el código principal limpio
                const codigoPrincipal = getCodigoPrincipal(inmueble.uso_principal || '')
                
                // Obtener la descripción del tipo de uso, usando categorización si no hay descripción
                let tipoUso = inmueble.uso_descripcion
                if (!tipoUso || tipoUso === inmueble.uso_principal) {
                  // Si no hay descripción o es igual al código, usar la categorización
                  const { categoria } = categorizarInmueble(inmueble.uso_principal, inmueble.uso_descripcion)
                  switch (categoria) {
                    case '🏠 RESIDENCIAL':
                      tipoUso = 'Vivienda'
                      break
                    case '🏢 OFICINAS':
                      tipoUso = 'Oficina'
                      break
                    case '🏬 COMERCIAL':
                      tipoUso = 'Local comercial'
                      break
                    case '🚗 APARCAMIENTOS Y TRASTEROS':
                      tipoUso = inmueble.uso_principal?.includes('AAL') || inmueble.uso_descripcion?.toLowerCase().includes('trastero') ? 'Trastero' : 'Aparcamiento'
                      break
                    case '🏭 INDUSTRIAL':
                      tipoUso = 'Industrial'
                      break
                    case '🏊 EQUIPAMIENTOS / DEPORTIVO':
                      tipoUso = 'Deportivo'
                      break
                    case '🏛️ PÚBLICO / DOTACIONAL':
                      tipoUso = 'Público'
                      break
                    case '🛐 RELIGIOSO':
                      tipoUso = 'Religioso'
                      break
                    case '🏨 TURÍSTICO / HOSTELERÍA':
                      tipoUso = 'Hostelería'
                      break
                    case '🧱 SUELO':
                      tipoUso = 'Suelo'
                      break
                    default:
                      tipoUso = inmueble.uso_descripcion || 'Otros'
                  }
                }
                
                return `
                <tr>
                  <td>${inmueble.num_bien}</td>
                  <td>${tipoUso}</td>
                  <td style="text-align: center; font-family: monospace;">${codigoPrincipal}</td>
                  <td>${inmueble.bloque || '-'}</td>
                  <td>${inmueble.escalera || '-'}</td>
                  <td>${inmueble.planta || '-'}</td>
                  <td>${inmueble.puerta || '-'}</td>
                  <td style="text-align: right;">${parseFloat(inmueble.superficie_m2 || '0').toLocaleString()} m²</td>
                </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      </body>
      </html>
    `

    // Crear y abrir ventana para imprimir/guardar como PDF
    const ventanaImpresion = window.open('', '_blank')
    if (ventanaImpresion) {
      ventanaImpresion.document.write(htmlContent)
      ventanaImpresion.document.close()
      
      // Configurar la ventana para evitar encabezados automáticos
      ventanaImpresion.document.title = '' // Título vacío
      
      // Dar tiempo para que se cargue el contenido antes de imprimir
      setTimeout(() => {
        // Intentar ocultar encabezados y pies de página del navegador
        const style = ventanaImpresion.document.createElement('style')
        style.textContent = `
          @page { 
            margin: 0.5in; 
            size: A4;
            @top-left { content: ""; }
            @top-center { content: ""; }
            @top-right { content: ""; }
            @bottom-left { content: ""; }
            @bottom-center { content: ""; }
            @bottom-right { content: ""; }
          }
        `
        ventanaImpresion.document.head.appendChild(style)
        
        ventanaImpresion.print()
      }, 100)
    }
  }

  // Función para manejar el ordenamiento por columna
  const handleSort = (key: keyof InmuebleDetalle) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
  }

  // Función para obtener el código principal de uso catastral
  const getCodigoPrincipal = (uso_principal: string): string => {
    const codigo = uso_principal?.toUpperCase() || ''
    
    // Extraer el primer carácter que corresponde al uso principal según el cuadro 2
    if (codigo.startsWith('AAP') || codigo.startsWith('AAV') || codigo.startsWith('AAL')) return 'A' // Almacén-Estacionamiento
    if (codigo.startsWith('A')) return 'A' // Almacén-Estacionamiento
    if (codigo.startsWith('V')) return 'V' // Residencial
    if (codigo.startsWith('I')) return 'I' // Industrial
    if (codigo.startsWith('O')) return 'O' // Oficinas
    if (codigo.startsWith('C')) return 'C' // Comercial
    if (codigo.startsWith('K')) return 'K' // Deportivo
    if (codigo.startsWith('T')) return 'T' // Espectáculos
    if (codigo.startsWith('G')) return 'G' // Ocio y Hostelería
    if (codigo.startsWith('Y')) return 'Y' // Sanidad y Beneficencia
    if (codigo.startsWith('E')) return 'E' // Cultural
    if (codigo.startsWith('R')) return 'R' // Religioso
    if (codigo.startsWith('M')) return 'M' // Obras de urbanización y jardinería, suelos sin edificar
    if (codigo.startsWith('P')) return 'P' // Edificio singular
    if (codigo.startsWith('B')) return 'B' // Almacén agrario
    if (codigo.startsWith('J')) return 'J' // Industrial agrario
    if (codigo.startsWith('Z')) return 'Z' // Agrario
    
    return codigo || '?'
  }

  // Función para obtener la descripción del código principal
  const getDescripcionCodigo = (codigoPrincipal: string): string => {
    const descripciones: Record<string, string> = {
      'A': 'Almacén-Estacionamiento',
      'V': 'Residencial',
      'I': 'Industrial',
      'O': 'Oficinas',
      'C': 'Comercial',
      'K': 'Deportivo',
      'T': 'Espectáculos',
      'G': 'Ocio y Hostelería',
      'Y': 'Sanidad y Beneficencia',
      'E': 'Cultural',
      'R': 'Religioso',
      'M': 'Suelos sin edificar',
      'P': 'Edificio singular',
      'B': 'Almacén agrario',
      'J': 'Industrial agrario',
      'Z': 'Agrario'
    }
    return descripciones[codigoPrincipal] || 'Desconocido'
  }

  // Función para categorizar inmuebles por tipo de uso con iconos específicos
  const categorizarInmueble = (uso_principal: string, uso_descripcion: string) => {
    const codigo = uso_principal?.toUpperCase() || ''
    const descripcion = uso_descripcion || ''
    
    // Debug: mostrar información de categorización
    console.log(`🔍 Categorizando - Código: "${codigo}", Descripción: "${descripcion}"`)
    
    // 🏠 RESIDENCIAL
    if (codigo === 'V' || descripcion.toLowerCase().includes('residencial') || descripcion.toLowerCase().includes('vivienda')) {
      console.log(`✅ RESIDENCIAL: ${codigo} - ${descripcion}`)
      return { categoria: '🏠 RESIDENCIAL', subcategoria: 'Residencial', orden: 1 }
    }
    
    // 🚗 APARCAMIENTOS Y TRASTEROS
    if (codigo === 'AAP') return { categoria: '🚗 APARCAMIENTOS Y TRASTEROS', subcategoria: 'Aparcamiento', orden: 4 }
    if (codigo === 'AAV') return { categoria: '🚗 APARCAMIENTOS Y TRASTEROS', subcategoria: 'Aparcamiento vinculado a vivienda', orden: 4 }
    if (codigo === 'AAL') return { categoria: '🚗 APARCAMIENTOS Y TRASTEROS', subcategoria: 'Almacén / Trastero', orden: 4 }
    if (codigo === 'A') return { categoria: '🚗 APARCAMIENTOS Y TRASTEROS', subcategoria: 'Trastero / Almacén (genérico)', orden: 4 }
    
    // Mapear descripciones específicas a trasteros y aparcamientos
    if (descripcion.toLowerCase().includes('trastero') || descripcion.toLowerCase().includes('almacén')) {
      return { categoria: '🚗 APARCAMIENTOS Y TRASTEROS', subcategoria: 'Trastero', orden: 4 }
    }
    if (descripcion.toLowerCase().includes('estacionamiento') || descripcion.toLowerCase().includes('aparcamiento') || descripcion.toLowerCase().includes('garaje')) {
      return { categoria: '🚗 APARCAMIENTOS Y TRASTEROS', subcategoria: 'Aparcamiento', orden: 4 }
    }
    
    // 🏬 COMERCIAL
    if (codigo === 'CCE') return { categoria: '🏬 COMERCIAL', subcategoria: 'Local comercial', orden: 3 }
    if (codigo === 'CSP') return { categoria: '🏬 COMERCIAL', subcategoria: 'Supermercado', orden: 3 }
    if (codigo === 'CPA') return { categoria: '🏬 COMERCIAL', subcategoria: 'Comercio al por mayor', orden: 3 }
    if (codigo === 'CFR') return { categoria: '🏬 COMERCIAL', subcategoria: 'Farmacia', orden: 3 }
    if (codigo === 'CGL') return { categoria: '🏬 COMERCIAL', subcategoria: 'Galería comercial', orden: 3 }
    if (codigo.startsWith('C')) return { categoria: '🏬 COMERCIAL', subcategoria: 'Comercio', orden: 3 }
    
    // 🏢 OFICINAS
    if (codigo === 'O' || codigo.startsWith('O')) {
      console.log(`✅ OFICINAS: ${codigo} - ${descripcion}`)
      return { categoria: '🏢 OFICINAS', subcategoria: 'Oficinas / Despachos profesionales', orden: 2 }
    }
    
    // Verificación adicional para códigos que podrían ser oficinas
    if (descripcion.toLowerCase().includes('oficina') || descripcion.toLowerCase().includes('despacho')) {
      console.log(`✅ OFICINAS (por descripción): ${codigo} - ${descripcion}`)
      return { categoria: '🏢 OFICINAS', subcategoria: 'Oficinas / Despachos profesionales', orden: 2 }
    }
    
    // 🏭 INDUSTRIAL
    if (codigo === 'IEL') return { categoria: '🏭 INDUSTRIAL', subcategoria: 'Instalación eléctrica', orden: 5 }
    if (codigo === 'IAG') return { categoria: '🏭 INDUSTRIAL', subcategoria: 'Agropecuaria', orden: 5 }
    if (codigo === 'IMT') return { categoria: '🏭 INDUSTRIAL', subcategoria: 'Industria metálica', orden: 5 }
    if (codigo.startsWith('I')) return { categoria: '🏭 INDUSTRIAL', subcategoria: 'Industrial', orden: 5 }
    
    // 🏊 EQUIPAMIENTOS / DEPORTIVO
    if (codigo === 'KPS') return { categoria: '🏊 EQUIPAMIENTOS / DEPORTIVO', subcategoria: 'Piscina', orden: 6 }
    if (codigo === 'KDP' || codigo === 'KPL' || codigo === 'KES') return { categoria: '🏊 EQUIPAMIENTOS / DEPORTIVO', subcategoria: 'Instalación deportiva', orden: 6 }
    if (codigo.startsWith('K')) return { categoria: '🏊 EQUIPAMIENTOS / DEPORTIVO', subcategoria: 'Deportivo', orden: 6 }
    
    // 🏛️ PÚBLICO / DOTACIONAL
    if (codigo === 'PAA' || codigo === 'PAD' || codigo === 'PCD') return { categoria: '🏛️ PÚBLICO / DOTACIONAL', subcategoria: 'Edificio público', orden: 7 }
    if (codigo.startsWith('P')) return { categoria: '🏛️ PÚBLICO / DOTACIONAL', subcategoria: 'Uso público / Administrativo', orden: 7 }
    
    // 🛐 RELIGIOSO
    if (codigo.startsWith('R')) return { categoria: '🛐 RELIGIOSO', subcategoria: 'Edificio religioso', orden: 8 }
    
    // 🏨 TURÍSTICO / HOSTELERÍA
    if (codigo.startsWith('GR')) return { categoria: '🏨 TURÍSTICO / HOSTELERÍA', subcategoria: 'Hostelería', orden: 9 }
    if (codigo.startsWith('GS')) return { categoria: '🏨 TURÍSTICO / HOSTELERÍA', subcategoria: 'Hostelería', orden: 9 }
    if (codigo.startsWith('G')) return { categoria: '🏨 TURÍSTICO / HOSTELERÍA', subcategoria: 'Hotel / Hostelería / Restauración', orden: 9 }
    
    // 🧱 SUELO
    if (codigo === 'M') return { categoria: '🧱 SUELO', subcategoria: 'Suelo sin edificar', orden: 10 }
    
    // ❓ SIN USO DETALLADO
    console.log(`❓ SIN USO DETALLADO: "${codigo}" - "${descripcion}"`)
    return { categoria: '❓ SIN USO DETALLADO', subcategoria: 'Otros usos', orden: 11 }
  }

  // Función para agrupar inmuebles por categoría
  const getInmueblesAgrupados = () => {
    // Verificación de seguridad: asegurarse de que inmuebles es un array
    if (!Array.isArray(inmuebles)) {
      console.warn('⚠️ inmuebles no es un array:', inmuebles)
      return {}
    }
    
    const agrupados = inmuebles.reduce((acc, inmueble) => {
      const { categoria, subcategoria } = categorizarInmueble(inmueble.uso_principal, inmueble.uso_descripcion)
      
      if (!acc[categoria]) {
        acc[categoria] = []
      }
      acc[categoria].push({ ...inmueble, subcategoria })
      
      return acc
    }, {} as Record<string, Array<InmuebleDetalle & { subcategoria: string }>>)
    
    // Ordenar por la lógica de categorización especificada
    const categoriasOrdenadas = Object.keys(agrupados).sort((a, b) => {
      const ordenA = categorizarInmueble(agrupados[a][0].uso_principal, agrupados[a][0].uso_descripcion).orden
      const ordenB = categorizarInmueble(agrupados[b][0].uso_principal, agrupados[b][0].uso_descripcion).orden
      return ordenA - ordenB
    })
    
    const resultado: Record<string, Array<InmuebleDetalle & { subcategoria: string }>> = {}
    categoriasOrdenadas.forEach(categoria => {
      resultado[categoria] = agrupados[categoria]
    })
    
    return resultado
  }

  // Función para obtener los inmuebles ordenados
  const getSortedInmuebles = () => {
    // Verificación de seguridad: asegurarse de que inmuebles es un array
    if (!Array.isArray(inmuebles)) {
      console.warn('⚠️ inmuebles no es un array en getSortedInmuebles:', inmuebles)
      return []
    }
    
    // Si no hay configuración de orden, devolver agrupados por categoría
    if (!sortConfig.key) {
      const agrupados = getInmueblesAgrupados()
      const resultado: (InmuebleDetalle & { subcategoria?: string })[] = []
      
      Object.values(agrupados).forEach(grupo => {
        resultado.push(...grupo)
      })
      
      return resultado
    }

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

  // Función para comparar datos del resumen vs detallados
  const getComparacionDatos = () => {
    if (!edificioData?.distribucion || inmuebles.length === 0) {
      return null
    }

    // Conteo desde el listado detallado
    const agrupados = getInmueblesAgrupados()
    const conteoDetallado = {
      residencial: agrupados['🏠 RESIDENCIAL']?.length || 0,
      aparcamientos: agrupados['🚗 APARCAMIENTOS Y TRASTEROS']?.length || 0,
      comercial: agrupados['🏬 COMERCIAL']?.length || 0,
      oficinas: agrupados['🏢 OFICINAS']?.length || 0,
      sinUso: agrupados['❓ SIN USO DETALLADO']?.length || 0,
      otros: Object.entries(agrupados)
        .filter(([categoria]) => !['🏠 RESIDENCIAL', '🚗 APARCAMIENTOS Y TRASTEROS', '🏬 COMERCIAL', '🏢 OFICINAS', '❓ SIN USO DETALLADO'].includes(categoria))
        .reduce((total, [, grupo]) => total + grupo.length, 0)
    }

    // Conteo desde el resumen del edificio
    const dist = edificioData.distribucion
    const conteoResumen = {
      residencial: dist.viviendas || 0,
      aparcamientos: dist.garajes || 0,
      comercial: dist.comercial || 0,
      oficinas: dist.oficinas || 0,
      otros: (dist.locales || 0) + (dist.otros || 0)
    }

    // Calcular discrepancias
    const discrepancias = {
      residencial: conteoDetallado.residencial - conteoResumen.residencial,
      aparcamientos: conteoDetallado.aparcamientos - conteoResumen.aparcamientos,
      comercial: conteoDetallado.comercial - conteoResumen.comercial,
      oficinas: conteoDetallado.oficinas - conteoResumen.oficinas,
      sinUso: conteoDetallado.sinUso,
      otros: conteoDetallado.otros - conteoResumen.otros
    }

    const hayDiscrepancias = Object.values(discrepancias).some(disc => disc !== 0)

    return {
      conteoResumen,
      conteoDetallado,
      discrepancias,
      hayDiscrepancias
    }
  }

  // Obtener los inmuebles ordenados para mostrar
  const sortedInmuebles = getSortedInmuebles()

  // Función para obtener el desglose por tipo de uso de los inmuebles seleccionados
  const getDesgloseSeleccionados = () => {
    const desglose: Record<string, { cantidad: number; superficie: number; color: string; icon: string; orden: number }> = {}
    
    // Mapeo de colores e iconos por categoría con orden de prioridad
    const configPorCategoria = {
      '🏠 RESIDENCIAL': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🏠', orden: 1 },
      '🏢 OFICINAS': { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '🏢', orden: 2 },
      '🏬 COMERCIAL': { color: 'bg-green-100 text-green-800 border-green-300', icon: '🏬', orden: 3 },
      '🚗 APARCAMIENTOS Y TRASTEROS': { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '🚗', orden: 4 },
      '🏭 INDUSTRIAL': { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '🏭', orden: 5 },
      '🏊 EQUIPAMIENTOS / DEPORTIVO': { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: '🏊', orden: 6 },
      '🏛️ PÚBLICO / DOTACIONAL': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '🏛️', orden: 7 },
      '🛐 RELIGIOSO': { color: 'bg-pink-100 text-pink-800 border-pink-300', icon: '🛐', orden: 8 },
      '🏨 TURÍSTICO / HOSTELERÍA': { color: 'bg-red-100 text-red-800 border-red-300', icon: '🏨', orden: 9 },
      '🧱 SUELO': { color: 'bg-stone-100 text-stone-800 border-stone-300', icon: '🧱', orden: 10 },
      '❓ SIN USO DETALLADO': { color: 'bg-slate-100 text-slate-800 border-slate-300', icon: '❓', orden: 11 }
    }

    Array.from(selectedInmuebles).forEach(index => {
      const inmueble = inmuebles[index]
      if (inmueble) {
        const { categoria } = categorizarInmueble(inmueble.uso_principal, inmueble.uso_descripcion)
        
        if (!desglose[categoria]) {
          const config = configPorCategoria[categoria as keyof typeof configPorCategoria] || 
                        { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '📋', orden: 99 }
          
          desglose[categoria] = {
            cantidad: 0,
            superficie: 0,
            color: config.color,
            icon: config.icon,
            orden: config.orden
          }
        }
        
        desglose[categoria].cantidad += 1
        desglose[categoria].superficie += parseFloat(inmueble.superficie_m2 || '0')
      }
    })

    // Convertir a array, ordenar por orden de prioridad y volver a objeto
    const desgloseOrdenado = Object.entries(desglose)
      .sort(([, a], [, b]) => a.orden - b.orden)
      .reduce((acc, [categoria, datos]) => {
        acc[categoria] = datos
        return acc
      }, {} as Record<string, { cantidad: number; superficie: number; color: string; icon: string; orden: number }>)

    return desgloseOrdenado
  }  // Componente para encabezados de columna ordenables
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
        {edificioData && edificioData.superficie_total !== undefined && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Información del Edificio */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Información General</h2>
              
              {/* Dirección completa */}
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <p className="text-sm text-blue-600 font-medium mb-2">📍 Dirección de Búsqueda</p>
                <p className="font-bold text-xl text-gray-900 mb-3">
                  {direccionBusqueda || 'Dirección no especificada'}
                </p>
                
                {edificioData.direccion && (
                  <p className="text-xs text-gray-500">
                    {typeof edificioData.direccion === 'string' 
                      ? edificioData.direccion 
                      : construirDireccionCompleta(edificioData)
                    }
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Referencia Catastral</p>
                  <p className="font-mono font-semibold">{edificioData.ref_catastral_base}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Inmuebles</p>
                  <p className="font-semibold">{edificioData.total_inmuebles || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Superficie Total Construida</p>
                  <p className="font-semibold">{edificioData.superficie_total?.toLocaleString() || '0'} m²</p>
                </div>
                {edificioData.plantas_sobre_rasante > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">⬆️ Plantas sobre rasante</p>
                    <p className="font-semibold">{edificioData.plantas_sobre_rasante} plantas</p>
                  </div>
                )}
                {edificioData.plantas_bajo_rasante > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">⬇️ Plantas bajo rasante</p>
                    <p className="font-semibold">{edificioData.plantas_bajo_rasante} sótanos</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Escaleras</p>
                  <p className="font-semibold">{edificioData.escaleras || 0}</p>
                </div>
                {edificioData.anyo_construccion && (
                  <div>
                    <p className="text-sm text-gray-600">🏗️ Año de construcción</p>
                    <p className="font-semibold">{edificioData.anyo_construccion}</p>
                  </div>
                )}
                {edificioData.anyo_reforma && (
                  <div>
                    <p className="text-sm text-gray-600">🔨 Año de reforma</p>
                    <p className="font-semibold">{edificioData.anyo_reforma}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mapa de Ubicación */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Ubicación</h2>
              <div className="h-80">
                <MapaUbicacion 
                  coord_wgs84={edificioData.coord_wgs84}
                  ref_catastral={edificioData.ref_catastral_base}
                />
              </div>
            </div>

          </div>
        )}

        {/* Desglose por Tipo de Propiedad - OCULTO EN PRODUCCIÓN */}
        {false && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Desglose por Tipo de Propiedad</h2>
          
          {/* Alerta de discrepancias si existen inmuebles cargados */}
          {inmuebles.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Comparación de datos: Resumen vs Detalle
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>Los datos del <strong>&quot;Resumen del Edificio&quot;</strong> pueden diferir del <strong>&quot;Listado Detallado&quot;</strong> porque:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>El resumen viene de estadísticas precalculadas del catastro</li>
                      <li>El listado detallado viene de cada inmueble individual</li>
                      <li>Pueden usar diferentes métodos de categorización</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
          
          {/* Nota explicativa */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Estos datos provienen del resumen estadístico del catastro. 
              Para ver la categorización detallada inmueble por inmueble, carga el &quot;Listado Detallado de Inmuebles&quot; más abajo.
            </p>
          </div>
        </div>
        )}

        {/* Listado Detallado de Inmuebles */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mt-8">
          {inmuebles.length === 0 && !loadingInmuebles && !errorInmuebles && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Listado Detallado de Inmuebles</h2>
              <button
                onClick={cargarInmuebles}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cargar Inmuebles
              </button>
            </div>
          )}

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

              {/* Resumen de selección */}
              {selectedInmuebles.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Inmuebles Seleccionados</h4>
                  
                  {/* Resumen general */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4 pb-4 border-b border-blue-200">
                    <div>
                      <span className="text-blue-700">Cantidad Total:</span>
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
                    <div className="flex flex-col sm:flex-row gap-3 justify-start md:justify-end">
                      <button 
                        onClick={exportarExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 min-w-[120px]"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          <path d="M15.5,13L14,15.5L15.5,18H14L13,16L12,18H10.5L12,15.5L10.5,13H12L13,15L14,13H15.5Z"/>
                        </svg>
                        Excel
                      </button>
                      <button 
                        onClick={generarPDF}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 min-w-[120px]"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Desglose por tipo de uso */}
                  <div>
                    <h5 className="text-blue-800 font-medium mb-3">Desglose por Tipo de Uso</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {Object.entries(getDesgloseSeleccionados()).map(([tipo, datos]) => (
                        <div key={tipo} className={`p-3 rounded-lg border-2 ${datos.color}`}>
                          <div className="mb-2">
                            <h6 className="font-semibold text-sm break-words leading-tight">
                              {tipo}
                            </h6>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Cantidad:</span>
                              <span className="font-semibold">{datos.cantidad}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Superficie:</span>
                              <span className="font-semibold">{datos.superficie.toLocaleString()} m²</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mostrar comparación de datos si hay discrepancias - SOLO EN DESARROLLO */}
              {(() => {
                // Solo mostrar en entorno de desarrollo
                if (process.env.NODE_ENV === 'production') return null
                
                const comparacion = getComparacionDatos()
                
                if (!comparacion?.hayDiscrepancias) return null

                return (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-orange-800">
                          ⚠️ Se encontraron discrepancias entre los datos
                        </h3>
                        <div className="mt-2 text-sm text-orange-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <h4 className="font-medium mb-2">📊 Resumen del Catastro:</h4>
                              <ul className="space-y-1 text-xs">
                                <li>🏠 Residencial: {comparacion.conteoResumen.residencial}</li>
                                <li>🚗 Aparcamientos: {comparacion.conteoResumen.aparcamientos}</li>
                                <li>🏬 Comercial: {comparacion.conteoResumen.comercial}</li>
                                <li>🏢 Oficinas: {comparacion.conteoResumen.oficinas}</li>
                                <li>📦 Otros: {comparacion.conteoResumen.otros}</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">🔍 Listado Detallado:</h4>
                              <ul className="space-y-1 text-xs">
                                <li>🏠 Residencial: {comparacion.conteoDetallado.residencial} 
                                  {comparacion.discrepancias.residencial !== 0 && (
                                    <span className="ml-1 text-red-600 font-medium">
                                      ({comparacion.discrepancias.residencial > 0 ? '+' : ''}{comparacion.discrepancias.residencial})
                                    </span>
                                  )}
                                </li>
                                <li>🚗 Aparcamientos: {comparacion.conteoDetallado.aparcamientos}
                                  {comparacion.discrepancias.aparcamientos !== 0 && (
                                    <span className="ml-1 text-red-600 font-medium">
                                      ({comparacion.discrepancias.aparcamientos > 0 ? '+' : ''}{comparacion.discrepancias.aparcamientos})
                                    </span>
                                  )}
                                </li>
                                <li>🏬 Comercial: {comparacion.conteoDetallado.comercial}
                                  {comparacion.discrepancias.comercial !== 0 && (
                                    <span className="ml-1 text-red-600 font-medium">
                                      ({comparacion.discrepancias.comercial > 0 ? '+' : ''}{comparacion.discrepancias.comercial})
                                    </span>
                                  )}
                                </li>
                                <li>🏢 Oficinas: {comparacion.conteoDetallado.oficinas}
                                  {comparacion.discrepancias.oficinas !== 0 && (
                                    <span className="ml-1 text-red-600 font-medium">
                                      ({comparacion.discrepancias.oficinas > 0 ? '+' : ''}{comparacion.discrepancias.oficinas})
                                    </span>
                                  )}
                                </li>
                                <li>❓ Sin uso detallado: {comparacion.conteoDetallado.sinUso}
                                  {comparacion.conteoDetallado.sinUso > 0 && (
                                    <span className="ml-1 text-red-600 font-medium"> ⚠️</span>
                                  )}
                                </li>
                                <li>📦 Otros: {comparacion.conteoDetallado.otros}
                                  {comparacion.discrepancias.otros !== 0 && (
                                    <span className="ml-1 text-red-600 font-medium">
                                      ({comparacion.discrepancias.otros > 0 ? '+' : ''}{comparacion.discrepancias.otros})
                                    </span>
                                  )}
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Controles para expandir/colapsar todos los grupos */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Listado Detallado de Inmuebles</h2>
                <div className="flex gap-2">
                  <button
                    onClick={expandAllGroups}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Expandir Todo
                  </button>
                  <button
                    onClick={collapseAllGroups}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Colapsar Todo
                  </button>
                </div>
              </div>

              {/* Lista de inmuebles agrupados por categorías */}
              <div className="space-y-4">
                {Object.entries(getInmueblesAgrupados()).map(([categoria, inmueblesList]) => {
                  const isExpanded = expandedGroups.has(categoria)
                  const superficieTotal = inmueblesList.reduce((total, inmueble) => 
                    total + parseFloat(inmueble.superficie_m2 || '0'), 0
                  )
                  
                  // Calcular cuántos inmuebles de esta categoría están seleccionados
                  const seleccionadosEnCategoria = inmueblesList.filter(inmueble => {
                    const originalIndex = inmuebles.findIndex(item => 
                      item.ref_catastral === inmueble.ref_catastral && 
                      item.num_bien === inmueble.num_bien
                    )
                    return selectedInmuebles.has(originalIndex)
                  }).length
                  
                  // Calcular superficie de los seleccionados
                  const superficieSeleccionada = inmueblesList
                    .filter(inmueble => {
                      const originalIndex = inmuebles.findIndex(item => 
                        item.ref_catastral === inmueble.ref_catastral && 
                        item.num_bien === inmueble.num_bien
                      )
                      return selectedInmuebles.has(originalIndex)
                    })
                    .reduce((total, inmueble) => total + parseFloat(inmueble.superficie_m2 || '0'), 0)
                  
                  return (
                    <div key={categoria} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      {/* Cabecera clickeable de categoría */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleGroup(categoria)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <svg 
                              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : ''
                              }`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {categoria}
                            </h3>
                          </div>
                          
                          {/* Checkbox para seleccionar toda la categoría */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={inmueblesList.every(inmueble => {
                                const originalIndex = inmuebles.findIndex(item => 
                                  item.ref_catastral === inmueble.ref_catastral && 
                                  item.num_bien === inmueble.num_bien
                                )
                                return selectedInmuebles.has(originalIndex)
                              })}
                              onChange={() => {
                                const todosSeleccionados = inmueblesList.every(inmueble => {
                                  const originalIndex = inmuebles.findIndex(item => 
                                    item.ref_catastral === inmueble.ref_catastral && 
                                    item.num_bien === inmueble.num_bien
                                  )
                                  return selectedInmuebles.has(originalIndex)
                                })
                                
                                if (todosSeleccionados) {
                                  // Deseleccionar todos de esta categoría
                                  const newSelection = new Set(selectedInmuebles)
                                  inmueblesList.forEach(inmueble => {
                                    const originalIndex = inmuebles.findIndex(item => 
                                      item.ref_catastral === inmueble.ref_catastral && 
                                      item.num_bien === inmueble.num_bien
                                    )
                                    newSelection.delete(originalIndex)
                                  })
                                  setSelectedInmuebles(newSelection)
                                } else {
                                  // Seleccionar todos de esta categoría
                                  const newSelection = new Set(selectedInmuebles)
                                  inmueblesList.forEach(inmueble => {
                                    const originalIndex = inmuebles.findIndex(item => 
                                      item.ref_catastral === inmueble.ref_catastral && 
                                      item.num_bien === inmueble.num_bien
                                    )
                                    if (originalIndex !== -1) newSelection.add(originalIndex)
                                  })
                                  setSelectedInmuebles(newSelection)
                                }
                              }}
                              className="rounded border-gray-300"
                              onClick={(e) => e.stopPropagation()} // Evita que el clic en el checkbox colapse/expanda el grupo
                            />
                            <span className="text-xs text-gray-600">
                              Seleccionar todos
                            </span>
                          </div>
                        </div>
                        
                        {/* Resumen compacto con información de selección */}
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{inmueblesList.length}</span>
                            <span>{inmueblesList.length === 1 ? 'elemento' : 'elementos'}</span>
                            {seleccionadosEnCategoria > 0 && (
                              <span className={`text-xs font-medium ${
                                seleccionadosEnCategoria === inmueblesList.length 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                ({seleccionadosEnCategoria} seleccionado{seleccionadosEnCategoria === 1 ? '' : 's'})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{superficieTotal.toLocaleString()}</span>
                            <span>m²</span>
                            {superficieSeleccionada > 0 && (
                              <span className={`text-xs font-medium ${
                                seleccionadosEnCategoria === inmueblesList.length 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                ({superficieSeleccionada.toLocaleString()}m² selec.)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isExpanded ? 'Clic para colapsar' : 'Clic para expandir'}
                          </div>
                        </div>
                      </div>

                      {/* Contenido desplegable */}
                      {isExpanded && (
                        <div className="border-t border-gray-200">
                          {/* Tabla de inmuebles */}
                          <div className="overflow-x-auto">{/* Nota: El checkbox para seleccionar toda la categoría está ahora en el header */}
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="p-3 text-left font-medium text-gray-700">Selección</th>
                                  <th className="p-3 text-left font-medium text-gray-700">Tipo</th>
                                  <th className="p-3 text-center font-medium text-gray-700">Código</th>
                                  <th className="p-3 text-left font-medium text-gray-700">Bloque</th>
                                  <th className="p-3 text-left font-medium text-gray-700">Escalera</th>
                                  <th className="p-3 text-left font-medium text-gray-700">Planta</th>
                                  <th className="p-3 text-left font-medium text-gray-700">Puerta</th>
                                  <th className="p-3 text-right font-medium text-gray-700">Superficie</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {inmueblesList.map((inmueble, index) => {
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
                                      onClick={(e) => handleSelection(originalIndex, index, e)}
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
                                      <td className="p-3 text-gray-600">
                                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded-full">
                                          {inmueble.subcategoria}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                          <span 
                                            className="inline-block px-2 py-1 text-sm font-mono font-bold bg-blue-100 text-blue-800 rounded border cursor-help"
                                            title={`Código principal: ${getCodigoPrincipal(inmueble.uso_principal)} - ${getDescripcionCodigo(getCodigoPrincipal(inmueble.uso_principal))}`}
                                          >
                                            {getCodigoPrincipal(inmueble.uso_principal)}
                                          </span>
                                          {inmueble.uso_principal !== getCodigoPrincipal(inmueble.uso_principal) && (
                                            <span 
                                              className="inline-block px-1 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded border"
                                              title={`Código completo: ${inmueble.uso_principal}`}
                                            >
                                              {inmueble.uso_principal}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3 text-gray-600">{inmueble.bloque || '-'}</td>
                                      <td className="p-3 text-gray-600">{inmueble.escalera || '-'}</td>
                                      <td className="p-3 text-gray-600">{inmueble.planta || '-'}</td>
                                      <td className="p-3 text-gray-600">{inmueble.puerta || '-'}</td>
                                      <td className="p-3 text-right font-medium text-gray-900">
                                        {parseFloat(inmueble.superficie_m2 || '0').toLocaleString()} m²
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Leyenda de códigos catastrales - SOLO EN DESARROLLO */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">📋 Códigos de Uso Catastral (Cuadro 2 - Ley del Catastro)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                    <div><span className="font-mono font-bold text-blue-800">A</span> - Almacén-Estacionamiento</div>
                    <div><span className="font-mono font-bold text-blue-800">V</span> - Residencial</div>
                    <div><span className="font-mono font-bold text-blue-800">I</span> - Industrial</div>
                    <div><span className="font-mono font-bold text-blue-800">O</span> - Oficinas</div>
                    <div><span className="font-mono font-bold text-blue-800">C</span> - Comercial</div>
                    <div><span className="font-mono font-bold text-blue-800">K</span> - Deportivo</div>
                    <div><span className="font-mono font-bold text-blue-800">T</span> - Espectáculos</div>
                    <div><span className="font-mono font-bold text-blue-800">G</span> - Ocio y Hostelería</div>
                    <div><span className="font-mono font-bold text-blue-800">Y</span> - Sanidad y Beneficencia</div>
                    <div><span className="font-mono font-bold text-blue-800">E</span> - Cultural</div>
                    <div><span className="font-mono font-bold text-blue-800">R</span> - Religioso</div>
                    <div><span className="font-mono font-bold text-blue-800">M</span> - Suelos sin edificar</div>
                    <div><span className="font-mono font-bold text-blue-800">P</span> - Edificio singular</div>
                    <div><span className="font-mono font-bold text-blue-800">B</span> - Almacén agrario</div>
                    <div><span className="font-mono font-bold text-blue-800">J</span> - Industrial agrario</div>
                    <div><span className="font-mono font-bold text-blue-800">Z</span> - Agrario</div>
                  </div>
                  <p className="mt-2 text-xs text-blue-700">
                    <strong>Nota:</strong> Se muestra el código principal (azul) y subcódigo específico (gris) si aplica. 
                    Pasa el cursor sobre los códigos para ver más detalles.
                  </p>
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