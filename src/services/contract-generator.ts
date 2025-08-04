
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
    
    // Criar elemento temporário com configurações otimizadas para renderização off-screen
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // Configurações melhoradas para renderização off-screen
    tempDiv.style.cssText = `
      position: absolute;
      top: -20000px;
      left: -20000px;
      width: 794px;
      min-height: 1123px;
      background-color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: black;
      padding: 20px;
      box-sizing: border-box;
      z-index: -1;
      visibility: visible;
      opacity: 1;
      display: block;
      overflow: visible;
    `
    
    document.body.appendChild(tempDiv)
    console.log('[CONTRACT] Elemento adicionado ao DOM')
    
    // Aguardar renderização com tempo adequado
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('[CONTRACT] Elemento renderizado:')
    console.log('- Altura:', tempDiv.offsetHeight)
    console.log('- Largura:', tempDiv.offsetWidth)
    console.log('- Conteúdo presente:', tempDiv.innerHTML.length > 0)
    
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
        height: Math.max(tempDiv.scrollHeight, 1123),
        windowWidth: 794,
        windowHeight: Math.max(tempDiv.scrollHeight, 1123),
        foreignObjectRendering: true,
        ignoreElements: (element: Element) => {
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
                el.style.color = 'black'
                if (el.style.display === 'none') {
                  el.style.display = 'block'
                }
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
      
      // Verificação melhorada de conteúdo do canvas
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Não foi possível obter contexto do canvas')
      }
      
      // Verificar múltiplas áreas do canvas para garantir que há conteúdo visível
      const hasContent = checkCanvasContent(canvas, ctx)
      
      console.log('[CONTRACT] Canvas tem conteúdo visível:', hasContent)
      
      if (!hasContent) {
        console.warn('[CONTRACT] Canvas parece estar vazio, tentando novamente...')
        
        // Tentar novamente com configurações diferentes
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const retryCanvas = await html2canvas(tempDiv, {
          ...canvasOptions,
          scale: 1,
          useCORS: false,
          foreignObjectRendering: false
        })
        
        console.log('[CONTRACT] Segundo canvas capturado:', retryCanvas.width, 'x', retryCanvas.height)
        
        const retryCtx = retryCanvas.getContext('2d')
        if (retryCtx && checkCanvasContent(retryCanvas, retryCtx)) {
          pdfBase64 = await createPDFFromCanvas(retryCanvas)
        } else {
          console.log('[CONTRACT] Usando fallback de PDF completo...')
          pdfBase64 = await createComprehensiveFallbackPDF(contractData, contractType)
        }
      } else {
        pdfBase64 = await createPDFFromCanvas(canvas)
      }
      
    } catch (canvasError) {
      console.error('[CONTRACT] Erro no html2canvas:', canvasError)
      console.log('[CONTRACT] Usando fallback de PDF completo...')
      
      pdfBase64 = await createComprehensiveFallbackPDF(contractData, contractType)
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

// Função auxiliar para verificar se o canvas tem conteúdo visível
const checkCanvasContent = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): boolean => {
  const width = canvas.width
  const height = canvas.height
  
  // Verificar múltiplas áreas do canvas
  const checkAreas = [
    { x: 0, y: 0, w: Math.min(width, 100), h: Math.min(height, 100) }, // Canto superior esquerdo
    { x: width / 2 - 50, y: height / 4, w: 100, h: 100 }, // Centro superior
    { x: width / 2 - 50, y: height / 2, w: 100, h: 100 }, // Centro
    { x: 0, y: height - 100, w: Math.min(width, 100), h: 100 } // Parte inferior
  ]
  
  for (const area of checkAreas) {
    const imageData = ctx.getImageData(area.x, area.y, area.w, area.h)
    const pixels = imageData.data
    
    // Procurar por pixels que não sejam completamente brancos ou transparentes
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const a = pixels[i + 3]
      
      // Se encontrar um pixel que não seja branco (255,255,255) e tenha alpha > 0
      if (a && a > 0 && (r < 250 || g < 250 || b < 250)) {
        console.log(`[CONTRACT] Conteúdo encontrado na área ${JSON.stringify(area)}: RGB(${r},${g},${b}) Alpha:${a}`)
        return true
      }
    }
  }
  
  return false
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

