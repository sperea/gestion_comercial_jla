import config from './config'
import { buildUrl, API_ENDPOINTS } from './api-config'

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface UserGroup {
  name: string
  id?: number
}

export interface UserGroupsResponse {
  count: number
  results: UserGroup[]
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
  is_active: boolean
  date_joined?: string
  last_login?: string
}

// Nueva interface para el usuario con grupos cargados
export interface UserWithGroups extends User {
  groups: UserGroup[]
}

export interface UserSettings {
  id: number
  user_id: number
  username: string
  theme: string
  language: string
  date_format: string
  time_format: string
  timezone: string
  is_dark_theme: string
  email_notifications: boolean
  notification_frequency: string
  push_notifications: boolean
  sound_notifications: boolean
  dashboard_layout: string
  items_per_page: number
  show_welcome_message: boolean
  profile_visibility: string
  show_online_status: boolean
  allow_contact: boolean
  keyboard_shortcuts: boolean
  auto_save: boolean
  auto_logout_minutes: number
  custom_settings: string
  settings_summary: string
  created_at: string
  updated_at: string
}

export interface UserSettingsUpdate {
  date_format: string
  time_format: string
  timezone: string
  is_dark_theme: string
  email_notifications: boolean
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
  
  // Para llamadas al backend Django, obtener token JWT desde las cookies HTTP-Only
  if (url.includes('api.jlaasociados.net')) {
    try {
      const tokenResponse = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        if (tokenData.hasToken && tokenData.tokens?.access) {
          headers.set('Authorization', `Bearer ${tokenData.tokens.access}`)
          console.log('🔑 [API] Token JWT obtenido desde cookies HTTP-Only y agregado a headers')
        } else {
          console.warn('⚠️ [API] No se encontró token JWT en cookies HTTP-Only')
        }
      } else {
        console.warn('⚠️ [API] No se pudo obtener token desde cookies HTTP-Only')
      }
    } catch (error) {
      console.error('❌ [API] Error obteniendo token JWT desde cookies HTTP-Only:', error)
    }
  }
  
  // Si es una operación que modifica datos, agregar CSRF token
  const isModifyingOperation = options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())
  
  if (isModifyingOperation) {
    const csrfToken = getCSRFToken()
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken)
    }
  }

  console.log(`📡 [API] ${options.method || 'GET'} ${url}`)
  console.log('📋 [API] Headers:', Object.fromEntries(headers.entries()))

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })

  console.log(`📊 [API] Response status: ${response.status}`)
  
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

