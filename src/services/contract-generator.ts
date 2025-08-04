
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
    console.log('[CONTRACT] Iniciando geração do PDF...', contractType, contractData)
    
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
    
    console.log('[CONTRACT] Template HTML gerado, criando elemento temporário...')
    
    // Criar elemento temporário para renderizar o HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    tempDiv.style.width = '595px' // Largura A4 em pixels (210mm)
    tempDiv.style.backgroundColor = 'white'
    tempDiv.style.padding = '20px'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '12px'
    tempDiv.style.lineHeight = '1.4'
    tempDiv.style.color = 'black'
    tempDiv.style.boxSizing = 'border-box'
    document.body.appendChild(tempDiv)
    
    // Aguardar um tempo para o DOM ser renderizado
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('[CONTRACT] Capturando como canvas...')
    
    // Capturar como canvas com configurações otimizadas para menor tamanho
    const canvas = await html2canvas(tempDiv, {
      scale: 1.5, // Reduzido de 2 para 1.5
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 595, // Largura A4
      height: tempDiv.scrollHeight,
      logging: false,
      imageTimeout: 15000,
      removeContainer: true,
      quality: 0.8 // Adicionar qualidade reduzida para diminuir tamanho
    })
    
    console.log('[CONTRACT] Canvas capturado, dimensões:', canvas.width, 'x', canvas.height)
    
    // Remover elemento temporário
    document.body.removeChild(tempDiv)
    
    console.log('[CONTRACT] Criando PDF...')
    
    // Criar PDF com configurações A4 otimizadas
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Converter canvas para imagem com qualidade reduzida
    const imgData = canvas.toDataURL('image/jpeg', 0.8) // JPEG com qualidade 0.8 ao invés de PNG
    
    // Calcular dimensões para A4
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 20 // margem de 10mm de cada lado
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    let position = 10 // margem superior
    
    console.log(`[CONTRACT] Dimensões: PDF ${pageWidth}x${pageHeight}, Imagem ${imgWidth}x${imgHeight}`)
    
    // Adicionar primeira página
    if (imgHeight <= pageHeight - 20) {
      // Se cabe em uma página
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
    } else {
      // Se precisa de múltiplas páginas
      let remainingHeight = imgHeight
      let sourceY = 0
      
      while (remainingHeight > 0) {
        const pageImageHeight = Math.min(remainingHeight, pageHeight - 20)
        const sourceHeight = (pageImageHeight * canvas.height) / imgHeight
        
        // Criar canvas temporário para essa página
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = sourceHeight
        const pageCtx = pageCanvas.getContext('2d')
        
        if (pageCtx) {
          pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight)
          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.8)
          
          if (sourceY > 0) {
            pdf.addPage()
          }
          
          pdf.addImage(pageImgData, 'JPEG', 10, 10, imgWidth, pageImageHeight)
        }
        
        remainingHeight -= pageImageHeight
        sourceY += sourceHeight
      }
    }
    
    // Retornar como base64
    const pdfOutput = pdf.output('datauristring')
    const pdfBase64 = pdfOutput.split(',')[1]
    
    console.log('[CONTRACT] PDF gerado com sucesso, tamanho:', pdfBase64.length, 'caracteres')
    
    // Verificar se o tamanho é razoável (menos de 10MB)
    const sizeInMB = (pdfBase64.length * 3) / (4 * 1024 * 1024)
    console.log(`[CONTRACT] Tamanho estimado do PDF: ${sizeInMB.toFixed(2)}MB`)
    
    if (sizeInMB > 10) {
      console.warn('[CONTRACT] PDF muito grande, pode haver problemas de performance')
    }
    
    return pdfBase64
  } catch (error) {
    console.error('[CONTRACT] Erro ao gerar PDF:', error)
    throw new Error(`Erro ao gerar contrato PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
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
