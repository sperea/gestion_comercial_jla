'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import OfertaForm from '../../../components/OfertaForm'
import { TodoRiesgoAPI } from '@/lib/api-todo-riesgo'
import { OfertaTodoRiesgo } from '@/lib/types/todo-riesgo'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function EditarOfertaPage() {
  const params = useParams()
  const projectId = Number(params.id)
  const ofertaId = Number(params.ofertaId)
  
  const [oferta, setOferta] = useState<OfertaTodoRiesgo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOferta = async () => {
      try {
        const api = new TodoRiesgoAPI()
        const data = await api.getOferta(ofertaId)
        setOferta(data)
      } catch (error) {
        console.error('Error fetching oferta:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (ofertaId) {
      fetchOferta()
    }
  }, [ofertaId])

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
        <p className="text-gray-600">
           #{oferta.id} - {oferta.compania_info?.rsocial || 'Compañía desconocida'}
        </p>
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
