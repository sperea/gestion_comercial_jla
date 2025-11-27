'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatFranchise, formatDate as formatDateUtil } from '@/lib/format-utils'

// Interfaces para los tipos de datos
interface ProyectoComunidad {
  id: number
  rsocial: string
  cif: string
  colaborador: number
  comercial?: number
  comercial_nombre: string
  numero_columnas: number
  fecha: string
  vencimiento: string
  estado: string
  observaciones: string
  direccion_linea1: string
  direccion_linea2: string
  anyo_construccion: string
  anyo_rehabilitacion: string
  tipo_rehabilitacion: string
  numero_viviendas: number
  numero_locales: number
  numero_garajes: number
  metros_vivienda: number
  metros_locales: number
  metros_garaje: number
  numero_portales: number
  alturas_sobre_rasante: number
  alturas_ajo_rasante: number
  tipo_calefaccion: string
  portero: boolean
  numero_piscinas: number
  urbanizacion: boolean
  numero_ascensores: number
}

interface ColumnaComparativoDefault {
  id: number
  name: string
  description: string
  field_name: string
  order: number
}

interface Compania {
  id: number
  rsocial: string
  cif: string
  telefono?: string
  email?: string
  logo?: string // URL del logo de la compañía
}

interface ColumnaComparativo {
  id: number
  proyecto: number
  compania: number
  compania_rsocial: string
  colorMyColumn: string
  pdfFile?: string
  [key: string]: any // Para los campos f001-f037, f038, f039, f999
}

interface FicheroProyecto {
  id: number
  proyecto: number
  descripcion: string
  pdfFile: string
  pdfFile_url: string
  file_size: number
  orden: number
  uploaded_at: string
  proyecto_rsocial: string
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProyectoComunidadEditPage({ params }: PageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params)
  const proyectoId = parseInt(resolvedParams.id)

  // Estados principales
  const [comparativo, setComparativo] = useState<ProyectoComunidad | null>(null)
  const [columnasComparativo, setColumnasComparativo] = useState<ColumnaComparativo[]>([])
  const [columnasDefault, setColumnasDefault] = useState<ColumnaComparativoDefault[]>([])
  const [companias, setCompanias] = useState<Compania[]>([])
  const [ficheros, setFicheros] = useState<FicheroProyecto[]>([])
  
  // Estados de control
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'comparativo' | 'columnas' | 'ficheros'>('comparativo')
  const [error, setError] = useState<string | null>(null)

  // Función helper para hacer requests a la API de intranet a través del proxy
  const fetchIntranetData = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    console.log('🔄 [INTRANET PROXY] Iniciando petición a través del proxy');
    console.log('📡 [INTRANET PROXY] Endpoint:', endpoint);

