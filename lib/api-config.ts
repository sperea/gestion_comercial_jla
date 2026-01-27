/**
 * Módulo de configuración centralizada para todas las llamadas API
 * 
 * Este módulo asegura que TODAS las llamadas al backend Django
 * usen consistentemente la variable de entorno NEXT_PUBLIC_API_URL
 */

/**
 * Obtiene la URL base del backend desde las variables de entorno
 * 
 * @returns URL base del backend sin trailing slash
 * @throws Error si NEXT_PUBLIC_API_URL no está definida en producción
 */
export function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL
  
  // En producción, la URL del backend DEBE estar configurada
  if (process.env.NODE_ENV === 'production' && !backendUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL no está configurada. ' +
      'Configure esta variable de entorno antes de desplegar a producción.'
    )
  }
  
  // En desarrollo, mostrar warning si no está configurada
  if (process.env.NODE_ENV === 'development' && !backendUrl) {
    console.warn(
      '⚠️ NEXT_PUBLIC_API_URL no está configurada. ' +
      'Configure esta variable en .env.local para evitar errores.'
    )
    throw new Error('NEXT_PUBLIC_API_URL no está configurada')
  }
  
  // Eliminar trailing slash para consistencia
  return backendUrl!.replace(/\/$/, '')
}

/**
 * Construye una URL completa del backend concatenando la base con el endpoint
 * 
 * @param endpoint - Ruta del endpoint (debe comenzar con /)
 * @returns URL completa del endpoint
 * @example
 * buildBackendUrl('/api/token/') // 'https://api.jlaasociados.net/api/token/'
 * buildBackendUrl('/catastro/inmuebles/') // 'https://api.jlaasociados.net/catastro/inmuebles/'
 */
export function buildBackendUrl(endpoint: string): string {
  const base = getBackendUrl()
  
  // Asegurar que el endpoint comienza con /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  return `${base}${normalizedEndpoint}`
}

/**
 * Valida que la configuración de la API esté correctamente establecida
 * Útil para llamar al inicio de la aplicación o en tests
 * 
 * @returns Objeto con estado de validación y mensaje
 */
export function validateApiConfig(): { isValid: boolean; message: string } {
  try {
    const url = getBackendUrl()
    
    // Validar que sea una URL válida
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return {
        isValid: false,
        message: `NEXT_PUBLIC_API_URL debe comenzar con http:// o https://. Valor actual: ${url}`
      }
    }
    
    return {
      isValid: true,
      message: `Configuración válida: ${url}`
    }
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Error de configuración desconocido'
    }
  }
}

/**
 * Configuración de endpoints del backend
 * Centraliza todas las rutas de la API para facilitar mantenimiento
 */
export const API_ENDPOINTS = {
  // Autenticación
  auth: {
    login: '/api/token/',
    refresh: '/api/token/refresh/',
    userInfo: '/user/user-info/',
    forgotPassword: '/api/password-reset/',
    resetPassword: '/api/password-reset/confirm/',
    validateResetToken: '/api/password-reset/validate-token/',
  },
  
  // Usuario
  user: {
    profile: '/user/me/profile/',
    profileImage: '/user/me/profile/image/',
    groups: '/user/my-groups/',
    settings: '/user/me/settings/',
  },
  
  // Catastro
  catastro: {
    inmuebles: '/catastro/inmuebles/',
    inmueblesByRefcat: '/catastro/inmuebles/refcat/',
    edificioDetalle: '/catastro/edificio-detalle/',
    calles: '/catastro/calles/',
  },

  // Todo Riesgo Construcción
  todoRiesgo: {
    proyectos: '/ramo-tr-construccion/proyectos/',
    ofertas: '/ramo-tr-construccion/ofertas/',
    coberturas: '/ramo-tr-construccion/coberturas/',
    franquicias: '/ramo-tr-construccion/franquicias/',
  },
  
  // Health check
  health: '/health/',
} as const

/**
 * Construye una URL usando un endpoint predefinido
 * 
 * @param endpointPath - Ruta del endpoint desde API_ENDPOINTS
 * @param params - Parámetros de query opcionales
 * @returns URL completa con parámetros
 * @example
 * buildUrl(API_ENDPOINTS.auth.login) // 'https://api.jlaasociados.net/api/token/'
 * buildUrl(API_ENDPOINTS.catastro.inmuebles, { refcat: '12345' })
 */
export function buildUrl(
  endpointPath: string,
  params?: Record<string, string | number | boolean>
): string {
  const baseUrl = buildBackendUrl(endpointPath)
  
  if (!params || Object.keys(params).length === 0) {
    return baseUrl
  }
  
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })
  
  return url.toString()
}

/**
 * Convierte URLs de imágenes HTTP a HTTPS en producción
 * Esto soluciona el problema de imágenes que vienen del backend con protocolo HTTP
 * pero necesitan ser servidas con HTTPS en producción
 * 
 * @param imageUrl - URL de imagen que puede tener protocolo HTTP
 * @returns URL con protocolo HTTPS si está en producción y es de un dominio conocido
 */
export function normalizeImageUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl
  
  // Solo convertir en producción
  if (process.env.NODE_ENV !== 'production') {
    return imageUrl
  }
  
  // Dominios que deben usar HTTPS en producción
  const httpsOnlyDomains = [
    'portal.jlaasociados.net',
    'api.jlaasociados.net'
  ]
  
  // Si la URL ya es HTTPS, devolverla tal como está
  if (imageUrl.startsWith('https://')) {
    return imageUrl
  }
  
  // Convertir HTTP a HTTPS para dominios conocidos
  if (imageUrl.startsWith('http://')) {
    for (const domain of httpsOnlyDomains) {
      if (imageUrl.includes(domain)) {
        return imageUrl.replace('http://', 'https://')
      }
    }
  }
  
  return imageUrl
}
