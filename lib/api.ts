// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  name?: string
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
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  return fetch(url, {
    ...options,
    credentials: 'include', // Importante: incluir cookies HTTP-Only
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// Auth API functions
export const authAPI = {
  // Login con email y contraseña
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    try {
      const response = await fetchWithCredentials('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en el login')
      }

      return data
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
      const response = await fetchWithCredentials('/auth/logout', {
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

  // Verificar usuario actual (para mantener sesión)
  async me(): Promise<ApiResponse<User>> {
    try {
      const response = await fetchWithCredentials('/auth/me')

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al verificar usuario')
      }

      return data
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
      const response = await fetchWithCredentials('/auth/forgot-password', {
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
      const response = await fetchWithCredentials('/auth/reset-password', {
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