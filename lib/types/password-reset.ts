/**
 * Tipos para el sistema de recuperación de contraseña
 */

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
  error?: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
  confirm_password: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
  error?: string
}

export interface PasswordResetToken {
  token: string
  email: string
  expiresAt: Date
  used: boolean
}

export interface ValidateTokenResponse {
  valid: boolean
  email?: string
  error?: string
}
