import { NextRequest, NextResponse } from 'next/server'
import config from '@/lib/config'

const API_BASE_URL = config.apiUrl

async function forwardRequest(request: NextRequest, path: string) {
  try {
    // Obtener cookies del request
    const cookies = request.headers.get('cookie') || ''
    
    // Configurar headers para el backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
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
    
    // Para requests que modifican datos, obtener CSRF token
    if (request.method !== 'GET') {
      const csrfToken = request.headers.get('x-csrftoken') || request.headers.get('csrftoken')
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken
        console.log(`🛡️ CSRF token present: ${csrfToken.substring(0, 10)}...`)
      } else {
        console.log(`⚠️ No CSRF token found for ${request.method} request`)
      }
    }
    
    console.log(`🍪 Cookies being forwarded:`, cookies ? 'Present' : 'None')

    // Configurar la request al backend
    const backendUrl = `${API_BASE_URL}${path}`
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
      credentials: 'include',
    }

    // Si hay body, agregarlo
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      requestOptions.body = await request.text()
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
  return forwardRequest(request, '/api/users/me/profile/')
}

export async function PUT(request: NextRequest) {
  return forwardRequest(request, '/api/users/me/profile/')
}