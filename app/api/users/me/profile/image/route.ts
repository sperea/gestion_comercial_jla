import { NextRequest, NextResponse } from 'next/server'
import config from '@/lib/config'

const API_BASE_URL = config.apiUrl

async function forwardRequest(request: NextRequest, path: string) {
  try {
    // Obtener cookies del request
    const cookies = request.headers.get('cookie') || ''
    
    // Configurar headers para el backend
    const headers: Record<string, string> = {
      'Cookie': cookies,
    }

    // Si hay un token de autorización en headers, pasarlo
    const authorization = request.headers.get('authorization')
    if (authorization) {
      headers['Authorization'] = authorization
      console.log(`🔑 Authorization header present: ${authorization.substring(0, 20)}...`)
    } else {
      console.log(`⚠️ No Authorization header found`)
      
      // Si no hay Authorization header pero hay cookies, extraer el access token
      if (cookies) {
        const accessTokenMatch = cookies.match(/access-token=([^;]+)/)
        if (accessTokenMatch) {
          const token = accessTokenMatch[1]
          headers['Authorization'] = `Bearer ${token}`
          console.log(`🔑 Using access token from cookies: ${token.substring(0, 20)}...`)
        }
      }
    }
    
    console.log(`🍪 Cookies being forwarded:`, cookies ? 'Present' : 'None')

    // Construir URL al backend de forma robusta:
    // - Evitar duplicar segmentos (ej. /api/api/...)
    // - Si `API_BASE_URL` es relativo (p. ej. '/api'), resolverlo contra el origin de la request
    // - Si `API_BASE_URL` es absoluto (http://...), usarlo tal cual
    const buildBackendUrl = (base: string, rawPath: string) => {
      const cleanBase = base.replace(/\/+$|^\s+|\s+$/g, '') // sin slashes finales
      const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`

      // Si la base es absoluta, simplemente concatenar (sin duplicar slash)
      if (/^https?:\/\//i.test(cleanBase)) {
        return cleanBase.replace(/\/+$/g, '') + cleanPath
      }

      // Si la base es relativo (p. ej. '/api') o vacío, resolver contra el origin de la request
      // Si el cleanPath ya comienza con el cleanBase (ej. base '/api' y path '/api/...'), usar sólo el path
      if (cleanBase && cleanPath.startsWith(cleanBase)) {
        return new URL(cleanPath, request.url).toString()
      }

      // Caso general: unir base + path y resolver contra origin
      const joined = (cleanBase ? cleanBase.replace(/^\/+/, '/') : '') + cleanPath
      return new URL(joined, request.url).toString()
    }

    const backendUrl = buildBackendUrl(API_BASE_URL, path)
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
      credentials: 'include',
    }

    // Para FormData (imágenes), pasar el body directamente sin procesar
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'DELETE') {
      // Para FormData, no establecer Content-Type manualmente
      const contentType = request.headers.get('content-type')
      if (contentType && contentType.includes('multipart/form-data')) {
        // Para FormData, pasar el body directamente como FormData
        requestOptions.body = await request.formData()
        // NO establecer Content-Type para FormData - fetch lo hará automáticamente con boundary
        delete headers['Content-Type']
      } else {
        // Para JSON, procesarlo como antes
        headers['Content-Type'] = 'application/json'
        requestOptions.body = await request.text()
      }
    }

    console.log(`🔄 Forwarding ${request.method} ${path} to backend:`, backendUrl)

    // Hacer la request al backend
    const backendResponse = await fetch(backendUrl, requestOptions)
    
    console.log(`📡 Backend response status:`, backendResponse.status)

    // Obtener la respuesta del backend
    const responseData = await backendResponse.text()
    
    // Log error details for debugging
    if (!backendResponse.ok) {
      console.error(`❌ Backend error ${backendResponse.status}:`, responseData)
    }
    
    // Crear la respuesta para el cliente
    const response = new NextResponse(responseData, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    })

    // Copiar headers importantes del backend
    const headersToForward = [
      'content-type',
      'set-cookie',
      'cache-control',
      'expires',
      'last-modified',
      'etag'
    ]

    headersToForward.forEach(headerName => {
      const headerValue = backendResponse.headers.get(headerName)
      if (headerValue) {
        response.headers.set(headerName, headerValue)
      }
    })

    return response
  } catch (error) {
    console.error(`❌ Error forwarding request to ${path}:`, error)
    return NextResponse.json(
      { success: false, error: 'Error conectando con el servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return forwardRequest(request, '/user/me/profile/image/')
}

export async function PUT(request: NextRequest) {
  return forwardRequest(request, '/user/me/profile/image/')
}

export async function DELETE(request: NextRequest) {
  return forwardRequest(request, '/user/me/profile/image/')
}