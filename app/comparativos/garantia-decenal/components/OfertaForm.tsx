'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GarantiaDecenalAPI } from '@/lib/api-garantia-decenal'
import { OfertaDecenal, Cobertura, CompaniaInfo } from '@/lib/types/garantia-decenal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import CurrencyInput from 'react-currency-input-field'
import { sortCoberturas } from '@/lib/utils/sort-coberturas'

interface OfertaFormProps {
  proyectoId: number
  oferta?: OfertaDecenal
  isEditing?: boolean
}

export default function OfertaDecenalForm({ proyectoId, oferta, isEditing = false }: OfertaFormProps) {
  const router = useRouter()
  const { addToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  const [companias, setCompanias] = useState<CompaniaInfo[]>([])
  const [coberturas, setCoberturas] = useState<Cobertura[]>([])
  
  const [formData, setFormData] = useState({
    compania: '',
    capital: '',
    franquicia: '',
    tasas: '',
    prima_neta: '',
    prima_total: '',
    forma_pago: 'Se emitiría un primer recibo por el 30% de la prima total en el momento de la emisión de la póliza, y el 70% restante se abonaría\ncon la entrada en cobertura de la garantía decenal.',
    aviso: 'Para la emisión de las condiciones ofertadas es imprescindible la revisión del informe geotécnico, informe de\ndefinición de riesgo, D.0 y D.1.1 (si hubiese cimentación especial).\n\nEl presente documento es un resumen con carácter meramente informativo, siendo el contrato original el\núnico documento válido.',
    coberturas: [] as number[],
    archivo: null as File | null
  })

  // Cargar datos iniciales (compañías, coberturas)
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true)
      const api = new GarantiaDecenalAPI()
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
            franquicia: oferta.franquicia,
            tasas: oferta.tasas,
            prima_neta: oferta.prima_neta,
            prima_total: oferta.prima_total,
            forma_pago: oferta.forma_pago,
            aviso: oferta.aviso,
            coberturas: oferta.coberturas || [],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const api = new GarantiaDecenalAPI()
    
    // Decidir si usar FormData o JSON
    const hasNewFile = formData.archivo !== null
    
    let payload: FormData | any
    
    if (hasNewFile) {
      // Usar FormData cuando hay archivo
      const fd = new FormData()
      fd.append('proyecto', proyectoId.toString())
      fd.append('compania', formData.compania)
      fd.append('capital', formData.capital)
      fd.append('franquicia', formData.franquicia)
      fd.append('tasas', formData.tasas)
      fd.append('prima_neta', formData.prima_neta)
      fd.append('prima_total', formData.prima_total)
      fd.append('forma_pago', formData.forma_pago)
      fd.append('aviso', formData.aviso)
      formData.coberturas.forEach(id => fd.append('coberturas', id.toString()))
      fd.append('archivo', formData.archivo!)
      payload = fd
      console.log('🔍 Using FormData (new file)')
    } else {
      // Usar JSON cuando NO hay archivo nuevo
      payload = {
        proyecto: proyectoId,
        compania: formData.compania ? parseInt(formData.compania) : null,
        capital: formData.capital,
        franquicia: formData.franquicia,
        tasas: formData.tasas,
        prima_neta: formData.prima_neta,
        prima_total: formData.prima_total,
        forma_pago: formData.forma_pago,
        aviso: formData.aviso,
        coberturas: formData.coberturas
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
      
      router.push(`/comparativos/garantia-decenal/${proyectoId}`)
      
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

          <div className="space-y-1">
            <label htmlFor="capital" className="block text-sm font-medium text-gray-700">
              Capital Asegurado (€) *
            </label>
            <CurrencyInput
              id="capital"
              name="capital"
              placeholder="0,00 €"
              decimalsLimit={2}
              decimalScale={2}
              decimalSeparator=","
              groupSeparator="."
              suffix=" €"
              onValueChange={(value: string | undefined) => {
                setFormData(prev => ({ ...prev, capital: value || '' }))
              }}
              value={formData.capital}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
            />
          </div>

          <Input
            label="Franquicia"
            name="franquicia"
            value={formData.franquicia}
            onChange={handleChange}
            placeholder="Ej: 1% MAX 2.500"
            required
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

          <div className="space-y-1">
            <label htmlFor="prima_neta" className="block text-sm font-medium text-gray-700">
              Prima Neta (€) *
            </label>
            <CurrencyInput
              id="prima_neta"
              name="prima_neta"
              placeholder="0,00 €"
              decimalsLimit={2}
              decimalScale={2}
              decimalSeparator=","
              groupSeparator="."
              suffix=" €"
              onValueChange={(value: string | undefined) => {
                setFormData(prev => ({ ...prev, prima_neta: value || '' }))
              }}
              value={formData.prima_neta}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="prima_total" className="block text-sm font-medium text-gray-700">
              Prima Total (€) *
            </label>
            <CurrencyInput
              id="prima_total"
              name="prima_total"
              placeholder="0,00 €"
              decimalsLimit={2}
              decimalScale={2}
              decimalSeparator=","
              groupSeparator="."
              suffix=" €"
              onValueChange={(value: string | undefined) => {
                setFormData(prev => ({ ...prev, prima_total: value || '' }))
              }}
              value={formData.prima_total}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label htmlFor="forma_pago" className="block text-sm font-medium text-gray-700 mb-1">
            Forma de Pago
          </label>
          <textarea
            id="forma_pago"
            name="forma_pago"
            rows={3}
            value={formData.forma_pago}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Forma de pago..."
            required
          />
        </div>

        <div className="mt-4">
            <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 mb-1">
              Archivo Adjunto
            </label>
            
            {isEditing && oferta?.archivo && (
               <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                   <span className="text-sm text-blue-900 font-medium">Archivo actual disponible</span>
                 </div>
                 <a 
                   href={oferta.archivo} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-sm bg-white text-blue-600 px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                 >
                   Ver / Descargar
                 </a>
               </div>
            )}

            <p className="text-xs text-gray-500 mb-2">
              {isEditing && oferta?.archivo ? 'Subir un nuevo archivo para reemplazar el actual:' : 'Subir archivo (PDF, Imágenes...)'}
            </p>

            <input
              id="archivo"
              name="archivo"
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFormData(prev => ({ ...prev, archivo: e.target.files![0] }))
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
            />
        </div>

        <div className="mt-4">
             <label htmlFor="aviso" className="block text-sm font-medium text-gray-700 mb-1">
              Aviso / Notas
            </label>
            <textarea
              id="aviso"
              name="aviso"
              rows={4}
              value={formData.aviso}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Información adicional sobre la oferta..."
            />
        </div>
      </div>

      {/* Sección 2: Coberturas */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-medium text-gray-900">Coberturas Incluidas</h3>
            <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={async () => {
                    const api = new GarantiaDecenalAPI()
                    try {
                        const res = await api.getCoberturas()
                        setCoberturas(res.results || [])
                        addToast({ type: 'success', message: 'Coberturas actualizadas' })
                    } catch (error) {
                        console.error('Error reloading coberturas', error)
                        addToast({ type: 'error', message: 'Error al recargar coberturas' })
                    }
                }}
                title="Recargar listado de coberturas"
            >
                🔄 Recargar
            </Button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortCoberturas(coberturas).map((cob) => {
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
