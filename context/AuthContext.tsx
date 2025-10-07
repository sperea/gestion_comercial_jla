'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI, User, LoginCredentials } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, password: string) => Promise<boolean>
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
  const { addToast } = useToast()

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.me()
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      addToast({ type: 'loading', message: 'Iniciando sesión...' })
      
      const response = await authAPI.login(credentials)
      
      if (response.success && response.data) {
        setUser(response.data)
        addToast({ type: 'success', message: 'Sesión iniciada exitosamente' })
        return true
      } else {
        addToast({
          type: 'error',
          message: response.error || 'Credenciales inválidas'
        })
        return false
      }
    } catch (error) {
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
      addToast({ type: 'success', message: 'Sesión cerrada exitosamente' })
    } catch (error) {
      // Aunque falle el logout en el servidor, limpiamos el estado local
      setUser(null)
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
      
      const response = await authAPI.resetPassword(token, password)
      
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

  const value = {
    user,
    loading,
    login,
    logout,
    forgotPassword,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}