import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirigir inmediatamente al login
  redirect('/login')
}