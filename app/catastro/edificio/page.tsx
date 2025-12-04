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
  escaleras: number
  bloques: number
  direccion: {
    tipo_via: string
    nombre_via: string
    numero: number
    municipio: string
    provincia: string
    cp: number
  }
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
        console.log('✅ Datos del edificio recibidos:', data)
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
          <div class="section-title">Información General del Edificio</div>
          
          <div class="info-item" style="grid-column: 1/-1; background: #eff6ff; border: 3px solid #3b82f6; margin-bottom: 20px; padding: 15px; border-radius: 8px;">
            <div class="info-label" style="color: #2563eb; font-weight: bold; font-size: 14px; margin-bottom: 10px;">📍 Dirección de Búsqueda</div>
            <div class="info-value" style="font-size: 20px; font-weight: bold; color: #1f2937; line-height: 1.4; margin-bottom: 10px;">${direccionBusqueda || 'Dirección no especificada'}</div>
            ${edificioData.direccion ? `
              <div class="info-label" style="color: #6b7280; font-size: 12px; margin-bottom: 5px;">Dirección catastral:</div>
              <div class="info-value" style="font-size: 14px; color: #4b5563;">${edificioData.direccion}</div>
            ` : ''}
          </div>
          
          <div class="two-column-layout">
            <!-- Columna de información -->
            <div class="column">
              <div class="info-grid" style="grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="info-item">
                  <div class="info-label">Referencia Catastral</div>
                  <div class="info-value">${edificioData.ref_catastral_base}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Total Inmuebles</div>
                  <div class="info-value">${edificioData.total_inmuebles}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Superficie Total</div>
                  <div class="info-value">${parseFloat(edificioData.superficie_total?.toString() || '0').toLocaleString()} m²</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Superficie Total Construida</div>
                  <div class="info-value">${parseFloat(edificioData.superficie_total?.toString() || '0').toLocaleString()} m²</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Plantas</div>
                  <div class="info-value">${edificioData.plantas}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Plantas</div>
                  <div class="info-value">${edificioData.plantas}</div>
                </div>
                <div class="info-item" style="grid-column: 1 / -1;">
                  <div class="info-label">Número de Escaleras</div>
                  <div class="info-value">${edificioData.escaleras}</div>
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

        <div class="section">
          <div class="section-title">Desglose por Tipo de Propiedad (Total Edificio)</div>
          <div class="tipos-grid">
            ${desgloseTipos.map(tipo => `
              <div class="tipo-card">
                <div class="tipo-header">${tipo.icon} ${tipo.nombre}</div>
                <div class="tipo-data">Cantidad: ${tipo.num}</div>
                <div class="tipo-data">Superficie: ${tipo.m2.toLocaleString()} m²</div>
              </div>
            `).join('')}
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
          
          <div class="info-grid" style="grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div class="info-item">
              <div class="info-label">Referencia Catastral</div>
              <div class="info-value">${edificioData.ref_catastral_base}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total Inmuebles</div>
              <div class="info-value">${edificioData.total_inmuebles}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Superficie Total</div>
              <div class="info-value">${parseFloat(edificioData.superficie_total?.toString() || '0').toLocaleString()} m²</div>
            </div>
            <div class="info-item">
              <div class="info-label">Superficie Total Construida</div>
              <div class="info-value">${parseFloat(edificioData.superficie_total?.toString() || '0').toLocaleString()} m²</div>
            </div>
            <div class="info-item">
              <div class="info-label">Plantas</div>
              <div class="info-value">${edificioData.plantas}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Plantas</div>
              <div class="info-value">${edificioData.plantas}</div>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">Número de Escaleras</div>
              <div class="info-value">${edificioData.escaleras}</div>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Cantidad Total</div>
              <div class="info-value">${selectedInmuebles.size}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Superficie Total</div>
              <div class="info-value">${Array.from(selectedInmuebles).reduce((total, index) => total + parseFloat(inmuebles[index]?.superficie_m2 || '0'), 0).toLocaleString()} m²</div>
            </div>
          </div>
          
          <div class="tipos-grid">
            ${Object.entries(desgloseSeleccionados).map(([tipo, datos]) => `
              <div class="tipo-card">
                <div class="tipo-header">${datos.icon} ${tipo}</div>
                <div class="tipo-data">Cantidad: ${datos.cantidad}</div>
                <div class="tipo-data">Superficie: ${datos.superficie.toLocaleString()} m²</div>
              </div>
            `).join('')}
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Nº Bien</th>
                <th>Tipo de Uso</th>
                <th>Escalera</th>
                <th>Planta</th>
                <th>Puerta</th>
                <th>Superficie (m²)</th>
                <th>Año Construcción</th>
              </tr>
            </thead>
            <tbody>
              ${inmuebleSeleccionadosList.map(inmueble => `
                <tr>
                  <td>${inmueble.num_bien}</td>
                  <td>${inmueble.uso_descripcion}</td>
                  <td>${inmueble.escalera || '-'}</td>
                  <td>${inmueble.planta || '-'}</td>
                  <td>${inmueble.puerta || '-'}</td>
                  <td style="text-align: right;">${parseFloat(inmueble.superficie_m2 || '0').toLocaleString()}</td>
                  <td>${inmueble.ano_construccion}</td>
                </tr>
              `).join('')}
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

  // Función para obtener el desglose por tipo de uso de los inmuebles seleccionados
  const getDesgloseSeleccionados = () => {
    const desglose: Record<string, { cantidad: number; superficie: number; color: string; icon: string }> = {}
    
    // Mapeo de iconos y colores por tipo de uso
    const tiposUso = {
      'Residencial': { color: 'bg-blue-100 text-blue-800', icon: '🏠' },
      'Comercial': { color: 'bg-green-100 text-green-800', icon: '🏪' },
      'Oficinas': { color: 'bg-purple-100 text-purple-800', icon: '🏢' },
      'Industrial': { color: 'bg-orange-100 text-orange-800', icon: '🏭' },
      'Almacén': { color: 'bg-gray-100 text-gray-800', icon: '🚗' },
      'Estacionamiento': { color: 'bg-gray-100 text-gray-800', icon: '🚗' },
      'Deportivo': { color: 'bg-indigo-100 text-indigo-800', icon: '🏃' },
      'Ocio': { color: 'bg-pink-100 text-pink-800', icon: '🍽️' },
      'Cultural': { color: 'bg-yellow-100 text-yellow-800', icon: '🎭' },
    }

    Array.from(selectedInmuebles).forEach(index => {
      const inmueble = inmuebles[index]
      if (inmueble) {
        let tipoUso = inmueble.uso_descripcion || 'Otros'
        
        // Simplificar y categorizar tipos de uso
        if (tipoUso.toLowerCase().includes('vivienda') || tipoUso.toLowerCase().includes('residencial')) {
          tipoUso = 'Residencial'
        } else if (tipoUso.toLowerCase().includes('comercial') || tipoUso.toLowerCase().includes('tienda')) {
          tipoUso = 'Comercial'
        } else if (tipoUso.toLowerCase().includes('oficina')) {
          tipoUso = 'Oficinas'
        } else if (tipoUso.toLowerCase().includes('industrial')) {
          tipoUso = 'Industrial'
        } else if (tipoUso.toLowerCase().includes('almacén') || tipoUso.toLowerCase().includes('almacen')) {
          tipoUso = 'Almacén'
        } else if (tipoUso.toLowerCase().includes('estacionamiento') || tipoUso.toLowerCase().includes('garaje')) {
          tipoUso = 'Estacionamiento'
        }
        
        if (!desglose[tipoUso]) {
          const tipoConfig = tiposUso[tipoUso as keyof typeof tiposUso] || { color: 'bg-gray-100 text-gray-800', icon: '📋' }
          desglose[tipoUso] = {
            cantidad: 0,
            superficie: 0,
            color: tipoConfig.color,
            icon: tipoConfig.icon
          }
        }
        
        desglose[tipoUso].cantidad += 1
        desglose[tipoUso].superficie += parseFloat(inmueble.superficie_m2 || '0')
      }
    })
    
    return desglose
  }

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
                  <>
                    <p className="text-xs text-gray-500 mb-1">Dirección catastral:</p>
                    <p className="text-sm text-gray-700">{construirDireccionCompleta(edificioData)}</p>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Referencia Catastral</p>
                  <p className="font-mono font-semibold">{edificioData.ref_catastral_base}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Superficie Total Construida</p>
                  <p className="font-semibold">{edificioData.superficie_total?.toLocaleString() || '0'} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Inmuebles</p>
                  <p className="font-semibold">{edificioData.total_inmuebles || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Superficie Total</p>
                  <p className="font-semibold">{parseFloat(edificioData.superficie_total?.toString() || '0').toLocaleString()} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plantas</p>
                  <p className="font-semibold">{edificioData.plantas || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Escaleras</p>
                  <p className="font-semibold">{edificioData.escaleras || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Bloques</p>
                  <p className="font-semibold">{edificioData.bloques || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Escaleras</p>
                  <p className="font-semibold">{edificioData.escaleras}</p>
                </div>
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
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-semibold flex items-center gap-2 text-sm">
                              <span className="text-lg">{datos.icon}</span>
                              <span className="truncate">{tipo}</span>
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