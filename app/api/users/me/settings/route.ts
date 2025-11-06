import { NextRequest, NextResponse } from 'next/server'
import { buildUrl } from '@/lib/api-config'

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

    // Configurar la request al backend usando configuración centralizada
    const backendUrl = buildUrl(path)
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
      credentials: 'include',
    }

    // Para requests con body (POST, PUT, PATCH)
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'DELETE') {
      const contentType = request.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
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
  return forwardRequest(request, '/api/users/me/settings/')
}

export async function POST(request: NextRequest) {
  return forwardRequest(request, '/api/users/me/settings/')
}

export async function PUT(request: NextRequest) {
  return forwardRequest(request, '/api/users/me/settings/')
}

export async function PATCH(request: NextRequest) {
  return forwardRequest(request, '/api/users/me/settings/')
}

export async function DELETE(request: NextRequest) {
  return forwardRequest(request, '/api/users/me/settings/')
}