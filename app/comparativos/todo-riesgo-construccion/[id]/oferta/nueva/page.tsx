'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import OfertaForm from '../../../components/OfertaForm'
import { Card } from '@/components/ui/Card'

export default function NuevaOfertaPage() {
  const params = useParams()
  const projectId = Number(params.id)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href={`/comparativos/todo-riesgo-construccion/${projectId}`} className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
          &larr; Volver al proyecto
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Oferta</h1>
        <p className="text-gray-600">Crear una nueva oferta para el proyecto #{projectId}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <OfertaForm proyectoId={projectId} />
      </div>
    </div>
  )
}
