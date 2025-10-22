import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

interface ProfileLayoutProps {
  children: React.ReactNode
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}