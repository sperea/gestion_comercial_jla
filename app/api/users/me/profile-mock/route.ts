import { NextRequest, NextResponse } from 'next/server'

// Mock data para probar sin backend
const mockUserProfile = {
  id: "1",
  username: "testuser",
  email: "test@jlaasociados.com",
  first_name: "Usuario",
  last_name: "De Prueba",
  phone: "+34 123 456 789",
  full_name: "Usuario De Prueba",
  is_active: true,
  date_joined: "2024-01-01T00:00:00Z",
  last_login: "2024-10-20T10:00:00Z"
}

export async function GET(request: NextRequest) {
  console.log('🧪 Mock Profile API - GET profile')
  
  return NextResponse.json({
    success: true,
    data: mockUserProfile,
    message: 'Perfil obtenido (modo prueba)'
  })
}

export async function PUT(request: NextRequest) {
  try {
    const updateData = await request.json()
    console.log('🧪 Mock Profile API - PUT profile:', updateData)
    
    // Simular actualización
    const updatedProfile = {
      ...mockUserProfile,
      ...updateData,
      full_name: `${updateData.first_name || mockUserProfile.first_name} ${updateData.last_name || mockUserProfile.last_name}`
    }
    
    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: 'Perfil actualizado (modo prueba)'
    })
  } catch (error) {
    console.error('🧪 Mock Profile API - Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error actualizando perfil (modo prueba)'
    }, { status: 400 })
  }
}