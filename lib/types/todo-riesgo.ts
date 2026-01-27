export interface ComercialInfo {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
}

export interface TodoRiesgoProyecto {
  id: number
  comercial: number
  comercial_info?: ComercialInfo
  fecha_creacion: string
  fecha_vigencia: string
  tomador: string
  obra: string
  situacion: string
  duracion: string
  total_ofertas?: number
}

export interface Cobertura {
  id: number
  descripcion: string
}

export interface CompaniaInfo {
  id: number
  rsocial: string
  logo: string | null
}

export interface Franquicia {
  id?: number
  oferta?: number
  descripcion: string
  valor: string
}

export interface OfertaTodoRiesgo {
  id: number
  proyecto: number
  proyecto_info?: TodoRiesgoProyecto
  compania: number
  compania_info?: CompaniaInfo
  archivo: string | null
  coberturas: number[]
  coberturas_info?: Cobertura[]
  capital: string
  tasas: string
  prima_neta: string
  prima_total: string
  forma_pago: string
  aviso: string
  franquicias?: Franquicia[] // For creation/update payload
  franquicias_info?: Franquicia[] // From API response
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ProyectoFilters {
  comercial?: number
  fecha_creacion?: string
  fecha_vigencia?: string
  situacion?: string
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}
