import { NextRequest, NextResponse } from 'next/server'

// Mock profile image endpoint - devuelve respuesta vacía o imagen por defecto
export async function GET(req: NextRequest) {
  console.log('🖼️ Mock profile image requested')
  
  return NextResponse.json({
    success: true,
    data: {
      image_url: null
    },
    message: 'No hay imagen de perfil en modo mock'
  })
}

export async function PUT(req: NextRequest) {
  console.log('🖼️ Mock profile image upload')
  
  return NextResponse.json({
    success: true,
    data: {
      image_url: null
    },
    message: 'Imagen guardada en modo mock'
  })
}

export async function DELETE(req: NextRequest) {
  console.log('🖼️ Mock profile image delete')
  
  return NextResponse.json({
    success: true,
    message: 'Imagen eliminada en modo mock'
  })
}