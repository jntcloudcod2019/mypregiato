
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
    
    console.log('[CONTRACT] Template HTML gerado, iniciando renderização...')
    
    // Criar elemento temporário com configurações melhoradas
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    tempDiv.style.position = 'fixed'
    tempDiv.style.top = '-10000px'
    tempDiv.style.left = '0'
    tempDiv.style.width = '794px' // A4 width em pixels (210mm * 3.78)
    tempDiv.style.maxWidth = '794px'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '14px'
    tempDiv.style.lineHeight = '1.6'
    tempDiv.style.color = '#000000'
    tempDiv.style.padding = '20px'
    tempDiv.style.boxSizing = 'border-box'
    tempDiv.style.zIndex = '-1000'
    tempDiv.style.visibility = 'hidden'
    
    document.body.appendChild(tempDiv)
    
    console.log('[CONTRACT] Elemento adicionado ao DOM, aguardando renderização...')
    
    // Aguardar renderização completa com mais tempo
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Verificar se o elemento foi renderizado
    const computedStyle = window.getComputedStyle(tempDiv)
    console.log('[CONTRACT] Elemento renderizado - altura:', tempDiv.offsetHeight, 'cor:', computedStyle.color)
    
    let pdfBase64: string
    
    try {
      console.log('[CONTRACT] Capturando conteúdo com html2canvas...')
      
      // Configurações otimizadas para captura
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        imageTimeout: 15000,
        removeContainer: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
        onclone: (clonedDoc) => {
          // Garantir que o elemento clonado tenha as mesmas propriedades
          const clonedElement = clonedDoc.querySelector('div')
          if (clonedElement) {
            clonedElement.style.visibility = 'visible'
            clonedElement.style.position = 'static'
            clonedElement.style.backgroundColor = '#ffffff'
            clonedElement.style.color = '#000000'
          }
        }
      })
      
      console.log('[CONTRACT] Canvas capturado, dimensões:', canvas.width, 'x', canvas.height)
      
      // Verificar se o canvas não está vazio
      const ctx = canvas.getContext('2d')
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      const hasContent = imageData?.data.some((value, index) => {
        // Verificar se não é apenas pixels brancos ou transparentes
        const alpha = imageData.data[index * 4 + 3]
        return alpha > 0 && (
          imageData.data[index * 4] < 255 || 
          imageData.data[index * 4 + 1] < 255 || 
          imageData.data[index * 4 + 2] < 255
        )
      })
      
      if (!hasContent) {
        throw new Error('Canvas capturado está vazio ou sem conteúdo visível')
      }
      
      // Gerar PDF usando jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - (margin * 2)
      
      // Converter canvas para imagem
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calcular dimensões proporcionais
      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Adicionar imagem ao PDF
      if (imgHeight <= (pageHeight - (margin * 2))) {
        // Cabe em uma página
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)
      } else {
        // Múltiplas páginas
        const pageContentHeight = pageHeight - (margin * 2)
        let remainingHeight = imgHeight
        let sourceY = 0
        
        while (remainingHeight > 0) {
          const currentPageHeight = Math.min(remainingHeight, pageContentHeight)
          const sourceHeight = (currentPageHeight * canvas.height) / imgHeight
          
          // Criar canvas para esta página
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = sourceHeight
          const pageCtx = pageCanvas.getContext('2d')
          
          if (pageCtx) {
            pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight)
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
            
            if (sourceY > 0) {
              pdf.addPage()
            }
            
            pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, currentPageHeight)
          }
          
          remainingHeight -= currentPageHeight
          sourceY += sourceHeight
        }
      }
      
      // Gerar base64
      const pdfOutput = pdf.output('datauristring')
      pdfBase64 = pdfOutput.split(',')[1]
      
    } catch (canvasError) {
      console.error('[CONTRACT] Erro no html2canvas, usando fallback:', canvasError)
      
      // Fallback: gerar PDF simples com jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15
      
      // Título
      pdf.setFontSize(18)
      pdf.setTextColor(0, 0, 0)
      
      let title = 'CONTRATO'
      switch (contractType) {
        case 'agenciamento':
          title = 'CONTRATO DE AGENCIAMENTO'
          break
        case 'comprometimento':
          title = 'CONTRATO DE COMPROMETIMENTO'
          break
        case 'super-fotos-menor':
          title = 'CONTRATO SUPER FOTOS - MENOR DE IDADE'
          break
        case 'agenciamento-menor':
          title = 'CONTRATO DE AGENCIAMENTO - MENOR DE IDADE'
          break
        default:
          title = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS'
      }
      
      pdf.text(title, pageWidth / 2, 30, { align: 'center' })
      
      // Informações básicas
      pdf.setFontSize(12)
      let yPos = 50
      
      const addLine = (text: string) => {
        pdf.text(text, margin, yPos)
        yPos += 8
      }
      
      addLine(`Local: ${contractData.cidade}/${contractData.uf}`)
      addLine(`Data: ${contractData.dia} de ${contractData.mes} de ${contractData.ano}`)
      addLine('')
      addLine('MODELO:')
      addLine(`Nome: ${contractData.modelo.fullName}`)
      addLine(`Documento: ${contractData.modelo.document}`)
      addLine(`Email: ${contractData.modelo.email}`)
      addLine(`Telefone: ${contractData.modelo.phone}`)
      addLine(`Endereço: ${contractData.modelo.street}, ${contractData.modelo.numberAddress}`)
      addLine(`${contractData.modelo.neighborhood} - ${contractData.modelo.city}`)
      addLine(`CEP: ${contractData.modelo.postalcode}`)
      
      if (contractData.valorContrato && contractData.valorContrato !== '0,00') {
        addLine('')
        addLine(`Valor: R$ ${contractData.valorContrato}`)
        addLine(`Pagamento: ${contractData.metodoPagamento.join(', ')}`)
      }
      
      if (contractData.duracaoContrato) {
        addLine(`Duração: ${contractData.duracaoContrato} meses`)
      }
      
      // Assinaturas
      yPos += 30
      addLine('_________________________')
      addLine(contractData.modelo.fullName)
      addLine('Assinatura do Modelo')
      
      yPos += 20
      addLine('_________________________')
      addLine('SUPER FOTOS FOTOGRAFIAS LTDA')
      addLine('Assinatura da Empresa')
      
      const pdfOutput = pdf.output('datauristring')
      pdfBase64 = pdfOutput.split(',')[1]
    }
    
    // Remover elemento temporário
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv)
    }
    
    console.log('[CONTRACT] PDF gerado com sucesso, tamanho:', pdfBase64.length, 'caracteres')
    
    // Verificar tamanho final
    const sizeInMB = (pdfBase64.length * 3) / (4 * 1024 * 1024)
    console.log(`[CONTRACT] Tamanho final do PDF: ${sizeInMB.toFixed(2)}MB`)
    
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
