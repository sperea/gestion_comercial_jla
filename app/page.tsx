import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirección inmediata al login
  redirect('/login')
}