'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI, profileAPI, User, LoginCredentials } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, password: string) => Promise<boolean>
  refreshUserData: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<boolean>
  updateUserImage: (imageUrl: string | null) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { addToast, clearLoadingToasts } = useToast()

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Verificar si el usuario tiene sesión guardada para "recordarme"
      const rememberMe = localStorage.getItem('jla_remember_me') === 'true'
      
      const response = await authAPI.me()
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        setUser(null)
        // Si no hay sesión activa y no está marcado "recordarme", limpiar localStorage
        if (!rememberMe) {
          localStorage.removeItem('jla_remember_me')
        }
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // Limpiar cualquier toast de loading anterior
      clearLoadingToasts()
      addToast({ type: 'loading', message: 'Iniciando sesión...' })
      
      const response = await authAPI.login(credentials)
      
      if (response.success && response.data) {
        // La respuesta ahora incluye { user, tokens }
        const { user } = response.data
        setUser(user)
        
        // Manejar la opción "Recordarme"
        if (credentials.rememberMe) {
          localStorage.setItem('jla_remember_me', 'true')
        } else {
          localStorage.removeItem('jla_remember_me')
        }
        
        // El toast de success automáticamente limpiará el de loading
        addToast({ type: 'success', message: 'Sesión iniciada exitosamente' })
        return true
      } else {
        // El toast de error automáticamente limpiará el de loading
        addToast({
          type: 'error',
          message: response.error || 'Credenciales inválidas'
        })
        return false
      }
    } catch (error) {
      // El toast de error automáticamente limpiará el de loading
      addToast({
        type: 'error',
        message: 'Error al iniciar sesión. Inténtalo de nuevo.'
      })
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout()
      setUser(null)
      // Limpiar el flag de "recordarme" al cerrar sesión
      localStorage.removeItem('jla_remember_me')
      addToast({ type: 'success', message: 'Sesión cerrada exitosamente' })
    } catch (error) {
      // Aunque falle el logout en el servidor, limpiamos el estado local
      setUser(null)
      localStorage.removeItem('jla_remember_me')
      addToast({
        type: 'error',
        message: 'Error al cerrar sesión, pero se limpió localmente'
      })
    }
  }

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      addToast({ type: 'loading', message: 'Enviando enlace de recuperación...' })
      
      const response = await authAPI.forgotPassword(email)
      
      if (response.success) {
        addToast({
          type: 'success',
          message: 'Se ha enviado un enlace de recuperación a tu email'
        })
        return true
      } else {
        addToast({
          type: 'error',
          message: response.error || 'Error al enviar email de recuperación'
        })
        return false
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Error al procesar solicitud. Inténtalo de nuevo.'
      })
      return false
    }
  }

  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    try {
      addToast({ type: 'loading', message: 'Restableciendo contraseña...' })
      
      const response = await authAPI.resetPassword(token, password, password)
      
      if (response.success) {
        addToast({
          type: 'success',
          message: 'Contraseña restablecida exitosamente'
        })
        return true
      } else {
        addToast({
          type: 'error',
          message: response.error || 'Error al restablecer contraseña'
        })
        return false
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Error al restablecer contraseña. Inténtalo de nuevo.'
      })
      return false
    }
  }

  const refreshUserData = async (): Promise<void> => {
    await checkAuthStatus()
  }

  const updateUser = async (userData: Partial<Pick<User, 'first_name' | 'last_name' | 'email' | 'phone'>>): Promise<boolean> => {
    try {
      if (!user) {
        addToast({
          type: 'error',
          message: 'No hay usuario autenticado'
        })
        return false
      }

      addToast({ type: 'loading', message: 'Actualizando perfil...' })
      
      try {
        // Llamar a la API real para actualizar el perfil
        const response = await profileAPI.updateProfile(userData)
        
        if (response.success && response.data) {
          // Actualizar el estado del usuario con los datos del backend
          setUser(response.data)
          
          addToast({
            type: 'success',
            message: response.message || 'Perfil actualizado correctamente'
          })
          return true
        } else {
          // No hacer fallback local para errores de permisos o del servidor
          addToast({
            type: 'error',
            message: response.error || 'Error al actualizar el perfil'
          })
          return false
        }
      } catch (apiError) {
        // Solo hacer fallback local si es realmente un error de conexión
        addToast({
          type: 'error',
          message: 'Error de conexión. Inténtalo de nuevo.'
        })
        return false
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Error al actualizar el perfil'
      })
      return false
    }
  }

  const updateUserImage = async (imageUrl: string | null): Promise<void> => {
    if (user) {
      setUser(prev => prev ? { ...prev, profile_image: imageUrl } : null)
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    forgotPassword,
    resetPassword,
    refreshUserData,
    updateUser,
    updateUserImage,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}