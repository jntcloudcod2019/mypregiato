import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { ContractData } from '@/types/contract'
import { getContractTemplate } from '@/templates/super-fotos-contract'
import { getAgenciamentoContractTemplate } from '@/templates/agenciamento-contract'
import { getComprometimentoContractTemplate } from '@/templates/comprometimento-contract'
import { getSuperFotosMenorContractTemplate } from '@/templates/super-fotos-menor-contract'
import { getAgenciamentoMenorContractTemplate } from '@/templates/agenciamento-menor-contract'

export type ContractType = 
  | 'super-fotos' 
  | 'agenciamento' 
  | 'comprometimento' 
  | 'super-fotos-menor' 
  | 'agenciamento-menor'

export const generateContractPDF = async (
  contractData: ContractData, 
  contractType: ContractType = 'super-fotos'
): Promise<string> => {
  try {
    console.log('[CONTRACT] Iniciando geração do PDF...', contractType)
    
    // Selecionar o template correto baseado no tipo
    let htmlContent: string
    
    switch (contractType) {
      case 'agenciamento':
        htmlContent = getAgenciamentoContractTemplate({
          ...contractData,
          ano: new Date().getFullYear().toString()
        })
        break
      case 'comprometimento':
        htmlContent = getComprometimentoContractTemplate({
          ...contractData,
          ano: new Date().getFullYear().toString()
        })
        break
      case 'super-fotos-menor':
        htmlContent = getSuperFotosMenorContractTemplate({
          ...contractData,
          ano: new Date().getFullYear().toString()
        })
        break
      case 'agenciamento-menor':
        htmlContent = getAgenciamentoMenorContractTemplate({
          ...contractData,
          ano: new Date().getFullYear().toString()
        })
        break
      case 'super-fotos':
      default:
        htmlContent = getContractTemplate({
          ...contractData,
          ano: new Date().getFullYear().toString()
        })
        break
    }
    
    // Criar elemento temporário para renderizar o HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    tempDiv.style.width = '800px'
    tempDiv.style.backgroundColor = 'white'
    tempDiv.style.padding = '20px'
    document.body.appendChild(tempDiv)
    
    // Aguardar um tempo para o DOM ser renderizado
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Capturar como canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: tempDiv.scrollHeight
    })
    
    // Remover elemento temporário
    document.body.removeChild(tempDiv)
    
    // Criar PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    
    // Calcular dimensões para A4
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 20 // margem de 10mm de cada lado
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    let position = 10 // margem superior
    let remainingHeight = imgHeight
    
    // Adicionar primeira página
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight > pageHeight - 20 ? pageHeight - 20 : imgHeight)
    
    // Se a imagem for maior que uma página, adicionar páginas extras
    if (imgHeight > pageHeight - 20) {
      remainingHeight -= (pageHeight - 20)
      position = -(pageHeight - 20)
      
      while (remainingHeight > 0) {
        pdf.addPage()
        const heightToAdd = remainingHeight > pageHeight - 20 ? pageHeight - 20 : remainingHeight
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        remainingHeight -= heightToAdd
        position -= heightToAdd
      }
    }
    
    // Retornar como base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1]
    console.log('[CONTRACT] PDF gerado com sucesso')
    
    return pdfBase64
  } catch (error) {
    console.error('[CONTRACT] Erro ao gerar PDF:', error)
    throw new Error('Erro ao gerar contrato PDF')
  }
}

export const normalizePhoneToE164 = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Se o número já tem código do país, usa como está
  if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
    return `+${cleanPhone}`
  }
  
  // Se não tem código do país, adiciona +55 (Brasil)
  if (cleanPhone.length === 11) {
    return `+55${cleanPhone}`
  }
  
  // Se tem 10 dígitos, adiciona um 9 depois do DDD para celular
  if (cleanPhone.length === 10) {
    const ddd = cleanPhone.substring(0, 2)
    const number = cleanPhone.substring(2)
    return `+55${ddd}9${number}`
  }
  
  // Retorna o número como está se não conseguir normalizar
  return phone
}
