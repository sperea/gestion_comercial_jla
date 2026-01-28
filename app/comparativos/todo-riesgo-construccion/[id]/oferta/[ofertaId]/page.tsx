'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import OfertaForm from '../../../components/OfertaForm'
import { TodoRiesgoAPI } from '@/lib/api-todo-riesgo'
import { OfertaTodoRiesgo, TodoRiesgoProyecto } from '@/lib/types/todo-riesgo'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function EditarOfertaPage() {
  const params = useParams()
  const projectId = Number(params.id)
  const ofertaId = Number(params.ofertaId)
  
  const [oferta, setOferta] = useState<OfertaTodoRiesgo | null>(null)
  const [proyecto, setProyecto] = useState<TodoRiesgoProyecto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = new TodoRiesgoAPI()
        const [ofertaData, proyectoData] = await Promise.all([
          api.getOferta(ofertaId),
          api.getProyecto(projectId)
        ])
        setOferta(ofertaData)
        setProyecto(proyectoData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (ofertaId && projectId) {
      fetchData()
    }
  }, [ofertaId, projectId])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!oferta) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-red-600">
        Oferta no encontrada
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href={`/comparativos/todo-riesgo-construccion/${projectId}`} className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
          &larr; Volver al proyecto
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Oferta</h1>
        <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p>
                <span className="font-medium text-gray-900">Oferta #{oferta.id}</span>
                {' - '}
                <span>{oferta.compania_info?.rsocial || 'Compañía desconocida'}</span>
            </p>
            {proyecto && (
                <div className="flex gap-4 pt-1">
                    <p>
                        <span className="font-medium text-gray-700">Tomador:</span> {proyecto.tomador}
                    </p>
                    <p>
                        <span className="font-medium text-gray-700">Obra:</span> {proyecto.obra || 'N/A'}
                    </p>
                </div>
            )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <OfertaForm 
          proyectoId={projectId} 
          oferta={oferta} 
          isEditing={true} 
        />
      </div>
    </div>
  )
}
