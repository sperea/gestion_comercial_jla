import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { TodoRiesgoProyecto, OfertaTodoRiesgo } from '@/lib/types/todo-riesgo'

// Colores corporativos JLA
const COLORS = {
  primary: [139, 0, 0] as [number, number, number], // Rojo oscuro (dark red)
  secondary: [220, 20, 60] as [number, number, number], // Crimson
  lightGray: [245, 245, 245] as [number, number, number], // Gris muy claro
  mediumGray: [200, 200, 200] as [number, number, number], // Gris medio
  darkGray: [80, 80, 80] as [number, number, number], // Gris oscuro
  white: [255, 255, 255] as [number, number, number]
}

const FOOTER_TEXT = 'JLA ASOCIADOS Correduría de seguros, S.A. (www.jlaasociados.es) está inscrita en el Registro de la Dirección de Seguros y Fondos de Pensiones dependiente del Ministerio de Economía y Hacienda con la clave J-326. concertado Seguro de Responsabilidad Civil que abarca todo el territorio del Espacio Económico Europeo y Garantía Financiera conforme a la legislación vigente.'

function addFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  
  const footerLines = doc.splitTextToSize(FOOTER_TEXT, pageWidth - 28)
  const footerY = pageHeight - 20
  
  doc.text(footerLines, 14, footerY)
}

export async function generateProyectoPDF(
  proyecto: TodoRiesgoProyecto,
  ofertas: OfertaTodoRiesgo[]
) {
  const doc = new jsPDF()
  
  // Cargar logo PNG y obtener dimensiones
  let logoDataUrl: string | null = null
  let logoAspectRatio = 1
  
  try {
    const response = await fetch('/logo.png')
    const blob = await response.blob()
    
    // Crear imagen para obtener dimensiones
    const img = new Image()
    const imageUrl = URL.createObjectURL(blob)
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        logoAspectRatio = img.height / img.width
        resolve(null)
      }
      img.onerror = reject
      img.src = imageUrl
    })
    
    // Convertir a data URL
    logoDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
    
    URL.revokeObjectURL(imageUrl)
  } catch (error) {
    console.error('Error loading logo:', error)
  }
  
  // PORTADA
  // Logo en la parte superior (más grande)
  if (logoDataUrl) {
    try {
      const logoWidth = 80
      const logoHeight = logoWidth * logoAspectRatio
      
      doc.addImage(logoDataUrl, 'PNG', (doc.internal.pageSize.getWidth() - logoWidth) / 2, 25, logoWidth, logoHeight)
    } catch (error) {
      console.error('Error adding logo to PDF:', error)
    }
  }
  
  doc.setFontSize(24)
  doc.setTextColor(...COLORS.primary)
  doc.text('PROYECTO DE SEGURO', doc.internal.pageSize.getWidth() / 2, 90, { align: 'center' })
  doc.text('TODO RIESGO CONSTRUCCIÓN', doc.internal.pageSize.getWidth() / 2, 110, { align: 'center' })
  
  doc.setFontSize(16)
  doc.setTextColor(...COLORS.darkGray)
  doc.setFont('helvetica', 'bold')
  
  const tomadorLines = doc.splitTextToSize(proyecto.tomador, 170)
  doc.text(tomadorLines, doc.internal.pageSize.getWidth() / 2, 150, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  const obraY = 150 + (tomadorLines.length * 8) + 10
  const obraLines = doc.splitTextToSize(proyecto.obra, 170)
  doc.text(obraLines, doc.internal.pageSize.getWidth() / 2, obraY, { align: 'center' })
  
  // PÁGINA POR CADA OFERTA
  ofertas.forEach((oferta, index) => {
    doc.addPage()
    
    // Título de la oferta
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    const titleY = 20
    doc.text(
      `OFERTA ${index + 1} - ${oferta.compania_info?.rsocial || 'N/A'}`,
      14,
      titleY
    )
    
    // Logo alineado con el título (misma altura)
    if (logoDataUrl) {
      try {
        const logoWidth = 45
        const logoHeight = logoWidth * logoAspectRatio
        // Centrar verticalmente con el texto del título
        const logoY = titleY - (logoHeight / 2) - 2
        
        doc.addImage(logoDataUrl, 'PNG', doc.internal.pageSize.getWidth() - logoWidth - 14, logoY, logoWidth, logoHeight)
      } catch (error) {
        console.error('Error adding logo to offer page:', error)
      }
    }
    
    // Tabla de información general (con más margen después del encabezado)
    autoTable(doc, {
      startY: 40,
      head: [['FECHA', 'ASEGURADORA', 'OBRA', 'EMPRESA']],
      body: [[
        new Date(proyecto.fecha_creacion).toLocaleDateString('es-ES'),
        oferta.compania_info?.rsocial || 'N/A',
        proyecto.obra,
        proyecto.tomador
      ]],
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fillColor: COLORS.lightGray,
        halign: 'center'
      },
      theme: 'grid'
    })
    
    // Tabla de detalles del proyecto
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Situación de la parcela', 'Capital asegurado', 'Duración de la obra']],
      body: [[
        proyecto.situacion,
        `${Number(oferta.capital.replace(',', '.')).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`,
        `${proyecto.duracion} meses`
      ]],
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fillColor: COLORS.lightGray,
        halign: 'center'
      },
      theme: 'grid'
    })
    
    // COBERTURAS
    const currentY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    doc.text('COBERTURAS', 14, currentY)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    
    const coberturas = oferta.coberturas_info?.map(c => `• ${c.descripcion}`).join('\n') || 'No especificadas'
    const coberturasLines = doc.splitTextToSize(coberturas, 180)
    doc.text(coberturasLines, 14, currentY + 7)
    
    // FRANQUICIAS
    // Reduced spacing: changed + 10 to + 4
    const franquiciasY = currentY + 7 + (coberturasLines.length * 5) + 4
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    doc.text('FRANQUICIAS', 14, franquiciasY)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    
    const franquicias = oferta.franquicias_info?.map(f => `• ${f.descripcion}: ${f.valor}`).join('\n') || 'No especificadas'
    const franquiciasLines = doc.splitTextToSize(franquicias, 180)
    doc.text(franquiciasLines, 14, franquiciasY + 7)
    
    // Tabla de precios
    autoTable(doc, {
      startY: franquiciasY + 7 + (franquiciasLines.length * 5) + 10,
      head: [['Tasas aplicables', 'Prima Neta', 'Prima Total']],
      body: [[
        oferta.tasas,
        `${oferta.prima_neta} €`,
        `${oferta.prima_total} €`
      ]],
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fillColor: COLORS.lightGray,
        halign: 'center',
        fontStyle: 'bold'
      },
      theme: 'grid'
    })
    
    // AVISO / NOTAS
    if (oferta.aviso) {
        const tableFinalY = (doc as any).lastAutoTable.finalY
        const avisoY = tableFinalY + 10
        
        doc.setFontSize(10)
        doc.setTextColor(...COLORS.primary)
        doc.setFont('helvetica', 'bold')
        doc.text('AVISO / NOTAS', 14, avisoY)
        
        doc.setFontSize(8)
        doc.setTextColor(...COLORS.darkGray)
        doc.setFont('helvetica', 'italic')
        
        const avisoLines = doc.splitTextToSize(oferta.aviso, 180)
        doc.text(avisoLines, 14, avisoY + 6)
    }

    // Añadir footer con texto legal
    addFooter(doc, index + 2) // +2 porque la portada es página 1
  })
  
  // Descargar PDF
  doc.save(`proyecto_${proyecto.id}_${proyecto.obra.replace(/\s+/g, '_')}.pdf`)
}
