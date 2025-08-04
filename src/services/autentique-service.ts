
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
    
    // Verificar se o PDF está em base64
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      throw new Error('PDF base64 inválido ou vazio')
    }
    
    // Verificar tamanho do PDF em base64
    const sizeInMB = (pdfBase64.length * 3) / (4 * 1024 * 1024)
    console.log(`[AUTENTIQUE] Tamanho do PDF em base64: ${sizeInMB.toFixed(2)}MB`)
    
    if (sizeInMB > 24) { // Limite um pouco abaixo dos 25MB para margem de segurança
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
    
    // Preparar a mutation GraphQL seguindo exatamente a documentação
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
          name: contractName,
          reminder_frequency: "DAILY"
        },
        signers: [
          {
            phone: validatedPhone,
            action: "SIGN",
            delivery_method: "DELIVERY_METHOD_WHATSAPP"
          }
        ],
        file: null
      }
    }
    
    const map = { 
      "0": ["variables.file"] 
    }
    
    // Criar FormData seguindo o padrão da documentação
    const formData = new FormData()
    formData.append('operations', JSON.stringify(operations))
    formData.append('map', JSON.stringify(map))
    formData.append('0', pdfBlob, `${contractName}.pdf`)
    
    console.log(`[AUTENTIQUE] Enviando contrato via WhatsApp para ${modelName} - ${validatedPhone}`)
    
    // Fazer a requisição com headers corretos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutos
    
    try {
      const response = await fetch(AUTENTIQUE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTENTIQUE_TOKEN}`,
          // Não incluir Content-Type para FormData - deixar o browser definir
        },
        body: formData,
        signal: controller.signal,
        mode: 'cors', // Especificar CORS explicitamente
        credentials: 'omit' // Não enviar cookies
      })
      
      clearTimeout(timeoutId)
      
      console.log(`[AUTENTIQUE] Response status: ${response.status}`)
      
      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = 'Erro ao ler resposta'
        }
        
        console.error(`[AUTENTIQUE] Erro na requisição: ${response.status}`)
        console.error(`[AUTENTIQUE] Response: ${errorText}`)
        
        // Tratar erros específicos baseados no status
        if (response.status === 413) {
          throw new Error('Arquivo muito grande para upload. Tente reduzir o tamanho do PDF.')
        } else if (response.status === 422) {
          throw new Error('Dados inválidos no contrato. Verifique as informações.')
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Token de autenticação inválido ou sem permissão')
        } else if (response.status === 429) {
          throw new Error('Muitas requisições. Aguarde alguns minutos e tente novamente.')
        } else if (response.status >= 500) {
          throw new Error('Erro no servidor do Autentique. Tente novamente em alguns minutos.')
        } else {
          throw new Error(`Erro na API do Autentique (${response.status}): ${errorText || 'Erro desconhecido'}`)
        }
      }
      
      let result: AutentiqueResponse
      try {
        const responseText = await response.text()
        console.log('[AUTENTIQUE] Response text:', responseText)
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('[AUTENTIQUE] Erro ao fazer parse da resposta:', parseError)
        throw new Error('Resposta inválida da API do Autentique')
      }
      
      // Verificar se há erros GraphQL
      if (result.errors && result.errors.length > 0) {
        console.error('[AUTENTIQUE] Erros GraphQL:', result.errors)
        const errorMessage = result.errors[0]?.message || 'Erro desconhecido na API'
        
        // Tratar erros específicos do GraphQL
        if (errorMessage.includes('phone')) {
          throw new Error('Número de telefone inválido. Verifique o formato.')
        } else if (errorMessage.includes('file') || errorMessage.includes('upload')) {
          throw new Error('Erro no upload do arquivo. Tente novamente.')
        } else if (errorMessage.includes('token') || errorMessage.includes('authentication')) {
          throw new Error('Token de autenticação inválido')
        } else {
          throw new Error(`Erro na API: ${errorMessage}`)
        }
      }
      
      if (!result.data?.createDocument) {
        console.error('[AUTENTIQUE] Resposta inválida da API:', result)
        throw new Error('Não foi possível criar o documento no Autentique')
      }
      
      const document = result.data.createDocument
      const whatsappLink = document.signatures[0]?.link?.short_link
      
      console.log(`[AUTENTIQUE] Documento criado com ID: ${document.id}`)
      console.log(`[AUTENTIQUE] Link do WhatsApp: ${whatsappLink}`)
      console.log(`[AUTENTIQUE] Contrato de ${contractName} enviado com sucesso para ${modelName}`)
      
      return {
        success: true,
        message: `Contrato enviado com sucesso para ${modelName} via WhatsApp`,
        documentId: document.id,
        whatsappLink: whatsappLink
      }
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      console.error('[AUTENTIQUE] Erro na requisição fetch:', fetchError)
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout na requisição. Tente novamente.')
      } else if (fetchError.message === 'Failed to fetch') {
        throw new Error('Erro de conectividade. Verifique sua conexão e tente novamente.')
      } else if (fetchError.message?.includes('CORS')) {
        throw new Error('Erro de CORS. Problema de configuração do servidor.')
      }
      
      throw fetchError
    }
    
  } catch (error) {
    console.error('[AUTENTIQUE] Erro ao enviar contrato:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar contrato'
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
    
    console.log(`[AUTENTIQUE] Documento ${documentId} excluído com sucesso`)
    return true
    
  } catch (error) {
    console.error(`[AUTENTIQUE] Erro ao excluir documento ${documentId}:`, error)
    return false
  }
}
