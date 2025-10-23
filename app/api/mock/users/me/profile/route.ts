import { NextRequest, NextResponse } from 'next/server'

// Mock profile endpoint para actualizar datos del usuario
export async function PUT(req: NextRequest) {
  try {
    console.log('👤 Mock profile update called')
    
    const body = await req.json()
    console.log('📝 Profile data to update:', body)
    
    // Simular actualización exitosa y devolver datos actualizados
    const updatedUser = {
      id: '1',
      username: 'sperea',
      email: body.email || 'sperea@jlaasociados.es',
      first_name: body.first_name || 'Sergio',
      last_name: body.last_name || 'Perea',
      full_name: `${body.first_name || 'Sergio'} ${body.last_name || 'Perea'}`,
      name: `${body.first_name || 'Sergio'} ${body.last_name || 'Perea'}`,
      phone: body.phone || '+56 9 1234 5678',
      profile_image: null,
      role: 'admin',
      roles: ['admin', 'user'],
      role_names: ['Administrador', 'Usuario'],
      is_active: true,
      date_joined: '2024-01-01T00:00:00Z',
      last_login: new Date().toISOString()
    }

    console.log('✅ Mock profile updated successfully')
    
    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Perfil actualizado correctamente (modo mock)'
    })
  } catch (error) {
    console.error('❌ Error en mock profile update:', error)
    return NextResponse.json({
      success: false,
      error: 'Error actualizando perfil en modo mock'
    }, { status: 500 })
  }
}

// GET para obtener perfil actual
export async function GET(req: NextRequest) {
  console.log('👤 Mock profile GET called')
  
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

  return NextResponse.json({
    success: true,
    data: mockUser,
    message: 'Perfil obtenido (modo mock)'
  })
}