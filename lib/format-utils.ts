/**
 * Utilidades para formatear datos y valores monetarios
 */

/**
 * Formatea un valor como moneda española, manejando tanto números como texto
 * @param value - Valor a formatear (puede ser string, number, null, undefined)
 * @param fallback - Valor por defecto si no se puede formatear (default: '-')
 * @returns String formateado como moneda o el valor original si es texto
 */
export const formatCurrency = (value: any, fallback: string = '-'): string => {
  // Si es null, undefined o string vacío
  if (value == null || value === '') {
    return fallback;
  }

  // Si es string, verificar si es numérico
  if (typeof value === 'string') {
    // Si ya contiene €, devolverlo tal como está
    if (value.includes('€')) {
      return value;
    }
    
    // Si contiene % o es texto claramente no numérico, devolverlo tal como está
    if (value.includes('%')) {
      return value;
    }
    
    // Si parece ser una cantidad monetaria formateada (contiene comas o puntos como separadores)
    // y son solo números, comas y puntos, añadir el símbolo €
    const cleanValue = value.replace(/\s/g, ''); // Quitar espacios
    if (/^[\d.,]+$/.test(cleanValue)) {
      return `${value} €`;
    }
    
    // Si es string pero numérico (sin formatear), intentar convertir
    const numericValue = parseFloat(value.replace(/,/g, '.'));
    if (!isNaN(numericValue)) {
      return `${numericValue.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} €`;
    }
    
    // Si parseFloat falla, devolver el string original
    return value;
  }

  // Si es número, formatear normalmente
  if (typeof value === 'number' && !isNaN(value)) {
    return `${value.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} €`;
  }

  // Para cualquier otro caso, devolver fallback
  return fallback;
};

/**
 * Formatea un valor de franquicia, manejando casos especiales
 * @param value - Valor de franquicia
 * @param noFranchiseText - Texto cuando no hay franquicia (default: 'No')
 * @returns String formateado apropiado
 */
export const formatFranchise = (value: any, noFranchiseText: string = 'No'): string => {
  // Si es null, undefined, string vacío o '0'
  if (value == null || value === '' || value === '0') {
    return noFranchiseText;
  }

  // Usar formatCurrency para el resto de casos
  return formatCurrency(value, noFranchiseText);
};

/**
 * Formatea números grandes con separadores de miles
 * @param value - Valor numérico
 * @param fallback - Valor por defecto
 * @returns String formateado con separadores de miles
 */
export const formatNumber = (value: any, fallback: string = '-'): string => {
  if (value == null || value === '') {
    return fallback;
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) {
    return typeof value === 'string' ? value : fallback;
  }

  return numericValue.toLocaleString('es-ES');
};

/**
 * Formatea fechas en formato español
 * @param dateString - String de fecha
 * @returns Fecha formateada en formato dd/mm/aaaa
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Normaliza una URL de logo eliminando duplicaciones en el path
 * @param url - URL del logo
 * @returns URL normalizada
 */
export const normalizeLogoUrl = (url: string): string => {
  if (!url) return '';
  
  // Eliminar duplicaciones como /img/img/ -> /img/
  const normalized = url.replace(/\/img\/img\//, '/img/');
  
  return normalized;
};