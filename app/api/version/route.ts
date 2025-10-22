import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Función para leer la versión del archivo VERSION.txt
function getVersion(): string {
  try {
    const versionPath = path.join(process.cwd(), 'VERSION.txt')
    const version = fs.readFileSync(versionPath, 'utf-8').trim()
    return version || 'v0.0.1'
  } catch (error) {
    console.warn('No se encontró VERSION.txt, usando versión por defecto')
    return 'v0.0.1'
  }
}

// Función para leer package.json
function getPackageInfo() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
    return packageJson
  } catch (error) {
    console.warn('No se pudo leer package.json')
    return {}
  }
}

export async function GET(request: NextRequest) {
  try {
    const version = getVersion()
    const packageInfo = getPackageInfo()
    
    // Información completa de versión del frontend
    const versionInfo = {
      version,
      name: packageInfo.name || 'colaboradores-frontend',
      description: 'Sistema de gestión de colaboradores - Frontend React/Next.js',
      framework: 'Next.js 15.5.4',
      language: 'TypeScript',
      package_version: packageInfo.version || version.replace('v', ''),
      node_version: process.version,
      build_info: {
        framework: 'Next.js',
        styling: 'Tailwind CSS',
        state_management: 'React Context API',
        authentication: 'JWT with HTTP-Only cookies',
        notifications: 'React Hot Toast',
        image_handling: 'Next.js Image + Django integration',
        features: [
          'Autenticación JWT segura',
          'Gestión completa de perfiles',
          'Sistema de subida de imágenes',
          'Responsive design corporativo',
          'Context API para estado global',
          'Notificaciones toast integradas',
          'Versionado semántico automático'
        ]
      },
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        api_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        build_time: new Date().toISOString()
      },
      repository: 'https://github.com/sperea/intranet_colaboradores_frontend',
      api_docs: '/api/',
      health_check: '/api/health',
      dependencies: {
        main: [
          'next@^15.5.4',
          'react@^18.2.0',
          'react-dom@^18.2.0',
          'react-hot-toast@^2.6.0',
          'js-cookie@^3.0.5'
        ],
        dev: [
          'typescript@^5',
          'tailwindcss@^3.3.0',
          '@types/react@^18',
          '@types/node@^20'
        ]
      }
    }

    return NextResponse.json(versionInfo, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache por 5 minutos
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error obteniendo información de versión:', error)
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      version: 'unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}