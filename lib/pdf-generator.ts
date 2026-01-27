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
  
  // PORTADA
  doc.setFontSize(24)
  doc.setTextColor(...COLORS.primary)
  doc.text('PROYECTO DE SEGURO', doc.internal.pageSize.getWidth() / 2, 80, { align: 'center' })
  doc.text('TODO RIESGO CONSTRUCCIÓN', doc.internal.pageSize.getWidth() / 2, 100, { align: 'center' })
  
  doc.setFontSize(16)
  doc.setTextColor(...COLORS.darkGray)
  doc.setFont('helvetica', 'bold')
  doc.text(proyecto.tomador, doc.internal.pageSize.getWidth() / 2, 140, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.text(proyecto.obra, doc.internal.pageSize.getWidth() / 2, 160, { align: 'center' })
  
  // TODO: Añadir logo JLA si está disponible
  // const logoUrl = '/logo-jla.png'
  // doc.addImage(logoUrl, 'PNG', 80, 30, 50, 25)
  
  // PÁGINA POR CADA OFERTA
  ofertas.forEach((oferta, index) => {
    doc.addPage()
    
    // Título de la oferta
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `OFERTA ${index + 1} - ${oferta.compania_info?.rsocial || 'N/A'}`,
      14,
      20
    )
    
    // Tabla de información general
    autoTable(doc, {
      startY: 30,
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
        `${Number(oferta.capital).toLocaleString()} €`,
        `${proyecto.duracion} meses`
      ]],
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fillColor: COLORS.mediumGray,
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
    const franquiciasY = currentY + 7 + (coberturasLines.length * 5) + 10
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
        fillColor: COLORS.darkGray,
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
    
    // Añadir footer con texto legal
    addFooter(doc, index + 2) // +2 porque la portada es página 1
  })
  
  // Descargar PDF
  doc.save(`proyecto_${proyecto.id}_${proyecto.obra.replace(/\s+/g, '_')}.pdf`)
}
