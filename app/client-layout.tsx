'use client'

import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/context/AuthContext'
import { GroupProvider } from '@/context/GroupContext'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import { Toaster } from 'react-hot-toast'

import { usePathname } from 'next/navigation'
import { isPublicRoute } from '@/lib/auth-utils'
import Header from '@/components/ui/Header'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const showHeader = !isPublicRoute(pathname)

  return (
    <ToastProvider>
      <AuthProvider>
        <GroupProvider>
          <ProtectedRoute>
            {showHeader && <Header />}
            {children}
          </ProtectedRoute>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </GroupProvider>
      </AuthProvider>
    </ToastProvider>
  )
}