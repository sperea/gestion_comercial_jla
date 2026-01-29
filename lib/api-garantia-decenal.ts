import { buildUrl, API_ENDPOINTS } from './api-config'
import { fetchWithCredentials } from './api'
import { 
  DecenalProyecto, 
  Cobertura, 
  OfertaDecenal, 
  PaginatedResponse,
  ProyectoFilters,
  CompaniaInfo
} from './types/garantia-decenal'

// Helper para manejar errores de API
async function handleApiError(response: Response, context: string) {
  let errorDetails = response.statusText;
  try {
    const text = await response.text();
    console.error(`❌ [API Error] ${context} - Status: ${response.status}`);
    console.error(`📜 [API Error Body]:`, text.substring(0, 1000)); // Log first 1000 chars
    try {
      const json = JSON.parse(text);
      errorDetails = json.detail || json.error || JSON.stringify(json);
    } catch {
      // If not JSON, it might be HTML (Django debug page), so we rely on the console log above
      errorDetails = `Server error ${response.status} (Check console for details)`;
    }
  } catch (e) {
    console.error('Error reading error response:', e);
  }
  throw new Error(`Error ${context}: ${errorDetails}`);
}

// Clase para manejar la API de Garantía Decenal
export class GarantiaDecenalAPI {
  private getHeaders(isFileUpload: boolean = false): HeadersInit {
    const headers: HeadersInit = {}
    
    if (!isFileUpload) {
      headers['Content-Type'] = 'application/json'
    }
    
    return headers
  }

  // --- Proyectos ---

  async getProyectos(filters: ProyectoFilters = {}): Promise<PaginatedResponse<DecenalProyecto>> {
    const params: Record<string, string | number | boolean> = {}
    
    if (filters.comercial) params.comercial = filters.comercial
    if (filters.search) params.search = filters.search
    if (filters.page) params.page = filters.page
    if (filters.page_size) params.page_size = filters.page_size
    if (filters.ordering) params.ordering = filters.ordering
    if (filters.fecha_creacion) params.fecha_creacion = filters.fecha_creacion
    if (filters.fecha_vigencia) params.fecha_vigencia = filters.fecha_vigencia
    if (filters.situacion) params.situacion = filters.situacion

    const url = buildUrl(API_ENDPOINTS.garantiaDecenal.proyectos, params)
    
    console.log('📡 [GarantiaDecenalAPI] Fetching projects from:', url)

    const response = await fetchWithCredentials(url, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      await handleApiError(response, 'fetching proyectos');
    }
    
    const data = await response.json()
    
    // Si la API devuelve un array directamente (sin paginación)
    if (Array.isArray(data)) {
      return {
        count: data.length,
        next: null,
        previous: null,
        results: data
      }
    }
    
    return data
  }

  async createProyecto(data: Partial<DecenalProyecto>): Promise<DecenalProyecto> {
    const url = buildUrl(API_ENDPOINTS.garantiaDecenal.proyectos)
    
    const response = await fetchWithCredentials(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) throw new Error(`Error creating proyecto: ${response.statusText}`)
    return response.json()
  }

  async getProyecto(id: number): Promise<DecenalProyecto> {
    const url = buildUrl(`${API_ENDPOINTS.garantiaDecenal.proyectos}${id}/`)
    
    const response = await fetchWithCredentials(url, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) throw new Error(`Error fetching proyecto ${id}: ${response.statusText}`)
    return response.json()
  }

  async updateProyecto(id: number, data: Partial<DecenalProyecto>): Promise<DecenalProyecto> {
    const url = buildUrl(`${API_ENDPOINTS.garantiaDecenal.proyectos}${id}/`)
    
    const response = await fetchWithCredentials(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) throw new Error(`Error updating proyecto ${id}: ${response.statusText}`)
    return response.json()
  }

