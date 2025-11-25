'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { profileAPI } from '@/lib/api'
import { useAuth } from './AuthContext'
import type { UserGroup } from '@/lib/api'

interface GroupContextType {
  userGroups: UserGroup[]
  loading: boolean
  error: string | null
  hasGroup: (groupName: string) => boolean
  hasAnyGroup: (groupNames: string[]) => boolean
  getGroupNames: () => string[]
  isCollaboradorExterno: boolean
  hasSiniestrosAccess: boolean
  refreshGroups: () => Promise<void>
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

export const useGroups = () => {
  const context = useContext(GroupContext)
  if (!context) {
    throw new Error('useGroups must be used within a GroupProvider')
  }
  return context
}

interface GroupProviderProps {
  children: ReactNode
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchUserGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await profileAPI.getUserGroups()
      
      if (response.success && response.data) {
        setUserGroups(response.data)
        console.log('✅ [GroupContext] Grupos cargados:', response.data)
      } else {
        setUserGroups([])
        setError(response.error || 'Error al obtener grupos')
        // Si el error es de autenticación, no mostramos mensaje (el usuario no está logueado)
        if (response.error !== 'No autenticado') {
          console.warn('⚠️ [GroupContext] Error al obtener grupos:', response.error)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      // Solo mostrar errores si no son de autenticación
      if (!errorMessage.includes('401') && !errorMessage.includes('No autenticado')) {
        console.error('❌ [GroupContext] Error al cargar grupos:', error)
      }
      setUserGroups([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar grupos al montar el componente y cuando cambie el usuario
  useEffect(() => {
    if (user) {
      // Usuario autenticado, cargar grupos
      fetchUserGroups()
    } else {
      // Usuario no autenticado, limpiar grupos
      setUserGroups([])
      setError(null)
      setLoading(false)
    }
  }, [user])

  const hasGroup = (groupName: string): boolean => {
    if (userGroups.length === 0) return false
    return userGroups.some(group => 
      group.name.toLowerCase().includes(groupName.toLowerCase())
    )
  }

  const hasAnyGroup = (groupNames: string[]): boolean => {
    if (userGroups.length === 0) return false
    return groupNames.some(groupName => hasGroup(groupName))
  }

  const getGroupNames = (): string[] => {
    return userGroups.map(group => group.name)
  }

  // Helpers específicos para grupos conocidos del sistema JLA
  const isCollaboradorExterno = hasGroup('Colaborador Externo')
  const hasSiniestrosAccess = hasGroup('Siniestros')

  const refreshGroups = async (): Promise<void> => {
    await fetchUserGroups()
  }

  const value: GroupContextType = {
    userGroups,
    loading,
    error,
    hasGroup,
    hasAnyGroup,
    getGroupNames,
    isCollaboradorExterno,
    hasSiniestrosAccess,
    refreshGroups
  }

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  )
}