'use client'

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

export default function IALayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  )
}