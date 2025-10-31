import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

interface InmuebleDetalle {
  ref_catastral: string
  nombre_municipio: string
  nombre_provincia: string
  cp?: string
  tipo_via: string
  nombre_via: string
  num_policia_1?: string
  letra_1?: string
  num_policia_2?: string
  letra_2?: string
  bloque?: string
  escalera?: string
  planta: string
  puerta: string
  anyo_antiguedad_bien?: string
  sup_inmueble_construido?: string
  clave_grupo_bice_o_uso?: string
  // Nuevos campos del backend
  m2_privados_cat_14: number
  m2_cat_15: number
  m2_comunes_parcela: number
  m2_comunes_reparto_simple: number
}

interface ReporteData {
  inmuebles: InmuebleDetalle[]
  selectedIndices: Set<number>
  refCatastral: string
}

export class PDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margins = { top: 20, right: 20, bottom: 20, left: 20 }
  
  private safeString(value: string | undefined, defaultValue: string = ''): string {
    return value || defaultValue
  }

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
  }

  private obtenerTipoInmueble(clave: string) {
    switch (clave) {
      case 'V': return 'Vivienda'
      case 'C': return 'Comercial'
      case 'O': return 'Oficina'
      case 'A': return 'Almacén'
      default: return 'Otro'
    }
  }

  private formatearDireccion(inmueble: InmuebleDetalle) {
    const numero = inmueble.num_policia_1 ? parseInt(inmueble.num_policia_1, 10).toString() : ''
    const letra = inmueble.letra_1 && inmueble.letra_1.trim() ? ` ${inmueble.letra_1.trim()}` : ''
    return `${inmueble.tipo_via} ${inmueble.nombre_via} ${numero}${letra}`
  }

  private addHeader(inmueble: InmuebleDetalle) {
    // Logo y título principal
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(40, 40, 40)
    this.doc.text('INFORME DE INMUEBLES SELECCIONADOS', this.pageWidth / 2, 30, { align: 'center' })
    
    // Línea separadora
    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(this.margins.left, 35, this.pageWidth - this.margins.right, 35)

    // Información del edificio
    let yPos = 50
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(60, 60, 60)
    this.doc.text('INFORMACION DEL EDIFICIO', this.margins.left, yPos)

    yPos += 10
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    // Dirección completa
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Dirección:', this.margins.left, yPos)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(this.formatearDireccion(inmueble), this.margins.left + 25, yPos)
    
    yPos += 7
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Municipio:', this.margins.left, yPos)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(inmueble.nombre_municipio, this.margins.left + 25, yPos)
    
    yPos += 7
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Provincia:', this.margins.left, yPos)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(inmueble.nombre_provincia, this.margins.left + 25, yPos)
    
    yPos += 7
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Código Postal:', this.margins.left, yPos)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(this.safeString(inmueble.cp, 'N/A'), this.margins.left + 35, yPos)
    
    yPos += 7
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Año de Construcción:', this.margins.left, yPos)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(inmueble.anyo_antiguedad_bien || 'N/A', this.margins.left + 45, yPos)

    return yPos + 15
  }

  private addStatistics(data: ReporteData, yPos: number) {
    const selectedInmuebles = Array.from(data.selectedIndices).map(index => data.inmuebles[index])
    
    // Calcular estadísticas por tipo
    const estadisticas = selectedInmuebles.reduce((acc, inmueble) => {
      const tipo = this.obtenerTipoInmueble(this.safeString(inmueble.clave_grupo_bice_o_uso))
      if (!acc[tipo]) {
        acc[tipo] = { cantidad: 0, superficie: 0 }
      }
      acc[tipo].cantidad++
      acc[tipo].superficie += parseInt(inmueble.sup_inmueble_construido || '0')
      return acc
    }, {} as Record<string, { cantidad: number; superficie: number }>)

    // Título de estadísticas
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(60, 60, 60)
    this.doc.text('RESUMEN ESTADISTICO', this.margins.left, yPos)
    yPos += 10

    // Crear tabla de estadísticas
    const estadisticasData = Object.entries(estadisticas).map(([tipo, stats]) => [
      tipo,
      stats.cantidad.toString(),
      `${stats.superficie.toLocaleString()} m²`,
      `${((stats.superficie / selectedInmuebles.reduce((sum, i) => sum + parseInt(i.sup_inmueble_construido || '0'), 0)) * 100).toFixed(1)}%`
    ])

    // Añadir fila de totales
    const totalSuperficie = selectedInmuebles.reduce((sum, i) => sum + parseInt(i.sup_inmueble_construido || '0'), 0)
    estadisticasData.push([
      'TOTAL',
      selectedInmuebles.length.toString(),
      `${totalSuperficie.toLocaleString()} m²`,
      '100.0%'
    ])

    autoTable(this.doc, {
      head: [['Tipo de Inmueble', 'Cantidad', 'Superficie Total', '% del Total']],
      body: estadisticasData,
      startY: yPos,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 25, halign: 'center' }
      }
    })

    return (this.doc as any).lastAutoTable.finalY + 15
  }

  private async addMap(yPos: number): Promise<number> {
    try {
      // Buscar el elemento del mapa
      const mapElement = document.querySelector('[style*="height: 300px"]') as HTMLElement
      
      if (mapElement) {
        console.log('📷 Capturando mapa para PDF...')
        
        // Capturar el mapa como imagen
        const canvas = await html2canvas(mapElement, {
          useCORS: true,
          allowTaint: true,
          scale: 1,
          width: mapElement.offsetWidth,
          height: mapElement.offsetHeight
        })
        
        const imgData = canvas.toDataURL('image/png')
        
        // Título del mapa
        this.doc.setFontSize(14)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(60, 60, 60)
        this.doc.text('UBICACION', this.margins.left, yPos)
        yPos += 10
        
        // Calcular dimensiones para el mapa en el PDF
        const mapWidth = this.pageWidth - (this.margins.left + this.margins.right)
        const mapHeight = (mapWidth * canvas.height) / canvas.width
        
        // Verificar si necesitamos una nueva página
        if (yPos + mapHeight > this.pageHeight - this.margins.bottom) {
          this.doc.addPage()
          yPos = this.margins.top + 10
          this.doc.text('UBICACION', this.margins.left, yPos)
          yPos += 10
        }
        
        // Añadir la imagen del mapa
        this.doc.addImage(imgData, 'PNG', this.margins.left, yPos, mapWidth, mapHeight)
        
        return yPos + mapHeight + 15
      } else {
        console.warn('⚠️ No se encontró el elemento del mapa para capturar')
        return yPos
      }
    } catch (error) {
      console.error('❌ Error capturando el mapa:', error)
      return yPos
    }
  }

  private addInmueblesList(data: ReporteData, yPos: number) {
    const selectedInmuebles = Array.from(data.selectedIndices).map(index => ({
      ...data.inmuebles[index],
      originalIndex: index
    }))

    // Ordenar inmuebles igual que en la interfaz
    selectedInmuebles.sort((a, b) => {
      const numA = a.num_policia_1 ? parseInt(a.num_policia_1) || 0 : 0
      const numB = b.num_policia_1 ? parseInt(b.num_policia_1) || 0 : 0
      if (numA !== numB) return numA - numB
      
      const plantaA = a.planta === 'BJ' ? -1 : (parseInt(this.safeString(a.planta, '0')) || 0)
      const plantaB = b.planta === 'BJ' ? -1 : (parseInt(this.safeString(b.planta, '0')) || 0)
      if (plantaA !== plantaB) return plantaA - plantaB
      
      const puertaA = a.puerta || ''
      const puertaB = b.puerta || ''
      if (puertaA !== puertaB) return puertaA.localeCompare(puertaB)
      
      const escaleraA = parseInt(this.safeString(a.escalera, '0')) || 0
      const escaleraB = parseInt(this.safeString(b.escalera, '0')) || 0
      if (escaleraA !== escaleraB) return escaleraA - escaleraB
      
      const bloqueA = parseInt(this.safeString(a.bloque, '0')) || 0
      const bloqueB = parseInt(this.safeString(b.bloque, '0')) || 0
      return bloqueA - bloqueB
    })

    // Título de la lista
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(60, 60, 60)
    this.doc.text('DETALLE DE INMUEBLES SELECCIONADOS', this.margins.left, yPos)
    yPos += 10

    // Preparar datos para la tabla
    const tableData = selectedInmuebles.map((inmueble, index) => [
      (index + 1).toString(),
      this.obtenerTipoInmueble(this.safeString(inmueble.clave_grupo_bice_o_uso)),
      inmueble.num_policia_1 ? parseInt(inmueble.num_policia_1).toString() : 'S/N',
      inmueble.letra_1?.trim() || '',
      inmueble.planta === 'BJ' ? 'Bajo' : inmueble.planta || 'N/A',
      inmueble.puerta || 'N/A',
      inmueble.escalera || 'N/A',
      inmueble.bloque || 'N/A',
      `${parseInt(inmueble.sup_inmueble_construido || '0').toLocaleString()} m²`,
      inmueble.ref_catastral
    ])

    // Crear la tabla
    autoTable(this.doc, {
      head: [['#', 'Tipo', 'Nº', 'Lt', 'Planta', 'Puerta', 'Esc', 'Bloque', 'Superficie', 'Ref. Catastral']],
      body: tableData,
      startY: yPos,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },  // #
        1: { cellWidth: 20 },                    // Tipo
        2: { cellWidth: 12, halign: 'center' },  // Nº
        3: { cellWidth: 8, halign: 'center' },   // Lt
        4: { cellWidth: 15, halign: 'center' },  // Planta
        5: { cellWidth: 15, halign: 'center' },  // Puerta
        6: { cellWidth: 12, halign: 'center' },  // Esc
        7: { cellWidth: 15, halign: 'center' },  // Bloque
        8: { cellWidth: 25, halign: 'right' },   // Superficie
        9: { cellWidth: 38, fontSize: 7 }        // Ref. Catastral
      },
      margin: { left: this.margins.left, right: this.margins.right }
    })
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    
    // Empezar desde la página 2 (no mostrar footer en la primera página)
    for (let i = 2; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Línea superior del pie
      this.doc.setDrawColor(200, 200, 200)
      this.doc.line(this.margins.left, this.pageHeight - 15, this.pageWidth - this.margins.right, this.pageHeight - 15)
      
      // Información del pie
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(120, 120, 120)
      
      // Fecha de generación
      const fechaActual = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      this.doc.text(`Generado el ${fechaActual}`, this.margins.left, this.pageHeight - 8)
      
      // Número de página
      this.doc.text(`Página ${i} de ${pageCount}`, this.pageWidth - this.margins.right, this.pageHeight - 8, { align: 'right' })
      
      // Sistema
      this.doc.text('Sistema de Gestión Catastral - JLA Asociados', this.pageWidth / 2, this.pageHeight - 8, { align: 'center' })
    }
  }

  public async generateReport(data: ReporteData): Promise<void> {
    try {
      console.log('📄 Generando informe PDF...')
      
      if (data.selectedIndices.size === 0) {
        throw new Error('No hay inmuebles seleccionados para generar el informe')
      }

      const primerInmueble = data.inmuebles[Array.from(data.selectedIndices)[0]]
      
      // Añadir header con información del edificio
      let currentY = this.addHeader(primerInmueble)
      
      // Añadir estadísticas
      currentY = this.addStatistics(data, currentY)
      
      // Añadir mapa (con captura de pantalla)
      currentY = await this.addMap(currentY)
      
      // Verificar si necesitamos nueva página para la lista
      if (currentY > this.pageHeight - 100) {
        this.doc.addPage()
        currentY = this.margins.top
      }
      
      // Añadir lista de inmuebles
      this.addInmueblesList(data, currentY)
      
      // Añadir pie de página
      this.addFooter()
      
      // Generar nombre del archivo
      const fechaHora = new Date().toISOString().slice(0, 16).replace(/:/g, '-')
      const nombreArchivo = `Informe_Inmuebles_${data.selectedIndices.size}_seleccionados_${fechaHora}.pdf`
      
      // Descargar el PDF
      this.doc.save(nombreArchivo)
      
      console.log(`✅ PDF generado correctamente: ${nombreArchivo}`)
      
    } catch (error) {
      console.error('❌ Error generando el PDF:', error)
      throw error
    }
  }
}