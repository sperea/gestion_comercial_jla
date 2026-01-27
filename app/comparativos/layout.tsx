import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

interface ComparativosLayoutProps {
  children: React.ReactNode
}

export default function ComparativosLayout({ children }: ComparativosLayoutProps) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
