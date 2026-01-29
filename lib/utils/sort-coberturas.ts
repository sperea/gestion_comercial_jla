import { Cobertura } from '@/lib/types/garantia-decenal'

/**
 * Ordena las coberturas alfabéticamente, excepto "Garantía básica" que siempre va primero
 * @param coberturas Array de coberturas a ordenar
 * @returns Array de coberturas ordenado
 */
export function sortCoberturas(coberturas: Cobertura[]): Cobertura[] {
  if (!coberturas || coberturas.length === 0) return []
  
  return [...coberturas].sort((a, b) => {
    const aDesc = a.descripcion.toLowerCase()
    const bDesc = b.descripcion.toLowerCase()
    
    // "Garantía básica" siempre va primero
    if (aDesc === 'garantía básica') return -1
    if (bDesc === 'garantía básica') return 1
    
    // El resto en orden alfabético
    return aDesc.localeCompare(bDesc, 'es')
  })
}
