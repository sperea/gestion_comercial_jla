// Esta página nunca debería renderizarse debido al middleware
// que redirige "/" a "/login"
export default function HomePage() {
  return null
}