  async deleteProyecto(id: number): Promise<void> {
    const url = buildUrl(`${API_ENDPOINTS.garantiaDecenal.proyectos}${id}/`)
    
    const response = await fetchWithCredentials(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    if (!response.ok) throw new Error(`Error deleting proyecto ${id}: ${response.statusText}`)
  }

  // --- Coberturas ---

  async getCoberturas(search?: string): Promise<PaginatedResponse<Cobertura>> {
    const params: Record<string, string> = {}
    if (search) params.search = search
    
    const url = buildUrl(API_ENDPOINTS.garantiaDecenal.coberturas, params)
    
    const response = await fetchWithCredentials(url, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      await handleApiError(response, 'fetching coberturas');
    }
    
    const data = await response.json()

    if (Array.isArray(data)) {
      return {
        count: data.length,
        next: null,
        previous: null,
        results: data
      }
    }
    
    return data
  }

  async createCobertura(data: Partial<Cobertura>): Promise<Cobertura> {
    const url = buildUrl(API_ENDPOINTS.garantiaDecenal.coberturas)
    
    const response = await fetchWithCredentials(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
        await handleApiError(response, 'creating cobertura')
    }
    return response.json()
  }

  async updateCobertura(id: number, data: Partial<Cobertura>): Promise<Cobertura> {
    const url = buildUrl(`${API_ENDPOINTS.garantiaDecenal.coberturas}${id}/`)
    
    const response = await fetchWithCredentials(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
        await handleApiError(response, 'updating cobertura')
    }
    return response.json()
  }

  async deleteCobertura(id: number): Promise<void> {
    const url = buildUrl(`${API_ENDPOINTS.garantiaDecenal.coberturas}${id}/`)
    
    const response = await fetchWithCredentials(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
        await handleApiError(response, 'deleting cobertura')
    }
  }

  // --- Ofertas ---

  async getOfertas(proyectoId: number): Promise<PaginatedResponse<OfertaDecenal>> {
    const params = { proyecto: proyectoId }
    const url = buildUrl(API_ENDPOINTS.garantiaDecenal.ofertas, params)
    
    const response = await fetchWithCredentials(url, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      await handleApiError(response, 'fetching ofertas');
    }
    
    const data = await response.json()
    
    if (Array.isArray(data)) {
      return {
        count: data.length,
        next: null,
        previous: null,
        results: data
      }
    }
    
    return data
  }

  async getOferta(id: number): Promise<OfertaDecenal> {
    const url = buildUrl(`${API_ENDPOINTS.garantiaDecenal.ofertas}${id}/`)
    
    const response = await fetchWithCredentials(url, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) throw new Error(`Error fetching oferta ${id}: ${response.statusText}`)
    return response.json()
  }

  async createOferta(data: Partial<OfertaDecenal> | FormData): Promise<OfertaDecenal> {
    const url = buildUrl(API_ENDPOINTS.garantiaDecenal.ofertas)
    const isFormData = data instanceof FormData

    const response = await fetchWithCredentials(url, {
      method: 'POST',
      headers: this.getHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data)
    })
    
    if (!response.ok) {
      await handleApiError(response, 'creating oferta')
    }
    return response.json()
  }

  async updateOferta(id: number, data: Partial<OfertaDecenal> | FormData): Promise<OfertaDecenal> {
    const url = buildUrl(`${API_ENDPOINTS.garantiaDecenal.ofertas}${id}/`)
    const isFormData = data instanceof FormData

    const response = await fetchWithCredentials(url, {
      method: 'PATCH',
      headers: this.getHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data)
    })
    
    if (!response.ok) {
      await handleApiError(response, 'updating oferta')
    }
    return response.json()
  }

  async deleteOferta(id: number): Promise<void> {
    const url = buildUrl(`${API_ENDPOINTS.garantiaDecenal.ofertas}${id}/`)
    
    const response = await fetchWithCredentials(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      await handleApiError(response, 'deleting oferta')
    }
  }

  // --- Compañías ---

  async getCompanias(search?: string): Promise<PaginatedResponse<CompaniaInfo>> {
    const params: Record<string, string> = { page_size: '100' }
    if (search) params.search = search
    
    const url = buildUrl('/companias/companias/', params)
    
    const response = await fetchWithCredentials(url, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      await handleApiError(response, 'fetching companias');
    }
    
    const data = await response.json()
    
    if (Array.isArray(data)) {
      return {
        count: data.length,
        next: null,
        previous: null,
        results: data
      }
    }
    
    return data
  }
}