// Helper para obtener token JWT desde cookies (DEPRECATED - usar /api/auth/token)
function getJWTToken(): string | null {
  if (typeof document === 'undefined') return null
  
  console.log('⚠️ [API] getJWTToken() está deprecated. Las cookies HTTP-Only no son accesibles desde JavaScript.')
  console.log('🍪 [API] Cookies visibles:', document.cookie)
  
  // Solo cookies no HTTP-Only serían visibles aquí
  const token = getCookieValue('access-token')
  if (token) {
    console.log(`✅ [API] Token JWT encontrado en cookie no HTTP-Only: access-token`)
    return token
  }
  
  console.log('❌ [API] No se encontró token JWT en cookies accesibles desde JavaScript')
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
      // Usar endpoint que obtiene datos reales del usuario
      const response = await fetchWithCredentials('/api/auth/me')

      if (response.status === 401) {
        // Intentar renovar el token automáticamente
        const refreshResult = await this.refresh()
        if (refreshResult.success) {
          // Reintentar la petición original después del refresh
          const retryResponse = await fetchWithCredentials('/api/auth/me')
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

  // Obtener grupos del usuario actual
  async getUserGroups(): Promise<ApiResponse<UserGroup[]>> {
    try {
      const response = await fetchWithCredentials(buildUrl(API_ENDPOINTS.user.groups))

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.detail || 'Error al obtener grupos')
      }

      const data = await response.json()
      
      return {
        success: true,
        data: data,
        message: 'Grupos obtenidos exitosamente'
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
  // Obtener grupos del usuario actual
  async getUserGroups(): Promise<ApiResponse<UserGroup[]>> {
    try {
      console.log('📡 Llamando a profileAPI.getUserGroups()...')
      
      // Debug: Verificar cookies antes de la llamada
      if (typeof document !== 'undefined') {
        console.log('🍪 [DEBUG] Cookies disponibles:', document.cookie)
        console.log('🔑 [DEBUG] Token JWT encontrado:', getJWTToken() ? 'SÍ' : 'NO')
      }
      
      const response = await fetchWithCredentials(buildUrl('/user/my-groups/'))

      if (response.status === 401) {
        console.error('❌ [ProfileAPI] Token JWT inválido o expirado')
        return { success: false, error: 'No autenticado' }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error del servidor:', response.status, errorData)
        throw new Error(errorData.message || errorData.detail || 'Error al obtener grupos')
      }

      const data = await response.json()
      console.log('📡 Respuesta de profileAPI.getUserGroups():', data)
      
      // La respuesta es directamente un array de grupos
      const groups: UserGroup[] = Array.isArray(data) ? data : []
      
      return {
        success: true,
        data: groups,
        message: `Se obtuvieron ${groups.length} grupo(s) exitosamente`
      }
    } catch (error) {
      console.error('❌ Error en profileAPI.getUserGroups():', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },


  // Obtener perfil del usuario actual
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      // Usar endpoint real del backend Django
      const response = await fetchWithCredentials(buildUrl(API_ENDPOINTS.user.profile))

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
      const response = await fetchWithCredentials(buildUrl(API_ENDPOINTS.user.profile), {
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
      const response = await fetchWithCredentials(buildUrl(API_ENDPOINTS.user.profileImage))

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (response.status === 404) {
        return { 
          success: true, 
          data: { image_url: null, has_image: false },
          message: 'Usuario sin imagen de perfil'
        }
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

      // Para FormData, no establecer Content-Type headers manualmente - usar fetchWithCredentials
      const response = await fetchWithCredentials(buildUrl(API_ENDPOINTS.user.profileImage), {
        method: 'PUT',
        body: formData,
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
  async deleteProfileImage(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetchWithCredentials(buildUrl(API_ENDPOINTS.user.profileImage), {
        method: 'DELETE',
      })

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.message || 'Sin permisos para eliminar imagen'
        console.error('🚫 Error 403 del backend:', errorData)
        return { success: false, error: `Acceso denegado: ${errorMessage}` }
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
        data: { message: data.message || 'Imagen eliminada exitosamente' },
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

  // Obtener configuración del usuario
  async getUserSettings(): Promise<ApiResponse<{ count: number; results: UserSettings[] }>> {
    try {
      const response = await fetchWithCredentials(buildUrl(API_ENDPOINTS.user.settings))

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.detail || 'Error al obtener configuración')
      }

      const data = await response.json()
      console.log('📡 Respuesta de profileAPI.getUserSettings():', data)
      
      return {
        success: true,
        data: data,
        message: 'Configuración obtenida exitosamente'
      }
    } catch (error) {
      console.error('❌ Error en profileAPI.getUserSettings():', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Actualizar configuración del usuario
  async updateUserSettings(settingsData: Partial<UserSettingsUpdate>): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await fetchWithCredentials(buildUrl(API_ENDPOINTS.user.settings), {
        method: 'POST',
        body: JSON.stringify(settingsData),
      })

      if (response.status === 401) {
        return { success: false, error: 'No autenticado' }
      }

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.message || 'Sin permisos para actualizar configuración'
        console.error('🚫 Error 403 del backend:', errorData)
        return { success: false, error: `Acceso denegado: ${errorMessage}` }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error del servidor:', response.status, errorData)
        throw new Error(errorData.message || errorData.detail || `Error del servidor (${response.status})`)
      }

      const data = await response.json()
      console.log('📡 Respuesta de profileAPI.updateUserSettings():', data)
      
      return {
        success: true,
        data: data,
        message: 'Configuración actualizada exitosamente'
      }
    } catch (error) {
      console.error('❌ Error en profileAPI.updateUserSettings():', error)
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
    // Si es una ruta relativa, construir URL completa usando la configuración del backend
    return `${config.apiUrl}${imagePath}`
  }
}

// Función de debug para diagnosticar problemas de autenticación
export const debugAPI = {
  async checkAuthStatus(): Promise<void> {
    console.log('🔍 [DEBUG] === Diagnóstico de Autenticación ===')
    
    // 1. Verificar cookies disponibles
    if (typeof document !== 'undefined') {
      console.log('🍪 [DEBUG] Cookies disponibles:')
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=')
        if (name.includes('token') || name.includes('jwt') || name.includes('access') || name.includes('csrf')) {
          console.log(`  ${name}: ${value?.substring(0, 20)}...`)
        }
      })
      
      console.log('🔑 [DEBUG] Token JWT detectado:', getJWTToken() ? 'SÍ' : 'NO')
    }
    
    // 2. Probar endpoint /auth/me
    try {
      console.log('🔍 [DEBUG] Probando endpoint /auth/me...')
      const meResponse = await authAPI.me()
      console.log('👤 [DEBUG] authAPI.me() resultado:', meResponse)
    } catch (error) {
      console.error('❌ [DEBUG] Error en authAPI.me():', error)
    }
    
    // 3. Probar endpoint de grupos directamente
    try {
      console.log('🔍 [DEBUG] Probando endpoint /user/my-groups/ directamente...')
      const groupsResponse = await profileAPI.getUserGroups()
      console.log('👥 [DEBUG] profileAPI.getUserGroups() resultado:', groupsResponse)
    } catch (error) {
      console.error('❌ [DEBUG] Error en profileAPI.getUserGroups():', error)
    }
    
    console.log('🔍 [DEBUG] === Fin del Diagnóstico ===')
  },
  
  async testGroupsEndpoint(): Promise<void> {
    console.log('🧪 [DEBUG] Probando endpoint de grupos con diferentes métodos...')
    
    const endpoints = [
      '/user/my-groups/',
      '/user/my-groups',
      '/api/user/my-groups/',
      '/me/groups/',
      '/groups/'
    ]
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 [DEBUG] Probando: ${endpoint}`)
        const response = await fetchWithCredentials(buildUrl(endpoint))
        console.log(`📊 [DEBUG] ${endpoint} → Status: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ [DEBUG] ${endpoint} → Datos:`, data)
          break // Si funciona, no seguir probando
        }
      } catch (error) {
        console.log(`❌ [DEBUG] ${endpoint} → Error:`, error)
      }
    }
  }
}

// Exponer función de debug globalmente para testing
if (typeof window !== 'undefined') {
  ;(window as any).debugJLAAuth = debugAPI.checkAuthStatus
  ;(window as any).testJLAGroups = debugAPI.testGroupsEndpoint
}