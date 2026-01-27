import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { TodoRiesgoProyecto, OfertaTodoRiesgo } from '@/lib/types/todo-riesgo'

export async function generateProyectoPDF(
  proyecto: TodoRiesgoProyecto,
  ofertas: OfertaTodoRiesgo[]
) {
  const doc = new jsPDF()
  
  // PORTADA
  doc.setFontSize(24)
  doc.setTextColor(30, 58, 138) // blue-900
  doc.text('PROYECTO DE SEGURO', doc.internal.pageSize.getWidth() / 2, 80, { align: 'center' })
  doc.text('TODO RIESGO CONSTRUCCIÓN', doc.internal.pageSize.getWidth() / 2, 100, { align: 'center' })
  
  doc.setFontSize(16)
  doc.setTextColor(55, 65, 81) // gray-700
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
    doc.setTextColor(30, 58, 138)
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
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fillColor: [245, 245, 220],
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
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fillColor: [173, 216, 230],
        halign: 'center'
      },
      theme: 'grid'
    })
    
    // COBERTURAS
    const currentY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(12)
    doc.setTextColor(30, 58, 138)
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
    doc.setTextColor(30, 58, 138)
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
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fillColor: [144, 238, 144],
        halign: 'center',
        fontStyle: 'bold'
      },
      theme: 'grid'
    })
  })
  
  // Descargar PDF
  doc.save(`proyecto_${proyecto.id}_${proyecto.obra.replace(/\s+/g, '_')}.pdf`)
}