    const url = `/api/intranet${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    console.log('📊 [INTRANET PROXY] Response status:', response.status);
    return response
  }, [])

  // Cargar datos del proyecto específico
  const fetchProyecto = useCallback(async () => {
    try {
      const response = await fetchIntranetData(`/proyectos-comunidad/${proyectoId}/`)
      if (response.ok) {
        const data = await response.json()
        setComparativo(data)
      } else {
        setError('No se pudo cargar el proyecto')
      }
    } catch (error) {
      console.error('Error fetching proyecto:', error)
      setError('Error al cargar el proyecto')
    }
  }, [proyectoId, fetchIntranetData])

  // Cargar columnas comparativas del proyecto
  const fetchColumnasComparativo = useCallback(async () => {
    try {
      console.log('🔄 [DEBUG] Cargando columnas comparativo para proyecto:', proyectoId)
      const response = await fetchIntranetData(`/columnas-comparativo/?proyecto=${proyectoId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('📊 [DEBUG] Respuesta columnas comparativo:', data)
        const columnas = Array.isArray(data) ? data : data.results || []
        console.log('📊 [DEBUG] Columnas procesadas:', columnas)
        setColumnasComparativo(columnas)
      } else {
        console.error('❌ [DEBUG] Error en respuesta columnas comparativo:', response.status)
      }
    } catch (error) {
      console.error('Error fetching columnas comparativo:', error)
    }
  }, [proyectoId, fetchIntranetData])

  // Cargar columnas por defecto (para mostrar la estructura)
  const fetchColumnasDefault = useCallback(async () => {
    try {
      const response = await fetchIntranetData('/columnas-comparativo-default/')
      if (response.ok) {
        const data = await response.json()
        setColumnasDefault(Array.isArray(data) ? data : data.results || [])
      }
    } catch (error) {
      console.error('Error fetching columnas default:', error)
    }
  }, [fetchIntranetData])

  // Cargar compañías disponibles
  const fetchCompanias = useCallback(async () => {
    try {
      const response = await fetchIntranetData('/companias/')
      if (response.ok) {
        const data = await response.json()
        setCompanias(Array.isArray(data) ? data : data.results || [])
      }
    } catch (error) {
      console.error('Error fetching companias:', error)
    }
  }, [fetchIntranetData])

  // Cargar ficheros del proyecto
  const fetchFicheros = useCallback(async () => {
    try {
      const response = await fetchIntranetData(`/ficheros-proyecto/?proyecto=${proyectoId}`)
      if (response.ok) {
        const data = await response.json()
        setFicheros(Array.isArray(data) ? data : data.results || [])
      }
    } catch (error) {
      console.error('Error fetching ficheros:', error)
    }
  }, [proyectoId, fetchIntranetData])

  // Cargar todos los datos iniciales
  useEffect(() => {
    if (user?.profile?.token_intranet && !isNaN(proyectoId)) {
      const loadData = async () => {
        setIsLoading(true)
        try {
          await Promise.all([
            fetchProyecto(),
            fetchColumnasComparativo(),
            fetchColumnasDefault(),
            fetchCompanias(),
            fetchFicheros()
          ])
        } catch (error) {
          console.error('Error loading data:', error)
          setError('Error al cargar los datos')
        } finally {
          setIsLoading(false)
        }
      }
      loadData()
    } else if (!user?.profile?.token_intranet) {
      setError('Token de intranet no disponible')
      setIsLoading(false)
    } else if (isNaN(proyectoId)) {
      setError('ID de proyecto inválido')
      setIsLoading(false)
    }
  }, [user?.profile?.token_intranet, proyectoId, fetchProyecto, fetchColumnasComparativo, fetchColumnasDefault, fetchCompanias, fetchFicheros])

  // Función para formatear fecha (usar la del formato util)
  const formatDate = formatDateUtil

  // Función para obtener el logo de una compañía por su nombre
  const getCompaniaLogo = (companiaNombre: string): string | null => {
    if (!companiaNombre || !companias) return null;
    
    // Buscar la compañía por nombre (case insensitive)
    const compania = companias.find(c => 
      c.rsocial && c.rsocial.toLowerCase() === companiaNombre.toLowerCase()
    );
    
    return compania?.logo || null;
  }

  // Función para generar fallback SVG para logos
  const generateFallbackLogo = (companiaNombre: string): string => {
    const initial = companiaNombre ? companiaNombre.charAt(0).toUpperCase() : 'C';
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' fill='%23f3f4f6'/><text x='24' y='30' text-anchor='middle' font-family='Arial,sans-serif' font-size='12' font-weight='bold' fill='%23374151'>${initial}</text></svg>`;
  }

  // Función para determinar el color del vencimiento
  const getVencimientoColor = (fechaVencimiento: string) => {
    const today = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const diffTime = vencimiento.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'text-red-600 font-semibold'
    if (diffDays <= 30) return 'text-orange-600 font-semibold'
    return 'text-gray-900'
  }

  // Si hay error o no se tiene acceso
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Loading inicial
  if (isLoading || !comparativo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {comparativo.rsocial}
                </h1>
                <p className="text-gray-600 mt-1">
                  CIF: {comparativo.cif} • Comercial: {comparativo.comercial_nombre}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {comparativo.numero_columnas} columnas
              </span>
              <span className={`text-sm font-medium ${getVencimientoColor(comparativo.vencimiento)}`}>
                Vence: {formatDate(comparativo.vencimiento)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'comparativo' as const, name: 'Información del Comparativo', icon: '📋' },
              { id: 'columnas' as const, name: 'Columnas Comparativo', icon: '📊' },
              { id: 'ficheros' as const, name: 'Ficheros', icon: '📁' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab: Información del Comparativo */}
        {activeTab === 'comparativo' && (
          <div className="space-y-6">
            {/* Información Básica del Comparativo */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.rsocial}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CIF
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.cif}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comercial
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.comercial_nombre}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colaborador
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.colaborador || 'No asignado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Creación
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {formatDate(comparativo.fecha)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <div className={`text-sm p-3 bg-gray-50 rounded-md ${getVencimientoColor(comparativo.vencimiento)}`}>
                    {formatDate(comparativo.vencimiento)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.estado || 'No definido'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Columnas
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.numero_columnas}
                  </div>
                </div>
              </div>
              
              {comparativo.observaciones && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.observaciones}
                  </div>
                </div>
              )}
            </div>

            {/* Dirección */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección Línea 1
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.direccion_linea1 || 'No especificada'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección Línea 2
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.direccion_linea2 || 'No especificada'}
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Construcción */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Construcción</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año de Construcción
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.anyo_construccion || 'No especificado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año de Rehabilitación
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.anyo_rehabilitacion || 'No rehabilitado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Rehabilitación
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.tipo_rehabilitacion || 'Ninguna'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Portales
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.numero_portales || 0}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alturas sobre Rasante
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.alturas_sobre_rasante || 'No especificado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alturas bajo Rasante
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.alturas_ajo_rasante || 'No especificado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Calefacción
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.tipo_calefaccion || 'No especificado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portero
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.portero || 'No especificado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Ascensores
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.numero_ascensores || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Unidades */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Unidades</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Viviendas
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md font-semibold">
                    {comparativo.numero_viviendas || 0}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Locales
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md font-semibold">
                    {comparativo.numero_locales || 0}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Garajes
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md font-semibold">
                    {comparativo.numero_garajes || 0}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metros² Vivienda
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.metros_vivienda ? `${comparativo.metros_vivienda} m²` : 'No especificado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metros² Locales
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.metros_locales ? `${comparativo.metros_locales} m²` : 'No especificado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metros² Garaje
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.metros_garaje ? `${comparativo.metros_garaje} m²` : 'No especificado'}
                  </div>
                </div>
              </div>
            </div>

            {/* Instalaciones */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Instalaciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Piscinas
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.numero_piscinas || 0}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urbanización
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                    {comparativo.urbanizacion || 'No especificada'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Columnas Comparativo */}
        {activeTab === 'columnas' && (
          <div className="space-y-6">
            {/* Header del comparativo */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Columnas del Comparativo</h2>
                  <p className="text-gray-600 mt-1">
                    {columnasComparativo.length} compañías en el comparativo
                  </p>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                  + Añadir Compañía
                </button>
              </div>
            </div>

            {/* Tabla de columnas comparativo */}
            <div className="bg-white rounded-lg shadow-sm border">
              {columnasComparativo.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay compañías en el comparativo
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Añade compañías para crear el comparativo de seguros
                  </p>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Añadir Primera Compañía
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Compañía
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prima
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Franquicia
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Capital Asegurado
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {columnasComparativo.map((columna, index) => (
                        <tr key={columna.id} className="hover:bg-gray-50">
                          {/* Columna de Compañía con Logo */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                {(() => {
                                  const logoUrl = getCompaniaLogo(columna.compania_rsocial);
                                  
                                  if (logoUrl) {
                                    return (
                                      <Image 
                                        className="h-12 w-12 object-contain bg-white rounded border"
                                        src={logoUrl}
                                        alt={`Logo ${columna.compania_rsocial}`}
                                        width={48}
                                        height={48}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = generateFallbackLogo(columna.compania_rsocial || 'Compañía');
                                        }}
                                      />
                                    );
                                  } else {
                                    return (
                                      <div className="h-12 w-12 bg-gray-100 rounded border flex items-center justify-center">
                                        <span className="text-gray-400 text-lg font-bold">
                                          {columna.compania_rsocial?.charAt(0)?.toUpperCase() || 'C'}
                                        </span>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {columna.compania_rsocial || 'Compañía sin nombre'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {companias.find(c => c.rsocial === columna.compania_rsocial)?.cif || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Columna de Prima */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-gray-900 font-semibold">
                              {formatCurrency(columna.f999)}
                            </div>
                          </td>
                          
                          {/* Columna de Franquicia */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-gray-900">
                              {formatFranchise(columna.f038)}
                            </div>
                          </td>
                          
                          {/* Columna de Capital Asegurado */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-gray-900 font-semibold">
                              {formatCurrency(columna.f039)}
                            </div>
                          </td>
                          
                          {/* Columna de Acciones */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Editar columna"
                                onClick={() => {
                                  // TODO: Implementar función de edición
                                  console.log('Editar columna', columna.id);
                                }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Eliminar columna"
                                onClick={() => {
                                  // TODO: Implementar función de eliminación
                                  console.log('Eliminar columna', columna.id);
                                }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Ficheros */}
        {activeTab === 'ficheros' && (
          <div className="space-y-6">
            {/* Header de ficheros */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Archivos del Proyecto</h2>
                  <p className="text-gray-600 mt-1">
                    {ficheros.length} archivo{ficheros.length !== 1 ? 's' : ''} disponible{ficheros.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                  + Subir Archivo
                </button>
              </div>
            </div>

            {/* Lista de ficheros */}
            <div className="bg-white rounded-lg shadow-sm border">
              {ficheros.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay archivos subidos
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Sube documentos relacionados con este proyecto
                  </p>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Subir Primer Archivo
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {ficheros.map((fichero) => (
                    <div key={fichero.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {fichero.descripcion}
                            </div>
                            <div className="text-xs text-gray-500">
                              Subido el {formatDate(fichero.uploaded_at)} • 
                              {Math.round(fichero.file_size / 1024)} KB • 
                              Orden: {fichero.orden}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={fichero.pdfFile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                            title="Descargar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </a>
                          <button 
                            className="inline-flex items-center p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            className="inline-flex items-center p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}