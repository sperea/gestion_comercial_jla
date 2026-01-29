'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { GarantiaDecenalAPI } from '@/lib/api-garantia-decenal'
import { OfertaDecenal } from '@/lib/types/garantia-decenal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import OfertaDecenalForm from '../../../components/OfertaForm'

export default function EditarOfertaDecenalPage() {
  const params = useParams()
  const proyectoId = Number(params.id)
  const ofertaId = Number(params.ofertaId)

  const [oferta, setOferta] = useState<OfertaDecenal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOferta = async () => {
      const api = new GarantiaDecenalAPI()
      try {
        const data = await api.getOferta(ofertaId)
        setOferta(data)
      } catch (err) {
        console.error('Error fetching oferta:', err)
        setError('Error al cargar la oferta')
      } finally {
        setLoading(false)
      }
    }

    fetchOferta()
  }, [ofertaId])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !oferta) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error || 'Oferta no encontrada'}</p>
          <Link 
            href={`/comparativos/garantia-decenal/${proyectoId}`} 
            className="mt-2 inline-block text-red-600 hover:text-red-800 font-medium"
          >
            &larr; Volver al proyecto
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link 
          href={`/comparativos/garantia-decenal/${proyectoId}`} 
          className="text-sm text-gray-500 hover:text-primary mb-2 inline-block"
        >
          &larr; Volver al proyecto
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Oferta - Garantía Decenal</h1>
        <p className="text-gray-600">
          {oferta.compania_info?.rsocial || `Compañía ${oferta.compania}`}
        </p>
      </div>

      <OfertaDecenalForm proyectoId={proyectoId} oferta={oferta} isEditing={true} />
    </div>
  )
}
