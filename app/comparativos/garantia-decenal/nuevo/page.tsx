'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { GarantiaDecenalAPI } from '@/lib/api-garantia-decenal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'

export default function NuevoProyectoDecenalPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { addToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fecha_vigencia: '',
    tomador: '',
    obra: '',
    situacion: '',
    duracion: ''
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      addToast({ type: 'error', message: 'No hay sesión de usuario activa' })
      return
    }

    setLoading(true)
    
    try {
      const api = new GarantiaDecenalAPI()
      
      const payload = {
        ...formData,
        comercial: Number(user.id)
      }
      
      const newProject = await api.createProyecto(payload)
      
      addToast({ type: 'success', message: 'Proyecto creado exitosamente' })
      router.push(`/comparativos/garantia-decenal/${newProject.id}`)
      
    } catch (error) {
      console.error('Error creating project:', error)
      addToast({ type: 'error', message: 'Error al crear el proyecto. Verifica los datos.' })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/comparativos/garantia-decenal" className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
          &larr; Volver al listado
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Proyecto Garantía Decenal</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <p className="text-sm text-green-700">
              <strong>Comercial asignado:</strong> {user?.full_name || user?.name || user?.email}
            </p>
          </div>

          <Input
            label="Tomador"
            name="tomador"
            value={formData.tomador}
            onChange={handleChange}
            placeholder="Ej: Constructora ABC S.L."
            required
          />

          <Input
            label="Obra"
            name="obra"
            value={formData.obra}
            onChange={handleChange}
            placeholder="Ej: Bloque Residencial con 19 viviendas"
            required
          />
          
          <Input
            label="Situación"
            name="situacion"
            value={formData.situacion}
            onChange={handleChange}
            placeholder="Ej: COLLADO VILLALBA"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Fecha de Vigencia"
              name="fecha_vigencia"
              type="date"
              value={formData.fecha_vigencia}
              onChange={handleChange}
              required
            />
            
            <Input
              label="Duración de la Obra"
              name="duracion"
              value={formData.duracion}
              onChange={handleChange}
              placeholder="Ej: 18 MESES"
              required
            />
          </div>

          <div className="flex justify-end pt-4 space-x-3">
             <Link href="/comparativos/garantia-decenal">
               <Button type="button" variant="outline">
                 Cancelar
               </Button>
             </Link>
             <Button type="submit" disabled={loading}>
               {loading ? 'Creando...' : 'Crear Proyecto'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
