/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para diferentes entornos
  ...(process.env.NODE_ENV === 'production' && process.env.VERCEL !== '1' && {
    // Solo usar standalone para Docker, no para Vercel
    output: 'standalone',
  }),
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/img/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/img/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8004',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8004',
        pathname: '/img/**',
      },
      {
        protocol: 'https',
        hostname: 'api.jlaasociados.net',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'api.jlaasociados.net',
        pathname: '/img/**',
      },
      {
        protocol: 'https',
        hostname: 'portal.jlaasociados.net',
        pathname: '/img/**',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
        pathname: '/**',
      },
    ],
  },
  
  // Variables de entorno para build
  env: {
    VERSION: process.env.VERSION || 'v0.0.1',
    BUILD_DATE: process.env.BUILD_DATE || new Date().toISOString(),
  },
}

module.exports = nextConfig