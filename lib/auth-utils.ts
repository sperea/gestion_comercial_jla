'use client'

/**
 * Utilidades para gestionar la autenticación y redirección
 */

// Función para limpiar completamente la sesión local
export const clearSession = (): void => {
  // Limpiar localStorage
  localStorage.removeItem('jla_remember_me')
  localStorage.removeItem('jla_redirect_after_login')
  
  // Limpiar cualquier otro dato relacionado con la sesión
  const itemsToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('jla_')) {
      itemsToRemove.push(key)
    }
  }
  
  itemsToRemove.forEach(key => localStorage.removeItem(key))
  
  console.log('🧹 [Auth Utils] Sesión local limpiada completamente')
}

// Función para forzar logout completo
export const forceLogout = (): void => {
  clearSession()
  
  // Forzar recarga de la página para limpiar el estado
  window.location.href = '/login'
}

// Función para verificar si una ruta es pública
export const isPublicRoute = (pathname: string): boolean => {
  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/api',
    '/_next',
    '/favicon.ico'
  ]
  
  return publicRoutes.some(route => {
    if (route === '/reset-password') {
      return pathname.startsWith('/reset-password')
    }
    if (route === '/api' || route === '/_next') {
      return pathname.startsWith(route)
    }
    return pathname === route
  })
}

// Función para guardar la ruta de redirección después del login
export const saveRedirectRoute = (pathname: string): void => {
  if (pathname !== '/' && pathname !== '/login') {
    localStorage.setItem('jla_redirect_after_login', pathname)
    console.log('📍 [Auth Utils] Ruta guardada para redirección:', pathname)
  }
}

// Función para obtener y limpiar la ruta de redirección
export const getAndClearRedirectRoute = (): string => {
  const redirectTo = localStorage.getItem('jla_redirect_after_login') || '/dashboard'
  localStorage.removeItem('jla_redirect_after_login')
  console.log('📍 [Auth Utils] Obteniendo ruta de redirección:', redirectTo)
  return redirectTo
}