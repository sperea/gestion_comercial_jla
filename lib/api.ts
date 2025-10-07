import config from './config'

// Configuración de la API
const API_BASE_URL = config.apiUrl

// Función para obtener la URL completa de la API
const getApiUrl = (endpoint: string): string => {
  // Si el endpoint ya es una URL completa, usarla tal como está
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  
  // Si API_BASE_URL es una URL completa, concatenar el endpoint
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  }
  
  // Si API_BASE_URL es una ruta relativa (como /api), concatenar normalmente
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  name?: string
}

export interface JWTTokens {
  access: string
  refresh: string
}

export interface LoginResponse {
  user: User
  tokens?: JWTTokens
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Función helper para realizar requests con credenciales
const fetchWithCredentials = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = getApiUrl(endpoint)
  
  // Si estamos en el servidor (server-side), no tenemos acceso a cookies del navegador
  const isServer = typeof window === 'undefined'
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }

  // En el cliente, intentar obtener el access token de las cookies
  if (!isServer && typeof document !== 'undefined') {
    const accessToken = getCookieValue('access-token')
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include', // Importante: incluir cookies HTTP-Only
    headers,
  })
}

// Helper para obtener valor de cookie en el cliente
const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

// Auth API functions
export const authAPI = {
  // Login con email y contraseña
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetchWithCredentials('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.detail || 'Error en el login')
      }

      const data = await response.json()
      
      // Adaptar la respuesta de Django a nuestra estructura esperada
      const adaptedResponse: ApiResponse<LoginResponse> = {
        success: true,
        data: {
          user: data.user,
          tokens: {
            access: data.access,
            refresh: data.refresh
          }
        },
        message: 'Login exitoso'
      }

      return adaptedResponse
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Logout
  async logout(): Promise<ApiResponse> {
    try {
      const response = await fetchWithCredentials('/api/auth/logout/', {
        method: 'POST',
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en el logout')
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Renovar access token usando refresh token
  async refresh(): Promise<ApiResponse<{ access: string }>> {
    try {
      const response = await fetchWithCredentials('/api/auth/refresh/', {
        method: 'POST',
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al renovar token')
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Verificar usuario actual (para mantener sesión)
  async me(): Promise<ApiResponse<User>> {
    try {
      const response = await fetchWithCredentials('/api/auth/me/')

      if (response.status === 401) {
        // Intentar renovar el token automáticamente
        const refreshResult = await this.refresh()
        if (refreshResult.success) {
          // Reintentar la petición original después del refresh
          const retryResponse = await fetchWithCredentials('/api/auth/me/')
          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            return {
              success: true,
              data: retryData,
              message: 'Usuario verificado'
            }
          }
        }
        return { success: false, error: 'No autenticado' }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.detail || 'Error al verificar usuario')
      }

      const data = await response.json()
      
      return {
        success: true,
        data: data,
        message: 'Usuario verificado'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Solicitar recuperación de contraseña
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await fetchWithCredentials('/api/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al solicitar recuperación')
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Restablecer contraseña con token
  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    try {
      const response = await fetchWithCredentials('/api/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al restablecer contraseña')
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },
}