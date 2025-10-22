/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Docker - genera build standalone
  output: 'standalone',
  
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
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
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