'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TodoRiesgoAPI } from '@/lib/api-todo-riesgo'
import { OfertaTodoRiesgo, Cobertura, CompaniaInfo, Franquicia } from '@/lib/types/todo-riesgo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'

interface OfertaFormProps {
  proyectoId: number
  oferta?: OfertaTodoRiesgo
  isEditing?: boolean
}

export default function OfertaForm({ proyectoId, oferta, isEditing = false }: OfertaFormProps) {
  const router = useRouter()
  const { addToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  const [companias, setCompanias] = useState<CompaniaInfo[]>([])
  const [coberturas, setCoberturas] = useState<Cobertura[]>([])
  
  const [formData, setFormData] = useState({
    compania: '',
    capital: '',
    tasas: '',
    prima_neta: '',
    prima_total: '',
    forma_pago: '',
    aviso: '',
    coberturas: [] as number[],
    franquicias: [] as Franquicia[],
    archivo: null as File | null
  })

  // Cargar datos iniciales (compañías, coberturas)
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true)
      const api = new TodoRiesgoAPI()
      try {
        const [companiasRes, coberturasRes] = await Promise.all([
          api.getCompanias(),
          api.getCoberturas()
        ])
        
        setCompanias(companiasRes.results || [])
        setCoberturas(coberturasRes.results || [])
        
        if (isEditing && oferta) {
          setFormData({
            compania: oferta.compania.toString(),
            capital: oferta.capital,
            tasas: oferta.tasas,
            prima_neta: oferta.prima_neta,
            prima_total: oferta.prima_total,
            forma_pago: oferta.forma_pago,
            aviso: oferta.aviso,
            coberturas: oferta.coberturas || [],
            franquicias: oferta.franquicias_info || [],
            archivo: null
          })
        }
      } catch (error) {
        console.error('Error loading form data:', error)
        addToast({ type: 'error', message: 'Error al cargar los datos del formulario' })
      } finally {
        setInitialLoading(false)
      }
    }
    
    loadData()
  }, [isEditing, oferta])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCoberturaChange = (coberturaId: number) => {
    setFormData(prev => {
      const exists = prev.coberturas.includes(coberturaId)
      if (exists) {
        return { ...prev, coberturas: prev.coberturas.filter(id => id !== coberturaId) }
      } else {
        return { ...prev, coberturas: [...prev.coberturas, coberturaId] }
      }
    })
  }
  
  // Gestión de franquicias
  const addFranquicia = () => {
    setFormData(prev => ({
      ...prev,
      franquicias: [...prev.franquicias, { descripcion: '', valor: '' }]
    }))
  }

  const removeFranquicia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      franquicias: prev.franquicias.filter((_, i) => i !== index)
    }))
  }

  const handleFranquiciaChange = (index: number, field: keyof Franquicia, value: string) => {
    setFormData(prev => {
      const newFranquicias = [...prev.franquicias]
      newFranquicias[index] = { ...newFranquicias[index], [field]: value }
      return { ...prev, franquicias: newFranquicias }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const api = new TodoRiesgoAPI()
    
    // Decidir si usar FormData o JSON
    // - FormData: solo cuando hay un archivo NUEVO
    // - JSON: en todos los demás casos
    const hasNewFile = formData.archivo !== null
    const validFranquicias = formData.franquicias.filter(f => f.descripcion && f.valor)
    
    let payload: FormData | any
    
    if (hasNewFile) {
      // Usar FormData cuando hay archivo
      const fd = new FormData()
      fd.append('proyecto', proyectoId.toString())
      fd.append('compania', formData.compania)
      fd.append('capital', formData.capital)
      fd.append('tasas', formData.tasas)
      fd.append('prima_neta', formData.prima_neta)
      fd.append('prima_total', formData.prima_total)
      fd.append('forma_pago', formData.forma_pago)
      fd.append('aviso', formData.aviso)
      formData.coberturas.forEach(id => fd.append('coberturas', id.toString()))
      if (validFranquicias.length > 0) {
        fd.append('franquicias', JSON.stringify(validFranquicias))
      }
      fd.append('archivo', formData.archivo!)
      payload = fd
      console.log('🔍 Using FormData (new file)')
    } else {
      // Usar JSON cuando NO hay archivo nuevo
      payload = {
        proyecto: proyectoId,
        compania: parseInt(formData.compania),
        capital: formData.capital,
        tasas: formData.tasas,
        prima_neta: formData.prima_neta,
        prima_total: formData.prima_total,
        forma_pago: formData.forma_pago,
        aviso: formData.aviso,
        coberturas: formData.coberturas,
        franquicias: validFranquicias
      }
      console.log('🔍 Using JSON (no new file):', payload)
    }

    try {
      if (isEditing && oferta) {
        await api.updateOferta(oferta.id, payload)
        addToast({ type: 'success', message: 'Oferta actualizada correctamente' })
      } else {
        await api.createOferta(payload)
        addToast({ type: 'success', message: 'Oferta creada correctamente' })
      }
      
      router.push(`/comparativos/todo-riesgo-construccion/${proyectoId}`)
      
    } catch (error) {
      console.error('Error saving oferta:', error)
      addToast({ type: 'error', message: `Error al guardar la oferta: ${(error as Error).message}` })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <LoadingSpinner />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Sección 1: Datos Generales */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Información Económica</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="md:col-span-2">
            <label htmlFor="compania" className="block text-sm font-medium text-gray-700 mb-1">
              Compañía Aseguradora
            </label>
            <select
              id="compania"
              name="compania"
              value={formData.compania}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            >
              <option value="">Seleccione una compañía</option>
              {companias.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.rsocial}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Capital Asegurado (€)"
            name="capital"
             // @ts-ignore
            type="number"
            step="0.01"
            value={formData.capital}
            onChange={handleChange}
            required
            placeholder="0.00"
          />

          <Input
            label="Tasas (%)"
            name="tasas"
            // @ts-ignore
            type="number"
            step="0.01"
            value={formData.tasas}
            onChange={handleChange}
            placeholder="0.00"
            required
          />

          <Input
            label="Prima Neta (€)"
            name="prima_neta"
             // @ts-ignore
            type="number"
            step="0.01"
            value={formData.prima_neta}
            onChange={handleChange}
            placeholder="0.00"
            required
          />

          <Input
            label="Prima Total (€)"
            name="prima_total"
             // @ts-ignore
            type="number"
            step="0.01"
            value={formData.prima_total}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
          
          <Input
            label="Forma de Pago"
            name="forma_pago"
            value={formData.forma_pago}
            onChange={handleChange}
            placeholder="Ej: Anual, Semestral, Única..."
            required
          />
        </div>
        
        <div className="mt-4">
            <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 mb-1">
              Archivo Adjunto (Opcional)
            </label>
            <input
              id="archivo"
              name="archivo"
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFormData(prev => ({ ...prev, archivo: e.target.files![0] }))
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
            {isEditing && oferta?.archivo && (
               <p className="mt-1 text-xs text-gray-500">
                 Archivo actual: <a href={oferta.archivo} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver archivo</a>
               </p>
            )}
        </div>

        <div className="mt-4">
             <label htmlFor="aviso" className="block text-sm font-medium text-gray-700 mb-1">
              Aviso / Notas
            </label>
            <textarea
              id="aviso"
              name="aviso"
              rows={3}
              value={formData.aviso}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Información adicional sobre la oferta..."
            />
        </div>
      </div>

      {/* Sección 2: Coberturas */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Coberturas Incluidas</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {coberturas.map((cob) => {
            const isSelected = formData.coberturas.includes(cob.id)
            return (
              <div
                key={cob.id}
                onClick={() => handleCoberturaChange(cob.id)}
                className={`
                  cursor-pointer px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between group select-none
                  ${isSelected 
                    ? 'bg-primary/5 border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.15)] transform scale-[1.01]' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-500 hover:bg-gray-50'
                  }
                `}
              >
                <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  {cob.descripcion}
                </span>
                
                {isSelected && (
                  <div className="bg-primary text-white rounded-full p-0.5 ml-2 shadow-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-right">
          {formData.coberturas.length} coberturas seleccionadas
        </p>
      </div>

      {/* Sección 3: Franquicias */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-medium text-gray-900">Franquicias</h3>
          <Button type="button" size="sm" variant="outline" onClick={addFranquicia}>
            + Añadir Franquicia
          </Button>
        </div>
        
        {formData.franquicias.length === 0 ? (
          <p className="text-gray-500 text-sm italic py-4 text-center">No hay franquicias añadidas.</p>
        ) : (
          <div className="space-y-4">
            {formData.franquicias.map((franq, index) => (
              <div key={index} className="flex gap-4 items-start bg-gray-50 p-3 rounded-md">
                <div className="flex-1">
                  <Input
                    label="Descripción"
                    value={franq.descripcion}
                    onChange={(e) => handleFranquiciaChange(index, 'descripcion', e.target.value)}
                    placeholder="Ej: Daños por agua"
                    className="mb-0 bg-white"
                  />
                </div>
                <div className="flex-1">
                   <Input
                    label="Valor"
                    value={franq.valor}
                    onChange={(e) => handleFranquiciaChange(index, 'valor', e.target.value)}
                    placeholder="Ej: 300€"
                    className="mb-0 bg-white"
                  />
                </div>
                <div className="pt-7">
                  <button 
                    type="button" 
                    onClick={() => removeFranquicia(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Eliminar franquicia"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 space-x-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar Oferta' : 'Crear Oferta')}
        </Button>
      </div>
    </form>
  )
}
