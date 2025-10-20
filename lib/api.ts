import config from './config'
import type { UserRoles } from './types/roles'

// Configuración de la API
const API_BASE_URL = config.apiUrl

// Función para obtener la URL completa de la API
const getApiUrl = (endpoint: string): string => {
  // Si el endpoint ya es una URL completa, usarla tal como está
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  
  // Si el endpoint comienza con /api/, es un endpoint del frontend Next.js
  // No agregar el API_BASE_URL, usar la URL relativa
  if (endpoint.startsWith('/api/')) {
    return endpoint
  }
  
  // Para otros endpoints, usar el API_BASE_URL del backend
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  }
  
  // Si API_BASE_URL es una ruta relativa, concatenar normalmente
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface User {
  id: string
  username: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  name?: string  // Para retrocompatibilidad
  phone?: string
  avatar?: string
  profile_image?: string | null  // Nueva propiedad para imagen de perfil desde Django
  role?: string
  roles?: any[]
  role_names?: string[]
  is_active: boolean
  date_joined?: string
  last_login?: string
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
async function fetchWithCredentials(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  
  // Si es una operación que modifica datos, agregar CSRF token
  const isModifyingOperation = options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())
  
  if (isModifyingOperation) {
    const csrfToken = getCSRFToken()
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken)
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })

  return response
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

// Helper para obtener CSRF token
function getCSRFToken(): string | null {
  // Django envía el CSRF token en la cookie 'csrftoken'
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'csrftoken') {
        return value
      }
    }
  }
  return null
}

