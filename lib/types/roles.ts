// Tipos para el sistema de roles y permisos

export interface Role {
  id: string
  nombre: string
  display_name: string
  descripcion: string
  permisos: Record<string, any>
}

export interface UserRoles {
  roles: Role[]
  role_names: string[]
  is_superuser: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}