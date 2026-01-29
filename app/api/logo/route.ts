import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Forzar runtime de Node.js
export const runtime = 'nodejs'
export const dynamic = 'force-static'

export async function GET() {
  try {
    // Leer el archivo logo.png desde la carpeta public
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    
    console.log('🔍 Intentando cargar logo desde:', logoPath)
    
    // Verificar que el archivo existe
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo no encontrado en:', logoPath)
      
      // Intentar rutas alternativas
      const altPaths = [
        path.join(process.cwd(), 'logo.png'),
        path.join(process.cwd(), '.next', 'static', 'logo.png'),
        '/var/task/public/logo.png'
      ]
      
      for (const altPath of altPaths) {
        console.log('🔍 Probando ruta alternativa:', altPath)
        if (fs.existsSync(altPath)) {
          console.log('✅ Logo encontrado en ruta alternativa:', altPath)
          const logoBuffer = fs.readFileSync(altPath)
          const base64Logo = logoBuffer.toString('base64')
          const dataUrl = `data:image/png;base64,${base64Logo}`
          
          return NextResponse.json({
            dataUrl,
            size: logoBuffer.length,
            format: 'png',
            path: altPath
          }, {
            headers: {
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        }
      }
      
      return NextResponse.json(
        { error: 'Logo no encontrado en ninguna ruta', paths: [logoPath, ...altPaths] },
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
      format: 'png',
      path: logoPath
    }, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('❌ Error al servir el logo:', error)
    return NextResponse.json(
      { error: 'Error al cargar el logo', details: String(error) },
      { status: 500 }
    )
  }
}
