'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import OfertaDecenalForm from '../../../components/OfertaForm'

export default function NuevaOfertaDecenalPage() {
  const params = useParams()
  const proyectoId = Number(params.id)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link 
          href={`/comparativos/garantia-decenal/${proyectoId}`} 
          className="text-sm text-gray-500 hover:text-primary mb-2 inline-block"
        >
          &larr; Volver al proyecto
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Oferta - Garantía Decenal</h1>
      </div>

      <OfertaDecenalForm proyectoId={proyectoId} />
    </div>
  )
}
