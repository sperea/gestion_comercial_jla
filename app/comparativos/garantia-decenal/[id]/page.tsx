'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { GarantiaDecenalAPI } from '@/lib/api-garantia-decenal'
import { DecenalProyecto, OfertaDecenal } from '@/lib/types/garantia-decenal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { sortCoberturas } from '@/lib/utils/sort-coberturas'

export default function ProyectoDecenalDetallePage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const id = Number(params.id)

  const [project, setProject] = useState<DecenalProyecto | null>(null)
  const [offers, setOffers] = useState<OfertaDecenal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offerErrorDetails, setOfferErrorDetails] = useState<string | null>(null)

  const fetchProjectData = useCallback(async () => {
    if (authLoading || !id) return

    const api = new GarantiaDecenalAPI()

    setLoading(true)
    setError(null)
    setOfferErrorDetails(null)

    try {
      // Fetch project details
      const projectData = await api.getProyecto(id)
      setProject(projectData)

      // Fetch offers
      try {
        const offersData = await api.getOfertas(id)
        setOffers(offersData.results || [])
      } catch (offersErr: any) {
        console.error('Error fetching offers:', offersErr)
        setOfferErrorDetails(offersErr.message || 'Error desconocido al cargar ofertas')
        // Don't block the page if offers fail
      }

    } catch (err) {
      console.error('Error fetching project:', err)
      setError('Error al cargar el proyecto. Puede que no exista o no tengas permisos.')
    } finally {
      setLoading(false)
    }
  }, [authLoading, user, id])

  useEffect(() => {
    fetchProjectData()
  }, [fetchProjectData])

  const handleDeleteProject = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) return

    const api = new GarantiaDecenalAPI()

    try {
      await api.deleteProyecto(id)
      addToast({ type: 'success', message: 'Proyecto eliminado correctamente' })
      router.push('/comparativos/garantia-decenal')
    } catch (err) {
      console.error('Error deleting project:', err)
      addToast({ type: 'error', message: 'Error al eliminar el proyecto' })
    }
  }

  const handleDeleteOferta = async (ofertaId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta oferta? Esta acción no se puede deshacer.')) return

    const api = new GarantiaDecenalAPI()

    try {
      await api.deleteOferta(ofertaId)
      addToast({ type: 'success', message: 'Oferta eliminada correctamente' })
      // Recargar datos del proyecto
      fetchProjectData()
    } catch (err) {
      console.error('Error deleting oferta:', err)
      addToast({ type: 'error', message: 'Error al eliminar la oferta' })
    }
  }

  const handleDownloadPDF = async () => {
    if (!project) return
    
    try {
      addToast({ type: 'success', message: 'Generando PDF...' })
      
      // Importar dinámicamente para evitar problemas de SSR
      const { generateProyectoDecenalPDF } = await import('@/lib/pdf-generator-decenal')
      
      generateProyectoDecenalPDF(project, offers)
      
      addToast({ type: 'success', message: 'PDF descargado correctamente' })
    } catch (err) {
      console.error('Error downloading PDF:', err)
      addToast({ type: 'error', message: 'Error al generar el PDF' })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error || 'Proyecto no encontrado'}</p>
          <Link href="/comparativos/garantia-decenal" className="mt-2 inline-block text-red-600 hover:text-red-800 font-medium">
            &larr; Volver al listado
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <Link href="/comparativos/garantia-decenal" className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
            &larr; Volver al listado
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{project.obra}</h1>
          <p className="text-gray-600">{project.tomador}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadPDF} className="text-blue-600 border-blue-200 hover:bg-blue-50">
            📄 Descargar PDF
          </Button>
          <Button variant="outline" onClick={handleDeleteProject} className="text-red-600 border-red-200 hover:bg-red-50">
            Eliminar Proyecto
          </Button>
        </div>
      </div>

      {/* Project Details Card */}
      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <span className="block text-sm font-medium text-gray-500">Situación</span>
            <span className="block mt-1 text-gray-900">{project.situacion}</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-500">Vigencia</span>
            <span className="block mt-1 text-gray-900">{project.fecha_vigencia}</span>
          </div>
           <div>
            <span className="block text-sm font-medium text-gray-500">Duración de la Obra</span>
            <span className="block mt-1 text-gray-900">{project.duracion}</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-500">Comercial</span>
            <span className="block mt-1 text-gray-900">
               {project.comercial_info ? 
                  `${project.comercial_info.first_name} ${project.comercial_info.last_name}` : 
                  `ID: ${project.comercial}`}
            </span>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-500">Fecha de Creación</span>
            <span className="block mt-1 text-gray-900">{project.fecha_creacion}</span>
          </div>
        </div>
      </Card>

      {/* Offers Section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Ofertas ({offers.length})</h2>
        <Link href={`/comparativos/garantia-decenal/${id}/oferta/nueva`}>
          <Button>
            + Nueva Oferta
          </Button>
        </Link>
      </div>

      {offerErrorDetails && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm leading-5 font-medium text-red-800">
                Error al cargar ofertas
              </h3>
              <div className="mt-2 text-sm leading-5 text-red-700 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto bg-red-100 p-2 rounded">
                {offerErrorDetails}
              </div>
            </div>
          </div>
        </div>
      )}

      {offers.length === 0 && !offerErrorDetails ? (
        <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500 mb-4">No hay ofertas registradas para este proyecto.</p>
          <Link href={`/comparativos/garantia-decenal/${id}/oferta/nueva`}>
            <Button variant="outline" size="sm">
              Crear primera oferta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {offer.compania_info?.logo && (
                    <img 
                      src={offer.compania_info.logo} 
                      alt={offer.compania_info.rsocial}
                      className="w-12 h-12 object-contain rounded border border-gray-200 bg-white p-1"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {offer.compania_info?.rsocial || `Compañía ${offer.compania}`}
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Capital:</span>
                    <span className="font-medium">{Number(offer.capital.replace(',', '.')).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Franquicia:</span>
                    <span className="font-medium">{offer.franquicia}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tasas:</span>
                    <span className="font-medium">{offer.tasas}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Prima Neta:</span>
                    <span className="font-medium">{Number(offer.prima_neta.replace(',', '.')).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                  </div>
                   <div className="flex justify-between text-sm pt-2 border-t mt-2">
                    <span className="font-bold text-gray-700">Prima Total:</span>
                    <span className="font-bold text-primary">{Number(offer.prima_total.replace(',', '.')).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                   <p className="font-medium mb-1">Coberturas:</p>
                   <div className="flex flex-wrap gap-1">
                     {offer.coberturas_info && sortCoberturas(offer.coberturas_info).map(c => (
                       <span key={c.id} className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                         {c.descripcion}
                       </span>
                     ))}
                   </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t flex justify-between gap-2">
                 <Link href={`/comparativos/garantia-decenal/${id}/oferta/${offer.id}`} className="flex-1">
                   <Button variant="outline" size="sm" className="w-full">
                     Editar / Ver
                   </Button>
                 </Link>
                 {offer.archivo && (
                   <a 
                     href={offer.archivo} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                     title="Ver archivo PDF"
                   >
                     📄
                   </a>
                 )}
                 <button
                   onClick={(e) => {
                     e.preventDefault()
                     handleDeleteOferta(offer.id)
                   }}
                   className="flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                   title="Eliminar oferta"
                 >
                   🗑️
                 </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
