'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Interface para el tipo de datos de la API
interface ComunidadData {
  id: number
  rsocial: string
  cif: string
  comercial_nombre: string
  colaborador: string
  fecha: string
  vencimiento: string
  numero_columnas: number
}

interface ApiResponse {
  count: number
  results: ComunidadData[]
  next?: string
  previous?: string
}

type SortField = 'rsocial' | 'cif' | 'comercial_nombre' | 'colaborador' | 'fecha' | 'vencimiento'
type SortDirection = 'asc' | 'desc'

export default function ComunidadesPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Estados para datos y control
  const [items, setItems] = useState<ComunidadData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Función helper para hacer requests a la API de intranet a través del proxy
  const fetchIntranetData = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    console.log('🔄 [INTRANET PROXY] Iniciando petición a través del proxy');
    console.log('📡 [INTRANET PROXY] Endpoint:', endpoint);

    const url = `/api/intranet${endpoint}`;
    
    console.log('🌐 [INTRANET PROXY] URL del proxy:', url);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    console.log('📋 [INTRANET PROXY] Headers:', headers);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Incluir cookies para que el proxy pueda acceder al token
    });

    console.log('📊 [INTRANET PROXY] Response status:', response.status);
    return response
  }, [])

  // Función para obtener datos de la API con paginación del servidor
  const fetchData = useCallback(async (page: number = 1, search: string = '') => {
    setIsLoading(true)
    try {
      let endpoint
      
      // Usar endpoint diferente según si hay búsqueda o no
      if (search.trim()) {
        // Usar endpoint de búsqueda
        endpoint = `/proyectos-comunidad/search/?q=${encodeURIComponent(search)}&page=${page}&page_size=${itemsPerPage}`
      } else {
        // Usar endpoint normal de listado
        endpoint = `/proyectos-comunidad/?page=${page}&page_size=${itemsPerPage}`
      }
      
      console.log('📡 [FETCH DATA] Endpoint:', endpoint)
      const response = await fetchIntranetData(endpoint)
      
      if (response.ok) {
        const data: ApiResponse = await response.json()
        if (data && Array.isArray(data.results)) {
          console.log('✅ [FETCH DATA] Resultados obtenidos:', data.results.length)
          setItems(data.results)
          setTotalPages(Math.ceil(data.count / itemsPerPage))
          setTotalCount(data.count)
          setCurrentPage(page)
        } else {
          console.error('Los datos de la API no contienen un array en results', data)
          setItems([])
          setTotalPages(0)
          setTotalCount(0)
        }
      } else {
        console.error('Error en la respuesta de la API:', response.status)
        setItems([])
        setTotalPages(0)
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setItems([])
      setTotalPages(0)
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [itemsPerPage, fetchIntranetData])

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (user?.profile?.token_intranet) {
      console.log('Cargando datos...')
      fetchData(1, '')
    }
  }, [fetchData, user?.profile?.token_intranet])
  
  // Efecto para aplicar búsqueda cuando cambie el término de búsqueda (con debounce)
  useEffect(() => {
    if (user?.profile?.token_intranet) {
      const timeoutId = setTimeout(() => {
        fetchData(1, searchTerm)
      }, 500) // Debounce de 500ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, user?.profile?.token_intranet, fetchData])

  // Función para cambiar página
  const changePage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      fetchData(page, searchTerm)
    }
  }

  // Función para generar números de página
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots: (number | string)[] = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  // Función para manejar búsqueda
  const handleSearch = () => {
    fetchData(1, searchTerm)
  }

  // Función para cambiar ordenamiento
  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = 'asc'
    if (sortField === field) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    }
    setSortField(field)
    setSortDirection(newDirection)
    // TODO: Implementar ordenamiento en el servidor
    fetchData(currentPage, searchTerm)
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Función para determinar el color del vencimiento
  const getVencimientoColor = (fechaVencimiento: string) => {
    const today = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const diffTime = vencimiento.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'text-red-600 font-semibold' // Vencido
    if (diffDays <= 30) return 'text-orange-600 font-semibold' // Próximo a vencer
    return 'text-gray-900' // Normal
  }

  // Función para obtener clase del badge según número de columnas
  const getBadgeClass = (numeroColumnas: number) => {
    if (numeroColumnas === 0) return 'bg-red-600'
    if (numeroColumnas > 0 && numeroColumnas < 3) return 'bg-yellow-600'
    return 'bg-blue-600'
  }

  // Función para generar URLs de acciones
  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://api.jlaasociados.net'

  const handleViewPdf = (itemId: number) => {
    const url = `${getApiUrl()}/cuadrocomparativopdf/${itemId}/`
    window.open(url, '_blank')
  }

  const handleEdit = (itemId: number) => {
    router.push(`/proyectos/comunidades/${itemId}`)
  }

  // Validación: Mostrar loading si no hay token_intranet disponible
  if (!user?.profile?.token_intranet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">
            Cargando datos del perfil de usuario...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Se necesita el token de intranet para acceder a esta funcionalidad
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Comparativos de Comunidades
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona los comparativos de las comunidades de propietarios
              </p>
            </div>
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={() => router.push('/proyectos/comunidades/nuevo')}
            >
              + Nuevo Comparativo
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controles de Búsqueda y Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por razón social, CIF, comercial, colaborador, fechas..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Buscar'
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Cargando comparativos...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden xl:block">
                <div className="overflow-hidden">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-1/4"
                          onClick={() => handleSort('rsocial')}
                        >
                          <div className="flex items-center">
                            <span className="truncate">Razón Social</span>
                            {sortField === 'rsocial' && (
                              <span className="ml-2 flex-shrink-0">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                          onClick={() => handleSort('cif')}
                        >
                          <div className="flex items-center">
                            <span className="truncate">CIF</span>
                            {sortField === 'cif' && (
                              <span className="ml-1 flex-shrink-0">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
                          onClick={() => handleSort('comercial_nombre')}
                        >
                          <div className="flex items-center">
                            <span className="truncate">Comercial</span>
                            {sortField === 'comercial_nombre' && (
                              <span className="ml-1 flex-shrink-0">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          <span className="truncate">Colaborador</span>
                        </th>
                        <th 
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                          onClick={() => handleSort('fecha')}
                        >
                          <div className="flex items-center">
                            <span className="truncate">Creación</span>
                            {sortField === 'fecha' && (
                              <span className="ml-1 flex-shrink-0">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28"
                          onClick={() => handleSort('vencimiento')}
                        >
                          <div className="flex items-center">
                            <span className="truncate">Vencimiento</span>
                            {sortField === 'vencimiento' && (
                              <span className="ml-1 flex-shrink-0">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{item.rsocial}</div>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0 ${getBadgeClass(item.numero_columnas)}`}>
                                {item.numero_columnas}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-gray-900 truncate">{item.cif}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-gray-900 truncate">{item.comercial_nombre}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-gray-900 truncate">{item.colaborador}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-gray-900">{formatDate(item.fecha)}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className={`text-sm ${getVencimientoColor(item.vencimiento)}`}>
                              {formatDate(item.vencimiento)}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex space-x-1">
                              <button 
                                onClick={() => handleViewPdf(item.id)}
                                className="inline-flex items-center p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                title="Ver PDF"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleEdit(item.id)}
                                className="inline-flex items-center p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tablet Table (lg to xl) */}
              <div className="hidden lg:block xl:hidden">
                <div className="space-y-3 p-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-semibold text-gray-900">{item.rsocial}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getBadgeClass(item.numero_columnas)}`}>
                            {item.numero_columnas}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{item.cif}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500 font-medium">Comercial:</span>
                          <div className="text-gray-900">{item.comercial_nombre}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Colaborador:</span>
                          <div className="text-gray-900">{item.colaborador}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Creación:</span>
                          <div className="text-gray-900">{formatDate(item.fecha)}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-gray-500 font-medium">Vencimiento:</span>
                          <span className={`ml-2 ${getVencimientoColor(item.vencimiento)}`}>
                            {formatDate(item.vencimiento)}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewPdf(item.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-md transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                          </button>
                          <button 
                            onClick={() => handleEdit(item.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-md transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden">
                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900 pr-2">{item.rsocial}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getBadgeClass(item.numero_columnas)}`}>
                            {item.numero_columnas}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{item.cif}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Comercial:</span> {item.comercial_nombre}
                        </div>
                        <div>
                          <span className="font-medium">Colaborador:</span> {item.colaborador}
                        </div>
                        <div>
                          <span className="font-medium">Creación:</span> {formatDate(item.fecha)}
                        </div>
                        <div>
                          <span className="font-medium">Vencimiento:</span> 
                          <span className={`ml-1 ${getVencimientoColor(item.vencimiento)}`}>
                            {formatDate(item.vencimiento)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button 
                          onClick={() => handleViewPdf(item.id)}
                          className="inline-flex items-center px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-md transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Ver PDF
                        </button>
                        <button 
                          onClick={() => handleEdit(item.id)}
                          className="inline-flex items-center px-2.5 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-md transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Información y Paginación */}
        {!isLoading && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> de{' '}
                <span className="font-medium">{totalCount}</span> resultados
                {searchTerm && (
                  <span className="ml-2">
                    (búsqueda: &ldquo;{searchTerm}&rdquo;)
                  </span>
                )}
              </div>
              <div className="flex-1 flex justify-center sm:justify-end">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {/* Botón Anterior */}
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                      currentPage === 1 || isLoading
                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>

                  {/* Números de página */}
                  {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span
                          key={`dots-${index}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      )
                    }
                    
                    const pageNumber = page as number
                    const isCurrentPage = pageNumber === currentPage
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => changePage(pageNumber)}
                        disabled={isLoading}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          isCurrentPage
                            ? 'z-10 bg-red-50 border-red-500 text-red-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        } ${isLoading ? 'cursor-not-allowed' : ''}`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}

                  {/* Botón Siguiente */}
                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                      currentPage === totalPages || isLoading
                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}