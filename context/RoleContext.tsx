'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI } from '@/lib/api'
import { useAuth } from './AuthContext'
import type { UserRoles, Role } from '@/lib/types/roles'

interface RoleContextType {
  userRoles: UserRoles | null
  loading: boolean
  hasRole: (roleName: string) => boolean
  hasAnyRole: (roleNames: string[]) => boolean
  isAdmin: () => boolean
  isSuperuser: () => boolean
  refreshRoles: () => Promise<void>
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export const useRoles = () => {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRoles must be used within a RoleProvider')
  }
  return context
}

interface RoleProviderProps {
  children: ReactNode
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchUserRoles = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getUserRoles()
      
      if (response.success && response.data) {
        setUserRoles(response.data)
      } else {
        setUserRoles(null)
        // Si el error es de autenticación, no mostramos mensaje (el usuario no está logueado)
        if (response.error !== 'No autenticado') {
          console.warn('Error al obtener roles del usuario:', response.error)
        }
      }
    } catch (error) {
      console.error('Error al cargar roles:', error)
      setUserRoles(null)
    } finally {
      setLoading(false)
    }
  }

  // Cargar roles al montar el componente y cuando cambie el usuario
  useEffect(() => {
    if (user) {
      // Usuario autenticado, cargar roles
      fetchUserRoles()
    } else {
      // Usuario no autenticado, limpiar roles
      setUserRoles(null)
      setLoading(false)
    }
  }, [user])

  const hasRole = (roleName: string): boolean => {
    if (!userRoles) return false
    return userRoles.role_names.includes(roleName)
  }

  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!userRoles) return false
    return roleNames.some(role => userRoles.role_names.includes(role))
  }

  const isAdmin = (): boolean => {
    return hasRole('admin') || userRoles?.is_superuser === true
  }

  const isSuperuser = (): boolean => {
    return userRoles?.is_superuser === true
  }

  const refreshRoles = async (): Promise<void> => {
    await fetchUserRoles()
  }

  const value: RoleContextType = {
    userRoles,
    loading,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperuser,
    refreshRoles
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}