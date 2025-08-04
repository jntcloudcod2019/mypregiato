
import { ContractResult, AutentiqueResponse } from '@/types/contract'
import { normalizePhoneToE164 } from './contract-generator'

const AUTENTIQUE_API_URL = 'https://api.autentique.com.br/v2/graphql'
const AUTENTIQUE_TOKEN = '4ea6a0455f8e2e02b2f299be01d1a0949b24ceaf8d8bf7e7c5b56cff133c1f71'

export const sendContractToAutentique = async (
  pdfBase64: string,
  contractName: string,
  modelPhone: string,
  modelName: string
): Promise<ContractResult> => {
  try {
    console.log('[AUTENTIQUE] Iniciando envio do contrato...')
    console.log('[AUTENTIQUE] Contract name:', contractName)
    console.log('[AUTENTIQUE] Model name:', modelName)
    console.log('[AUTENTIQUE] Model phone:', modelPhone)
    
    // Verificar se o PDF está em base64
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      throw new Error('PDF base64 inválido ou vazio')
    }
    
    // Verificar tamanho do PDF em base64
    const sizeInMB = (pdfBase64.length * 3) / (4 * 1024 * 1024)
    console.log(`[AUTENTIQUE] Tamanho do PDF em base64: ${sizeInMB.toFixed(2)}MB`)
    
    if (sizeInMB > 24) {
      throw new Error(`PDF muito grande (${sizeInMB.toFixed(2)}MB). Limite máximo: 25MB`)
    }
    
    // Normalizar telefone para formato E164
    const validatedPhone = normalizePhoneToE164(modelPhone)
    console.log(`[AUTENTIQUE] Telefone normalizado: ${validatedPhone}`)
    
    // Converter base64 para blob
    console.log('[AUTENTIQUE] Convertendo base64 para blob...')
    const binaryString = atob(pdfBase64)
    const bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    const pdfBlob = new Blob([bytes], { type: 'application/pdf' })
    console.log(`[AUTENTIQUE] Blob criado com sucesso, tamanho: ${(pdfBlob.size / (1024 * 1024)).toFixed(2)}MB`)
    
    // Preparar a mutation GraphQL seguindo EXATAMENTE a documentação do Autentique
    const operations = {
      query: `
        mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
          createDocument(document: $document, signers: $signers, file: $file) {
            id
            name
            signatures {
              public_id
              name
              email
              action { name }
              link { short_link }
            }
          }
        }
      `,
      variables: {
        document: { 
          name: contractName
        },
        signers: [
          {
            phone: validatedPhone,
            action: "SIGN"
          }
        ],
        file: null
      }
    }
    
    const map = { 
      "0": ["variables.file"] 
    }
    
    // Criar FormData seguindo o padrão EXATO da documentação do Autentique
    const formData = new FormData()
    formData.append('operations', JSON.stringify(operations))
    formData.append('map', JSON.stringify(map))
    formData.append('0', pdfBlob, `${contractName}.pdf`)
    
    console.log(`[AUTENTIQUE] Enviando contrato para ${modelName} - ${validatedPhone}`)
    console.log('[AUTENTIQUE] FormData preparado, iniciando requisição...')
    
    // Configurar timeout e controller para cancelamento
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('[AUTENTIQUE] Timeout da requisição')
      controller.abort()
    }, 180000) // 3 minutos
    
    try {
      const response = await fetch(AUTENTIQUE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTENTIQUE_TOKEN}`,
          // NÃO incluir Content-Type para FormData - deixar o browser definir automaticamente
        },
        body: formData,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log(`[AUTENTIQUE] Response status: ${response.status}`)
      console.log(`[AUTENTIQUE] Response headers:`, Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
          console.error(`[AUTENTIQUE] Response error text:`, errorText)
        } catch (e) {
          console.error(`[AUTENTIQUE] Erro ao ler resposta de erro:`, e)
          errorText = 'Erro ao ler resposta do servidor'
        }
        
        // Tratamento específico baseado no status HTTP
        if (response.status === 413) {
          throw new Error('Arquivo muito grande para upload. Tente reduzir o tamanho do PDF.')
        } else if (response.status === 422) {
          throw new Error('Dados inválidos no contrato. Verifique as informações fornecidas.')
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Token de autenticação inválido ou expirado')
        } else if (response.status === 429) {
          throw new Error('Muitas requisições. Aguarde alguns minutos e tente novamente.')
        } else if (response.status >= 500) {
          throw new Error('Erro interno do servidor do Autentique. Tente novamente em alguns minutos.')
        } else {
          throw new Error(`Erro HTTP ${response.status}: ${errorText || 'Erro desconhecido na API do Autentique'}`)
        }
      }
      
      let result: AutentiqueResponse
      try {
        const responseText = await response.text()
        console.log('[AUTENTIQUE] Response text:', responseText)
        
        if (!responseText) {
          throw new Error('Resposta vazia da API do Autentique')
        }
        
        result = JSON.parse(responseText)
        console.log('[AUTENTIQUE] Parsed response:', result)
      } catch (parseError) {
        console.error('[AUTENTIQUE] Erro ao fazer parse da resposta:', parseError)
        throw new Error('Resposta inválida da API do Autentique')
      }
      
      // Verificar se há erros GraphQL na resposta
      if (result.errors && result.errors.length > 0) {
        console.error('[AUTENTIQUE] Erros GraphQL:', result.errors)
        const errorMessage = result.errors[0]?.message || 'Erro desconhecido na API GraphQL'
        
        // Tratamento específico de erros GraphQL
        if (errorMessage.toLowerCase().includes('phone')) {
          throw new Error('Número de telefone inválido. Verifique o formato do telefone.')
        } else if (errorMessage.toLowerCase().includes('file') || errorMessage.toLowerCase().includes('upload')) {
          throw new Error('Erro no upload do arquivo PDF. Tente novamente.')
        } else if (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('authentication')) {
          throw new Error('Token de autenticação inválido ou expirado')
        } else {
          throw new Error(`Erro na API GraphQL: ${errorMessage}`)
        }
      }
      
      if (!result.data?.createDocument) {
        console.error('[AUTENTIQUE] Estrutura de resposta inválida:', result)
        throw new Error('Estrutura de resposta inválida da API do Autentique')
      }
      
      const document = result.data.createDocument
      const signature = document.signatures?.[0]
      const whatsappLink = signature?.link?.short_link
      
      console.log(`[AUTENTIQUE] ✅ Documento criado com sucesso!`)
      console.log(`[AUTENTIQUE] Document ID: ${document.id}`)
      console.log(`[AUTENTIQUE] Document Name: ${document.name}`)
      console.log(`[AUTENTIQUE] WhatsApp Link: ${whatsappLink}`)
      console.log(`[AUTENTIQUE] Signer: ${signature?.name || 'Não identificado'}`)
      
      return {
        success: true,
        message: `Contrato "${contractName}" enviado com sucesso para ${modelName} via WhatsApp`,
        documentId: document.id,
        whatsappLink: whatsappLink
      }
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      console.error('[AUTENTIQUE] Erro na requisição fetch:', fetchError)
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout na requisição para a API do Autentique. Tente novamente.')
      } else if (fetchError.message === 'Failed to fetch') {
        throw new Error('Erro de conectividade. Verifique sua conexão com a internet e tente novamente.')
      } else if (fetchError.message?.includes('NetworkError') || fetchError.message?.includes('network')) {
        throw new Error('Erro de rede. Verifique sua conexão e tente novamente.')
      }
      
      // Re-throw o erro se já foi tratado acima
      throw fetchError
    }
    
  } catch (error) {
    console.error('[AUTENTIQUE] ❌ Erro final ao enviar contrato:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar contrato'
    
    return {
      success: false,
      message: errorMessage
    }
  }
}

export const deleteDocumentFromAutentique = async (documentId: string): Promise<boolean> => {
  try {
    console.log(`[AUTENTIQUE] Iniciando exclusão do documento ${documentId}`)
    
    const query = {
      query: `
        mutation {
          deleteDocument(id: "${documentId}")
        }
      `
    }
    
    const response = await fetch(AUTENTIQUE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTENTIQUE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[AUTENTIQUE] Erro ao deletar documento: ${response.status}`)
      console.error(`[AUTENTIQUE] Response: ${errorText}`)
      return false
    }
    
    console.log(`[AUTENTIQUE] ✅ Documento ${documentId} excluído com sucesso`)
    return true
    
  } catch (error) {
    console.error(`[AUTENTIQUE] ❌ Erro ao excluir documento ${documentId}:`, error)
    return false
  }
}
