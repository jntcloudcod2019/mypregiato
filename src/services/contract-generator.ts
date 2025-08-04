
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
    
    console.log('[CONTRACT] Template HTML gerado, gerando PDF otimizado...')
    
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Configurações otimizadas do PDF
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)
    
    // Processar o HTML com configurações otimizadas para reduzir tamanho
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    tempDiv.style.width = `${contentWidth * 3}px` // Reduzido de 3.78 para 3
    tempDiv.style.backgroundColor = 'white'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '12px' // Reduzido de 14px para 12px
    tempDiv.style.lineHeight = '1.4' // Reduzido de 1.6 para 1.4
    tempDiv.style.color = '#000000'
    tempDiv.style.padding = '15px' // Reduzido de 20px para 15px
    tempDiv.style.boxSizing = 'border-box'
    document.body.appendChild(tempDiv)
    
    // Aguardar renderização completa
    await new Promise(resolve => setTimeout(resolve, 300))
    
    console.log('[CONTRACT] Capturando conteúdo com resolução otimizada...')
    
    try {
      // Capturar com configurações otimizadas para menor tamanho
      const canvas = await html2canvas(tempDiv, {
        scale: 1.2, // Reduzido de 2 para 1.2 para menor tamanho
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 8000,
        removeContainer: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
        // Configurações adicionais para otimização
        foreignObjectRendering: true,
        ignoreElements: (element) => {
          // Ignorar elementos que podem causar problemas de renderização
          return element.tagName === 'IFRAME' || element.tagName === 'SCRIPT'
        }
      })
      
      console.log('[CONTRACT] Canvas capturado, dimensões:', canvas.width, 'x', canvas.height)
      
      // Remover elemento temporário
      document.body.removeChild(tempDiv)
      
      // Converter para imagem JPEG com compressão para reduzir tamanho
      const imgData = canvas.toDataURL('image/jpeg', 0.85) // JPEG com 85% qualidade ao invés de PNG 100%
      
      // Calcular dimensões
      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      let yPosition = margin
      
      // Verificar se precisa de múltiplas páginas
      if (imgHeight <= (pageHeight - (margin * 2))) {
        // Cabe em uma página
        pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight, undefined, 'FAST')
      } else {
        // Múltiplas páginas
        const pageContentHeight = pageHeight - (margin * 2)
        let remainingHeight = imgHeight
        let sourceY = 0
        
        while (remainingHeight > 0) {
          const currentPageHeight = Math.min(remainingHeight, pageContentHeight)
          const sourceHeight = (currentPageHeight * canvas.height) / imgHeight
          
          // Canvas para esta página
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = sourceHeight
          const pageCtx = pageCanvas.getContext('2d')
          
          if (pageCtx) {
            // Configurações de qualidade otimizada
            pageCtx.imageSmoothingEnabled = true
            pageCtx.imageSmoothingQuality = 'medium'
            
            pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight)
            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85)
            
            if (sourceY > 0) {
              pdf.addPage()
            }
            
            pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidth, currentPageHeight, undefined, 'FAST')
          }
          
          remainingHeight -= currentPageHeight
          sourceY += sourceHeight
        }
      }
      
    } catch (canvasError) {
      console.error('[CONTRACT] Erro no html2canvas:', canvasError)
      // Remover elemento se ainda existir
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
      
      // Fallback: gerar PDF simples com texto
      console.log('[CONTRACT] Usando fallback: PDF apenas com texto')
      
      pdf.setFontSize(16)
      pdf.text('CONTRATO', pageWidth / 2, 30, { align: 'center' })
      
      pdf.setFontSize(12)
      const lines = [
        `Contrato celebrado em ${contractData.cidade}/${contractData.uf}`,
        `Data: ${contractData.dia} de ${contractData.mes} de ${contractData.ano}`,
        `Modelo: ${contractData.modelo.fullName}`,
        `Documento: ${contractData.modelo.document}`,
        `Email: ${contractData.modelo.email}`,
        `Telefone: ${contractData.modelo.phone}`,
        `Duração: ${contractData.duracaoContrato || 12} meses`
      ]
      
      let yPos = 50
      lines.forEach(line => {
        pdf.text(line, margin, yPos)
        yPos += 10
      })
    }
    
    // Gerar output em base64 (sempre convertido em base64)
    const pdfOutput = pdf.output('datauristring')
    const pdfBase64 = pdfOutput.split(',')[1]
    
    console.log('[CONTRACT] PDF gerado e convertido para base64, tamanho:', pdfBase64.length, 'caracteres')
    
    // Verificar tamanho final
    const sizeInMB = (pdfBase64.length * 3) / (4 * 1024 * 1024)
    console.log(`[CONTRACT] Tamanho final do PDF: ${sizeInMB.toFixed(2)}MB`)
    
    // Verificar se ainda está muito grande
    if (sizeInMB > 20) { // Limite mais conservador
      console.warn(`[CONTRACT] PDF ainda grande (${sizeInMB.toFixed(2)}MB), mas dentro do limite aceitável`)
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
