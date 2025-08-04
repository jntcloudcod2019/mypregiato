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
    console.log('[CONTRACT] HTML Content length:', htmlContent.length)
    
    // Criar elemento temporário com configurações otimizadas
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // Configurações melhoradas para renderização
    tempDiv.style.cssText = `
      position: fixed;
      top: -20000px;
      left: 0;
      width: 794px;
      min-height: 1123px;
      max-width: 794px;
      background-color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: black;
      padding: 20px;
      box-sizing: border-box;
      z-index: 9999;
      visibility: visible;
      opacity: 1;
      display: block;
    `
    
    document.body.appendChild(tempDiv)
    console.log('[CONTRACT] Elemento adicionado ao DOM')
    
    // Aguardar renderização com mais tempo e verificações
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Verificações de renderização
    const computedStyle = window.getComputedStyle(tempDiv)
    console.log('[CONTRACT] Elemento renderizado:')
    console.log('- Altura:', tempDiv.offsetHeight)
    console.log('- Largura:', tempDiv.offsetWidth)
    console.log('- Cor do texto:', computedStyle.color)
    console.log('- Cor de fundo:', computedStyle.backgroundColor)
    console.log('- Visibilidade:', computedStyle.visibility)
    
    let pdfBase64: string
    
    try {
      console.log('[CONTRACT] Iniciando captura com html2canvas...')
      
      // Configurações otimizadas para captura
      const canvasOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 30000,
        removeContainer: false,
        width: 794,
        height: tempDiv.scrollHeight || 1123,
        windowWidth: 794,
        windowHeight: tempDiv.scrollHeight || 1123,
        foreignObjectRendering: true,
        ignoreElements: (element: Element) => {
          // Ignorar elementos que podem causar problemas
          return element.tagName === 'SCRIPT' || element.tagName === 'NOSCRIPT'
        },
        onclone: (clonedDoc: Document) => {
          console.log('[CONTRACT] Processando documento clonado...')
          const clonedElement = clonedDoc.body.querySelector('div')
          if (clonedElement) {
            clonedElement.style.cssText = `
              position: static;
              visibility: visible;
              opacity: 1;
              display: block;
              background-color: white;
              color: black;
              width: 794px;
              min-height: 1123px;
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              padding: 20px;
              box-sizing: border-box;
            `
            
            // Garantir que todos os elementos filhos estejam visíveis
            const allElements = clonedElement.querySelectorAll('*')
            allElements.forEach(el => {
              if (el instanceof HTMLElement) {
                el.style.visibility = 'visible'
                el.style.opacity = '1'
                el.style.display = el.style.display || 'block'
              }
            })
            
            console.log('[CONTRACT] Documento clonado configurado')
          }
        }
      }
      
      const canvas = await html2canvas(tempDiv, canvasOptions)
      
      console.log('[CONTRACT] Canvas capturado:')
      console.log('- Largura:', canvas.width)
      console.log('- Altura:', canvas.height)
      
      // Verificação simplificada de conteúdo - apenas verificar se o canvas não está completamente vazio
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Não foi possível obter contexto do canvas')
      }
      
      // Verificar uma amostra de pixels para confirmar que há conteúdo
      const sampleSize = Math.min(canvas.width, canvas.height, 100)
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
      const pixels = imageData.data
      
      // Verificar se há pixels que não são completamente transparentes
      let hasVisibleContent = false
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 0) { // Pixel com alpha > 0
          hasVisibleContent = true
          break
        }
      }
      
      console.log('[CONTRACT] Canvas tem conteúdo visível:', hasVisibleContent)
      
      if (!hasVisibleContent) {
        console.warn('[CONTRACT] Canvas parece estar vazio, tentando novamente...')
        
        // Tentar novamente com configurações diferentes
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const retryCanvas = await html2canvas(tempDiv, {
          ...canvasOptions,
          scale: 1,
          height: Math.max(tempDiv.scrollHeight, 1123),
          useCORS: false
        })
        
        console.log('[CONTRACT] Segundo canvas capturado:', retryCanvas.width, 'x', retryCanvas.height)
        
        // Se ainda assim estiver vazio, prosseguir mesmo assim
        pdfBase64 = await this.createPDFFromCanvas(retryCanvas)
      } else {
        pdfBase64 = await this.createPDFFromCanvas(canvas)
      }
      
    } catch (canvasError) {
      console.error('[CONTRACT] Erro no html2canvas:', canvasError)
      console.log('[CONTRACT] Usando fallback de PDF simples...')
      
      // Fallback mais robusto
      pdfBase64 = await this.createFallbackPDF(contractData, contractType)
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

// Método auxiliar para criar PDF a partir do canvas
const createPDFFromCanvas = async (canvas: HTMLCanvasElement): Promise<string> => {
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
  
  console.log('[CONTRACT] Adicionando imagem ao PDF:', imgWidth, 'x', imgHeight)
  
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
  return pdfOutput.split(',')[1]
}

// Método auxiliar para fallback de PDF
const createFallbackPDF = async (contractData: ContractData, contractType: ContractType): Promise<string> => {
  console.log('[CONTRACT] Gerando PDF fallback mais completo...')
  
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 15
  const lineHeight = 6
  let yPos = 30
  
  // Função para adicionar texto com quebra de linha
  const addText = (text: string, fontSize = 12, isBold = false) => {
    if (yPos > 270) {
      pdf.addPage()
      yPos = 30
    }
    
    pdf.setFontSize(fontSize)
    if (isBold) {
      pdf.setFont('helvetica', 'bold')
    } else {
      pdf.setFont('helvetica', 'normal')
    }
    
    const lines = pdf.splitTextToSize(text, pageWidth - (margin * 2))
    pdf.text(lines, margin, yPos)
    yPos += lines.length * lineHeight
  }
  
  // Título
  let title = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS'
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
  }
  
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(title, pageWidth / 2, yPos, { align: 'center' })
  yPos += 15
  
  // Informações básicas
  addText(`${contractData.cidade} - ${contractData.uf}, ${contractData.dia} de ${contractData.mes} de ${contractData.ano}.`)
  yPos += 5
  
  addText('Pelo presente instrumento particular de contrato, as partes abaixo qualificadas, a saber:')
  yPos += 5
  
  // CONTRATANTE
  addText('CONTRATANTE:', 14, true)
  addText(`${contractData.modelo.fullName}, inscrito(a) no CPF: ${contractData.modelo.document}, residente e domiciliada no endereço ${contractData.modelo.street}, nº ${contractData.modelo.numberAddress || 'S/N'}, ${contractData.modelo.complement || ''}, localizado no bairro ${contractData.modelo.neighborhood}, situado na cidade ${contractData.modelo.city} - ${contractData.uf} CEP: ${contractData.modelo.postalcode}, tendo como telefone principal: ${contractData.modelo.phone}.`)
  yPos += 5
  
  // CONTRATADA
  addText('CONTRATADA:', 14, true)
  addText('SUPER FOTOS FOTOGRAFIAS LTDA, inscrita no CNPJ sob o nº 13.310.215/0001-50, com sede na Avenida Paulista, nº 1636 – salas 1105/1324 – Cerqueira Cesar – São Paulo – SP – CEP: 01310-200.')
  yPos += 10
  
  // Cláusulas principais (resumidas para o fallback)
  addText('CLÁUSULA 1ª - OBJETO DO CONTRATO', 12, true)
  addText('A CONTRATADA compromete-se a prestar serviços de produção de material fotográfico, incluindo produção fotográfica e edição de fotos.')
  yPos += 5
  
  if (contractData.valorContrato && contractData.valorContrato !== '0,00') {
    addText('PAGAMENTO:', 12, true)
    addText(`Valor: R$ ${contractData.valorContrato}`)
    addText(`Método de pagamento: ${contractData.metodoPagamento.join(', ')}`)
    yPos += 5
  }
  
  if (contractData.duracaoContrato) {
    addText(`Duração do contrato: ${contractData.duracaoContrato} meses`)
    yPos += 5
  }
  
  // Direito de imagem
  addText('DIREITO DE IMAGEM:', 12, true)
  addText('O CONTRATANTE cede à CONTRATADA o direito de uso das imagens obtidas nas sessões fotográficas para divulgação junto a empresas parceiras.')
  yPos += 10
  
  // Assinaturas
  yPos += 20
  addText('ASSINATURAS:', 12, true)
  yPos += 10
  
  addText('_' + '_'.repeat(40))
  addText(contractData.modelo.fullName)
  addText('Assinatura do Contratante')
  yPos += 15
  
  addText('_' + '_'.repeat(40))
  addText('SUPER FOTOS FOTOGRAFIAS LTDA')
  addText('Assinatura da Contratada')
  
  const pdfOutput = pdf.output('datauristring')
  return pdfOutput.split(',')[1]
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
