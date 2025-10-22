'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Cerrar menú de perfil cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  // Función para obtener el nombre completo del usuario
  const getUserFullName = () => {
    if (!user) return null
    if (user?.name) return user.name
    if (user?.full_name) return user.full_name
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user?.first_name) return user.first_name
    return null
  }

  const userFullName = getUserFullName()
  
  const userInitials = userFullName
    ? userFullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user?.email?.charAt(0).toUpperCase() || 'U'

  // Función para verificar si el email es válido (no placeholder)
  const isValidUserEmail = (email: string | undefined) => {
    if (!email) return false
    // Lista de emails placeholder comunes que no son válidos
    const placeholderEmails = [
      'user@email.com',
      'user@example.com', 
      'admin@example.com',
      'test@test.com',
      'example@example.com'
    ]
    return !placeholderEmails.includes(email.toLowerCase())
  }

  // Determinar si mostrar datos del usuario o estado de carga
  const hasValidUser = user && user.email && isValidUserEmail(user.email)
  const showUserData = hasValidUser && userFullName

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y marca */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image
                src="/img/logo.webp"
                alt="JLA Asociados"
                width={170}
                height={50}
                className="object-contain"
              />
            </div>
          </div>
            
          {/* Navegación desktop centrada */}
          <nav className="hidden md:flex md:justify-center md:space-x-8 flex-1">
            <a href="#" className="text-gray-900 hover:text-primary px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Mis Proyectos
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Tarificadores
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Mi Formación
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Soporte
            </a>
          </nav>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a2.828 2.828 0 010-4L20 6h-5M9 17H4l3.5-3.5a2.828 2.828 0 000-4L4 6h5" />
              </svg>
            </button>

            {/* Menú de perfil */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-2 hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 bg-gradient-to-r from-primary to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{userInitials}</span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-gray-900 font-medium">
                    {showUserData ? userFullName : 'Cargando sesión...'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {showUserData ? user.email : ''}
                  </p>
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown del perfil */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {showUserData ? userFullName : 'Cargando sesión...'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {showUserData ? user.email : ''}
                      </p>
                    </div>
                    <a
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mi Perfil
                    </a>
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configuración
                    </a>
                    <div className="border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <svg className="mr-3 h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de menú móvil */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 bg-gray-50">
            <a href="#" className="text-gray-900 hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
              Mis Proyectos
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              Tarificadores
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              Mi Formación
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              Soporte
            </a>
          </div>
        </div>
      )}
    </header>
  )
}