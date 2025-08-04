
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
    
    // Preparar a mutation GraphQL
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
        document: { name: contractName },
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
    
    const map = { file: ["variables.file"] }
    
    // Criar FormData
    const formData = new FormData()
    formData.append('operations', JSON.stringify(operations))
    formData.append('map', JSON.stringify(map))
    
    // Converter base64 para blob de forma otimizada
    try {
      console.log('[AUTENTIQUE] Convertendo base64 para blob...')
      
      // Decodificar base64 de forma mais eficiente
      const binaryString = atob(pdfBase64)
      const bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const pdfBlob = new Blob([bytes], { type: 'application/pdf' })
      
      console.log(`[AUTENTIQUE] Blob criado com sucesso, tamanho: ${(pdfBlob.size / (1024 * 1024)).toFixed(2)}MB`)
      formData.append('file', pdfBlob, `${contractName}.pdf`)
      
    } catch (blobError) {
      console.error('[AUTENTIQUE] Erro ao converter base64 para blob:', blobError)
      throw new Error('Erro ao processar o arquivo PDF em base64')
    }
    
    console.log(`[AUTENTIQUE] Enviando contrato via WhatsApp para ${modelName} - ${validatedPhone}`)
    
    // Fazer a requisição com timeout otimizado
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000) // 90 segundos para arquivos maiores
    
    try {
      const response = await fetch(AUTENTIQUE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTENTIQUE_TOKEN}`,
        },
        body: formData,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[AUTENTIQUE] Erro na requisição: ${response.status}`)
        console.error(`[AUTENTIQUE] Response: ${errorText}`)
        
        // Tratar erros específicos
        if (response.status === 413) {
          throw new Error('Arquivo muito grande para upload. Tente reduzir o tamanho do PDF.')
        } else if (response.status === 422) {
          throw new Error('Dados inválidos no contrato. Verifique as informações.')
        } else if (response.status === 401) {
          throw new Error('Token de autenticação inválido')
        } else if (response.status >= 500) {
          throw new Error('Erro no servidor do Autentique. Tente novamente em alguns minutos.')
        } else {
          throw new Error(`Erro na API do Autentique: ${response.status} - ${errorText}`)
        }
      }
      
      const result: AutentiqueResponse = await response.json()
      
      if (result.errors) {
        console.error('[AUTENTIQUE] Erros GraphQL:', result.errors)
        const errorMessage = result.errors[0]?.message || 'Erro desconhecido na API'
        throw new Error(`Erro GraphQL: ${errorMessage}`)
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
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout na requisição. O arquivo pode estar muito grande. Tente novamente.')
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