// Auth API functions
export const authAPI = {
  // Login con email y contraseña
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetchWithCredentials('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.detail || 'Error en el login')
      }

      const data = await response.json()
      
      console.log('🔍 Respuesta completa del endpoint frontend:', data)
      
      // La respuesta del frontend ya tiene la estructura correcta
      // No necesitamos adaptarla, solo devolverla
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
      const response = await fetchWithCredentials('/api/auth/logout', {
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
      const response = await fetchWithCredentials('/api/auth/refresh', {
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
      // Usar endpoint temporal que bypasea problemas de permisos del backend
      const response = await fetchWithCredentials('/api/auth/me-simple')

      if (response.status === 401) {
        // Intentar renovar el token automáticamente
        const refreshResult = await this.refresh()
        if (refreshResult.success) {
          // Reintentar la petición original después del refresh
          const retryResponse = await fetchWithCredentials('/api/auth/me-simple')
          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            return {
              success: true,
              data: retryData.data || retryData,
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
        data: data.data || data,
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
        throw new Error(data.error || data.message || 'Error al solicitar recuperación')
      }

      return {
        success: true,
        message: data.message || 'Email de recuperación enviado'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Validar token de recuperación
  async validateResetToken(token: string): Promise<ApiResponse<{ email: string }>> {
    try {
      const response = await fetchWithCredentials(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`)

      const data = await response.json()
      
      if (!response.ok || !data.valid) {
        throw new Error(data.error || 'Token inválido o expirado')
      }

      return {
        success: true,
        data: { email: data.email },
        message: 'Token válido'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Restablecer contraseña con token
  async resetPassword(token: string, new_password: string, confirm_password: string): Promise<ApiResponse> {
    try {
      const response = await fetchWithCredentials('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password, confirm_password }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error al restablecer contraseña')
      }

      return {
        success: true,
        message: data.message || 'Contraseña restablecida exitosamente'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Obtener roles del usuario actual
  async getUserRoles(): Promise<ApiResponse<UserRoles>> {
    try {
      const response = await fetchWithCredentials('/api/users/me/roles/')

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.detail || 'Error al obtener roles')
      }

      const data = await response.json()
      
      return {
        success: true,
        data: data,
        message: 'Roles obtenidos exitosamente'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },
}

// Profile API functions
export const profileAPI = {
  // Obtener perfil del usuario actual
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      // Usar endpoint real del backend Django
      const response = await fetchWithCredentials('/api/users/me/profile/')

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.detail || 'Error al obtener perfil')
      }

      const data = await response.json()
      console.log('📡 Respuesta de profileAPI.getProfile():', data)
      
      return {
        success: true,
        data: data,
        message: 'Perfil obtenido exitosamente'
      }
    } catch (error) {
      console.error('❌ Error en profileAPI.getProfile():', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Actualizar perfil del usuario
  async updateProfile(profileData: Partial<Pick<User, 'first_name' | 'last_name' | 'email' | 'phone'>>): Promise<ApiResponse<User>> {
    try {
      // Usar endpoint real del backend Django
      const response = await fetchWithCredentials('/api/users/me/profile/', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.message || 'Sin permisos para actualizar el perfil'
        console.error('🚫 Error 403 del backend:', errorData)
        return { success: false, error: `Acceso denegado: ${errorMessage}` }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error del servidor:', response.status, errorData)
        throw new Error(errorData.message || errorData.detail || `Error del servidor (${response.status})`)
      }

      const data = await response.json()
      console.log('📡 Respuesta de profileAPI.updateProfile():', data)
      
      // La respuesta del backend tiene formato: { success: boolean, message: string, user: UserProfile }
      if (data.success) {
        return {
          success: true,
          data: data.user,
          message: data.message || 'Perfil actualizado exitosamente'
        }
      } else {
        throw new Error(data.message || 'Error al actualizar perfil')
      }
    } catch (error) {
      console.error('❌ Error en profileAPI.updateProfile():', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Obtener solo la imagen de perfil
  async getProfileImage(): Promise<ApiResponse<{ image_url: string | null; has_image: boolean }>> {
    try {
      const response = await fetchWithCredentials('/api/users/me/profile/image/')

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.detail || 'Error al obtener imagen de perfil')
      }

      const data = await response.json()
      console.log('📡 Respuesta de profileAPI.getProfileImage():', data)
      
      return {
        success: true,
        data: data,
        message: 'Imagen de perfil obtenida exitosamente'
      }
    } catch (error) {
      console.error('❌ Error en profileAPI.getProfileImage():', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Subir/Actualizar imagen de perfil
  async uploadProfileImage(imageFile: File): Promise<ApiResponse<{ image_url: string }>> {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      // Para FormData, no establecer Content-Type headers manualmente
      const response = await fetch('/api/users/me/profile/image/', {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      })

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.message || 'Sin permisos para actualizar imagen'
        console.error('🚫 Error 403 del backend:', errorData)
        return { success: false, error: `Acceso denegado: ${errorMessage}` }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error del servidor:', response.status, errorData)
        
        // Manejo específico de errores de validación
        if (response.status === 400 && errorData.image) {
          return { success: false, error: errorData.image[0] || 'Error de validación de imagen' }
        }
        
        throw new Error(errorData.message || errorData.detail || `Error del servidor (${response.status})`)
      }

      const data = await response.json()
      console.log('📡 Respuesta de profileAPI.uploadProfileImage():', data)
      
      return {
        success: true,
        data: { image_url: data.image_url },
        message: data.message || 'Imagen subida exitosamente'
      }
    } catch (error) {
      console.error('❌ Error en profileAPI.uploadProfileImage():', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Eliminar imagen de perfil
  async deleteProfileImage(): Promise<ApiResponse<{ image_url: null }>> {
    try {
      const response = await fetchWithCredentials('/api/users/me/profile/image/', {
        method: 'DELETE',
      })

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (response.status === 404) {
        return { success: false, error: 'No hay imagen de perfil para eliminar' }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error del servidor:', response.status, errorData)
        throw new Error(errorData.message || errorData.detail || `Error del servidor (${response.status})`)
      }

      const data = await response.json()
      console.log('📡 Respuesta de profileAPI.deleteProfileImage():', data)
      
      return {
        success: true,
        data: { image_url: null },
        message: data.message || 'Imagen eliminada exitosamente'
      }
    } catch (error) {
      console.error('❌ Error en profileAPI.deleteProfileImage():', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Helper para obtener URL completa de imagen
  getImageUrl(imagePath: string | null): string | null {
    if (!imagePath) return null
    // Si ya es una URL completa, devolverla tal como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    // Si es una ruta relativa, construir URL completa
    return `http://localhost:8000${imagePath}`
  }
}