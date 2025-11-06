import { NextRequest, NextResponse } from 'next/server'
import { buildUrl, API_ENDPOINTS } from '@/lib/api-config'

// Proxy para obtener roles del usuario desde el backend Django
export async function GET(req: NextRequest) {
  try {
    // Obtener access token de las cookies
    const accessToken = req.cookies.get('access-token')?.value

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado - Access token no encontrado'
      }, { status: 401 })
    }

    // Hacer petición al backend Django usando configuración centralizada
    const rolesUrl = buildUrl(API_ENDPOINTS.user.roles)
    
    const response = await fetch(rolesUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        success: false,
        error: errorData.message || errorData.detail || 'Error al obtener roles'
      }, { status: response.status })
    }

    const rolesData = await response.json()
    
    return NextResponse.json({
      success: true,
      data: rolesData
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error conectando con backend'
    }, { status: 500 })
  }
}