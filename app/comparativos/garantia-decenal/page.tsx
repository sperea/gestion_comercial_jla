'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { GarantiaDecenalAPI } from '@/lib/api-garantia-decenal'
import { DecenalProyecto, PaginatedResponse } from '@/lib/types/garantia-decenal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'

export default function GarantiaDecenalPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [projects, setProjects] = useState<DecenalProyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination & Filters
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on search change
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchProjects = useCallback(async () => {
    if (authLoading) return 
    
    const api = new GarantiaDecenalAPI()

    setLoading(true)
    setError(null)
    
    try {
      const response = await api.getProyectos({
        page,
        page_size: 10,
        search: debouncedSearch,
        ordering: '-fecha_creacion'
      })
      
      setProjects(response.results || [])
      setTotalCount(response.count || 0)
      setTotalPages(Math.ceil((response.count || 0) / 10))
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('Error al cargar los proyectos. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [authLoading, user, page, debouncedSearch])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = async () => {
    router.push('/comparativos/garantia-decenal/nuevo')
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/comparativos" className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
            &larr; Volver a Comparativos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos Garantía Decenal</h1>
        </div>
        <Button onClick={handleCreateProject}>
          + Nuevo Proyecto
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="max-w-md">
           <Input 
             placeholder="Buscar por obra, tomador o situación..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No se encontraron proyectos.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {projects.map((project) => (
              <li key={project.id}>
                <Link href={`/comparativos/garantia-decenal/${project.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary truncate">
                        {project.obra}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {project.situacion}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Tomador: {project.tomador}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Comercial: {project.comercial_info ? 
                            `${project.comercial_info.first_name} ${project.comercial_info.last_name}` : 
                            `ID: ${project.comercial}`}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Vigencia: {project.fecha_vigencia}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="outline" 
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-700">
            Página {page} de {totalPages}
          </span>
          <Button 
            variant="outline" 
            disabled={page >= totalPages} 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
