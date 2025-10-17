"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // Verificar si ya existe la preferencia de "recordarme" al cargar
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('jla_remember_me') === 'true'
    setRememberMe(savedRememberMe)
  }, [])

  // Redirigir si ya está autenticado
  useEffect(() => {
    console.log('🔍 useEffect login - user state:', user);
    if (user) {
      console.log('👤 Usuario detectado, redirigiendo a dashboard...');
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Iniciando login con:', { email, rememberMe });
      const success = await login({ email, password, rememberMe });
      console.log('✅ Resultado del login:', { success });
      
      if (success) {
        console.log('🚀 Login exitoso, redirigiendo a dashboard...');
        router.push("/dashboard");
      } else {
        console.log('❌ Login falló, no hay redirección');
      }
    } catch (error) {
      console.error('💥 Error en handleSubmit:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // Evitar parpadeo mientras redirige
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        {/* Header with Logo */}
        <div className="text-center">
          {/* Logo Container */}
          {/* Logo Container */}
          <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100 flex justify-center">
            <Image
              src="/img/logo.webp"
              alt="JLA Logo"
              width={140 * 2.2}
              height={90 * 2.2}
              className="object-contain"
            />
          </div>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu panel de colaboradores
          </p>
        </div>
        {/* Login Icon */}
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary mb-4">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Login Form */}
        <Card className="p-8">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div>
              <Input
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@empresa.com"
                autoComplete="email"
                className="text-lg p-3"
              />
            </div>

            <div>
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Tu contraseña"
                autoComplete="current-password"
                className="text-lg p-3"
              />
            </div>

            {/* Recordarme */}
            <div className="space-y-4">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                label="Recordarme"
                description="Mantener la sesión activa incluso después de cerrar el navegador"
              />
              
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-600 transition-colors underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                loading={loading}
                className="w-full py-4 text-lg font-semibold"
                disabled={!email || !password}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </div>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Credenciales de demo:
            </h4>
            <p className="text-xs text-gray-600">
              <strong>Email:</strong> admin@example.com
              <br />
              <strong>Contraseña:</strong> password123
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
