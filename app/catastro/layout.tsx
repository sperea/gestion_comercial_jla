import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

interface CatastroLayoutProps {
  children: React.ReactNode
}

export default function CatastroLayout({ children }: CatastroLayoutProps) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}