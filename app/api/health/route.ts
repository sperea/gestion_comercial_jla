import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
  const startTime = Date.now()
  
  try {
    const version = getVersion()
    
    // Verificaciones básicas de salud
    const health = {
      status: 'healthy',
      version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      response_time_ms: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development',
      memory_usage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      node_version: process.version,
      checks: {
        filesystem: checkFileSystem(),
        api_endpoints: true, // Siempre true si llegamos aquí
        environment_vars: checkEnvironmentVars()
      }
    }

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - startTime
    }, { status: 503 })
  }
}

function checkFileSystem(): boolean {
  try {
    // Verificar que podemos leer archivos básicos
    const packagePath = path.join(process.cwd(), 'package.json')
    fs.accessSync(packagePath, fs.constants.R_OK)
    return true
  } catch (error) {
    return false
  }
}

function checkEnvironmentVars(): boolean {
  // Verificar variables de entorno críticas
  const requiredVars = ['NODE_ENV']
  return requiredVars.every(varName => process.env[varName] !== undefined)
}