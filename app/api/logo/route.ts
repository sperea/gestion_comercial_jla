import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Leer el archivo logo.png desde la carpeta public
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    
    // Verificar que el archivo existe
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo no encontrado en:', logoPath)
      return NextResponse.json(
        { error: 'Logo no encontrado' },
        { status: 404 }
      )
    }
    
    // Leer el archivo
    const logoBuffer = fs.readFileSync(logoPath)
    
    // Convertir a base64
    const base64Logo = logoBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64Logo}`
    
    console.log('✅ Logo servido exitosamente, tamaño:', logoBuffer.length, 'bytes')
    
    // Devolver como JSON con el data URL
    return NextResponse.json({
      dataUrl,
      size: logoBuffer.length,
      format: 'png'
    }, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('❌ Error al servir el logo:', error)
    return NextResponse.json(
      { error: 'Error al cargar el logo' },
      { status: 500 }
    )
  }
}
