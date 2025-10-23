import { NextRequest, NextResponse } from 'next/server'

// Mock me endpoint para desarrollo - devuelve usuario basado en cookies mock
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Mock me endpoint called')
    
    // Verificar si hay cookies mock
    const accessToken = req.cookies.get('access-token')?.value
    const refreshToken = req.cookies.get('refresh-token')?.value
    
    console.log('🍪 Mock cookies found:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    })

    // Si hay tokens mock, devolver usuario mock
    if (accessToken || refreshToken) {
      const mockUser = {
        id: '1',
        username: 'sperea',
        email: 'sperea@jlaasociados.es',
        first_name: 'Sergio',
        last_name: 'Perea',
        full_name: 'Sergio Perea',
        name: 'Sergio Perea',
        phone: '+56 9 1234 5678',
        profile_image: null,
        role: 'admin',
        roles: ['admin', 'user'],
        role_names: ['Administrador', 'Usuario'],
        is_active: true,
        date_joined: '2024-01-01T00:00:00Z',
        last_login: new Date().toISOString()
      }

      console.log('✅ Mock user data returned')
      
      return NextResponse.json({
        success: true,
        data: mockUser,
        message: 'Usuario mock para desarrollo'
      })
    } else {
      console.log('❌ No mock tokens found')
      return NextResponse.json({
        success: false,
        error: 'No autenticado - Sin tokens mock'
      }, { status: 401 })
    }
  } catch (error) {
    console.error('❌ Error en mock me:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}