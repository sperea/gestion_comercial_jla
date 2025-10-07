// Configuración de variables de entorno tipadas
export const config = {
  // URL base de la API del backend
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  
  // Configuración de desarrollo
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  
  // Otras configuraciones que podrías necesitar
  appName: 'JLA Intranet',
  version: '1.0.0'
} as const

// Función helper para validar configuración requerida
export const validateConfig = () => {
  const requiredVars = [
    'NEXT_PUBLIC_API_URL'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0 && config.isProd) {
    console.warn('Variables de entorno faltantes en producción:', missing)
  }
  
  return {
    isValid: missing.length === 0,
    missing
  }
}

export default config