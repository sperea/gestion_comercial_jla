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
    return 'v0.0.1'
  }
}

export async function GET(request: NextRequest) {
  const version = getVersion()
  
  const basicInfo = {
    message: 'Colaboradores Frontend API',
    version,
    status: 'running',
    timestamp: new Date().toISOString(),
    framework: 'Next.js 15.5.4',
    endpoints: {
      version: '/api/version/',
      health: '/api/health',
      auth: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        me: '/api/auth/me',
        refresh: '/api/auth/refresh'
      },
      profile: {
        get: '/user/me/profile/',
        update: '/user/me/profile/',
        image: '/user/me/profile/image/'
      }
    },
    documentation: 'https://github.com/sperea/intranet_colaboradores_frontend#readme'
  }

  return NextResponse.json(basicInfo, {
    headers: {
      'Cache-Control': 'public, max-age=60', // Cache por 1 minuto
      'Content-Type': 'application/json'
    }
  })
}