// Método auxiliar para fallback de PDF completo e robusto
const createComprehensiveFallbackPDF = async (contractData: ContractData, contractType: ContractType): Promise<string> => {
  console.log('[CONTRACT] Gerando PDF fallback completo...')
  
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const lineHeight = 6
  let yPos = 30
  
  // Função para adicionar texto com quebra de linha
  const addText = (text: string, fontSize = 12, isBold = false) => {
    if (yPos > (pageHeight - 40)) {
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
    yPos += lines.length * lineHeight + 2
  }
  
  const addSpace = (space = 5) => {
    yPos += space
  }
  
  // Título baseado no tipo de contrato
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
  
  // Data e local
  addText(`${contractData.cidade} - ${contractData.uf}, ${contractData.dia} de ${contractData.mes} de ${contractData.ano}.`)
  addSpace()
  
  addText('Pelo presente instrumento particular de contrato, as partes abaixo qualificadas, a saber:')
  addSpace()
  
  // CONTRATANTE
  addText('CONTRATANTE:', 14, true)
  addText(`${contractData.modelo.fullName}, inscrito(a) no CPF: ${contractData.modelo.document}, residente e domiciliada no endereço ${contractData.modelo.street}, nº ${contractData.modelo.numberAddress || 'S/N'}, ${contractData.modelo.complement || ''}, localizado no bairro ${contractData.modelo.neighborhood}, situado na cidade ${contractData.modelo.city} - ${contractData.uf} CEP: ${contractData.modelo.postalcode}, tendo como telefone principal: ${contractData.modelo.phone}.`)
  addSpace()
  
  // CONTRATADA
  addText('CONTRATADA:', 14, true)
  addText('SUPER FOTOS FOTOGRAFIAS LTDA, inscrita no CNPJ sob o nº 13.310.215/0001-50, com sede na Avenida Paulista, nº 1636 – salas 1105/1324 – Cerqueira Cesar – São Paulo – SP – CEP: 01310-200.')
  addSpace(10)
  
  // Cláusulas específicas por tipo de contrato
  if (contractType === 'super-fotos' || contractType === 'super-fotos-menor') {
    // Cláusulas do contrato Super Fotos
    addText('CLÁUSULA 1ª - OBJETO DO CONTRATO', 12, true)
    addText('A CONTRATADA compromete-se a prestar serviços de produção de material fotográfico, incluindo:')
    addText('a) Produção fotográfica: realização de ensaios fotográficos conforme especificado pelas partes.')
    addText('b) Edição de fotos: tratamento e aprimoramento das imagens capturadas.')
    addSpace()
    
    addText('CLÁUSULA 2ª - DAS OBRIGAÇÕES DAS PARTES', 12, true)
    addText('As obrigações das partes no presente contrato estão definidas conforme os seguintes termos e em conformidade com o Código Civil Brasileiro e o Código de Defesa do Consumidor (Lei nº 8.078/1990):')
    addText('1. Obrigações da CONTRATADA:', 10, true)
    addText('a) Disponibilizar estúdio equipado, equipe especializada e realizar a entrega do material nos prazos acordados.')
    addText('b) Manter a transparência em todos os processos, fornecendo informações claras sobre os serviços executados.')
    addText('2. Obrigações do(a) CONTRATANTE:', 10, true)
    addText('a) Fornecer todas as informações necessárias para a execução do contrato, como dados pessoais e documentos.')
    addText('b) Comparecer pontualmente às sessões fotográficas agendadas.')
    addText('c) Efetuar os pagamentos nos prazos e condições estabelecidos neste contrato.')
    addSpace()
    
    addText('CLÁUSULA 3ª - PRODUÇÃO FOTOGRÁFICA', 12, true)
    addText('a) Equipamentos profissionais: câmeras de alta resolução e iluminação adequada.')
    addText('b) Equipe especializada: maquiadores e fotógrafos qualificados.')
    addText('c) O material fotográfico será entregue ao(à) CONTRATANTE no prazo de até 05 (cinco) dias úteis após a sessão fotográfica.')
    addSpace()
    
    // Informações de pagamento
    if (contractData.valorContrato && contractData.valorContrato !== '0,00') {
      addText('CLÁUSULA 4ª - PAGAMENTO', 12, true)
      addText(`Pela prestação dos serviços, o CONTRATANTE pagará à CONTRATADA o valor total de R$ ${contractData.valorContrato}, sendo:`)
      addText(`a) Método de pagamento: ${contractData.metodoPagamento.join(', ')}.`)
      addText('b) Em caso de pagamento via cartão de crédito, débito e PIX, o CONTRATANTE compromete-se a não solicitar chargebacks após a entrega do material.')
      addText('c) Fica a critério da CONTRATADA a concessão de descontos e facilitação das formas de pagamento.')
      addSpace()
    }
    
    addText('CLÁUSULA 5ª - DIREITO DE IMAGEM', 12, true)
    addText('O CONTRATANTE cede à CONTRATADA, o direito de uso das imagens obtidas nas sessões fotográficas realizadas, para os seguintes fins:')
    addText('a) Divulgação junto a empresas parceiras da CONTRATADA.')
    addText('b) O presente instrumento concede a autorização de uso de imagem em todo território nacional e internacional.')
    addSpace()
    
    addText('CLÁUSULA 6ª - ACEITAÇÃO E IRREVOGABILIDADE', 12, true)
    addText('a) As partes declaram que celebram o presente contrato em comum acordo, com plena ciência de seus direitos e deveres.')
    addText('b) O material fotográfico será entregue de forma digital em dispositivo de armazenamento portátil (pen drive).')
    addText('c) Não será permitido cancelamento, devolução ou reembolso dos valores pagos, salvo em caso de vícios ou defeitos comprovados.')
    addSpace()
  }
  
  // Duração do contrato
  if (contractData.duracaoContrato) {
    addText(`DURAÇÃO: ${contractData.duracaoContrato} meses`, 12, true)
    addSpace()
  }
  
  addText('FORO:', 12, true)
  addText('Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias oriundas do presente contrato.')
  addSpace(15)
  
  // Assinaturas
  addText('ASSINATURAS:', 12, true)
  addSpace(10)
  
  // Linha de assinatura do contratante
  pdf.line(margin, yPos, margin + 60, yPos)
  yPos += 5
  addText(contractData.modelo.fullName, 10)
  addText('Assinatura do Contratante', 10)
  addSpace(15)
  
  // Linha de assinatura da contratada
  pdf.line(margin, yPos, margin + 60, yPos)
  yPos += 5
  addText('SUPER FOTOS FOTOGRAFIAS LTDA', 10)
  addText('Assinatura da Contratada', 10)
  
  const pdfOutput = pdf.output('datauristring')
  return pdfOutput.split(',')[1]
}

export const normalizePhoneToE164 = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
    return `+${cleanPhone}`
  }
  
  if (cleanPhone.length === 11) {
    return `+55${cleanPhone}`
  }
  
  if (cleanPhone.length === 10) {
    const ddd = cleanPhone.substring(0, 2)
    const number = cleanPhone.substring(2)
    return `+55${ddd}9${number}`
  }
  
  return phone
}
