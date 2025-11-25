import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Endpoint para obtener el token JWT desde las cookies HTTP-Only
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Intentar obtener el access token
    const accessToken = cookieStore.get('access-token')?.value
    const refreshToken = cookieStore.get('refresh-token')?.value
    
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        hasToken: false,
        message: 'No access token found in cookies'
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      hasToken: true,
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    })
  } catch (error) {
    console.error('Error reading JWT cookies:', error)
    return NextResponse.json({
      success: false,
      hasToken: false,
      error: 'Failed to read cookies'
    }, { status: 500 })
  }
}