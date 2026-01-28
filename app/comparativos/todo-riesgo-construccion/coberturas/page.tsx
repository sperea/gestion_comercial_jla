'use client'

import React, { useState, useEffect } from 'react'
import { TodoRiesgoAPI } from '@/lib/api-todo-riesgo'
import { Cobertura } from '@/lib/types/todo-riesgo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'

export default function CoberturasPage() {
  const { addToast } = useToast()
  
  const [coberturas, setCoberturas] = useState<Cobertura[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newValue, setNewValue] = useState('')

  const fetchCoberturas = async () => {
    try {
      const api = new TodoRiesgoAPI()
      const data = await api.getCoberturas()
      setCoberturas(data.results || [])
    } catch (error) {
      console.error('Error fetching coberturas:', error)
      addToast({ type: 'error', message: 'Error al cargar coberturas' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoberturas()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newValue.trim()) return

    try {
      const api = new TodoRiesgoAPI()
      await api.createCobertura({ descripcion: newValue })
      addToast({ type: 'success', message: 'Cobertura creada' })
      setNewValue('')
      fetchCoberturas()
    } catch (error) {
        console.error('Error creating cobertura:', error)
        addToast({ type: 'error', message: 'Error al crear cobertura' })
    }
  }

  const handleUpdate = async (id: number) => {
    try {
      const api = new TodoRiesgoAPI()
      await api.updateCobertura(id, { descripcion: editValue })
      addToast({ type: 'success', message: 'Cobertura actualizada' })
      setEditingId(null)
      fetchCoberturas()
    } catch (error) {
      console.error('Error updating cobertura:', error)
      addToast({ type: 'error', message: 'Error al actualizar cobertura' })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cobertura?')) return

    try {
      const api = new TodoRiesgoAPI()
      await api.deleteCobertura(id)
      addToast({ type: 'success', message: 'Cobertura eliminada' })
      fetchCoberturas()
    } catch (error) {
      console.error('Error deleting cobertura:', error)
      addToast({ type: 'error', message: 'Error al eliminar cobertura' })
    }
  }

  const startEditing = (cob: Cobertura) => {
    setEditingId(cob.id)
    setEditValue(cob.descripcion)
  }

  if (loading) return <div className="flex justify-center p-8"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Coberturas</h1>

      {/* Create Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h2 className="text-lg font-medium mb-4">Añadir Nueva Cobertura</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <Input
            placeholder="Descripción de la cobertura"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!newValue.trim()}>
            Añadir
          </Button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coberturas.map((cob) => (
              <tr key={cob.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cob.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === cob.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="max-w-md"
                      autoFocus
                    />
                  ) : (
                    cob.descripcion
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  {editingId === cob.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdate(cob.id)}
                        className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                        title="Guardar"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="Cancelar"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEditing(cob)}
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                        title="Editar cobertura"
                      >
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cob.id)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar cobertura"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {coberturas.length === 0 && (
                <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        No hay coberturas registradas.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
