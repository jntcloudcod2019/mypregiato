
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
    
    // Converter base64 para blob
    const byteCharacters = atob(pdfBase64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const pdfBlob = new Blob([byteArray], { type: 'application/pdf' })
    
    formData.append('file', pdfBlob, `${contractName}.pdf`)
    
    console.log(`[AUTENTIQUE] Enviando contrato via WhatsApp para ${modelName} - ${validatedPhone}`)
    
    // Fazer a requisição
    const response = await fetch(AUTENTIQUE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTENTIQUE_TOKEN}`,
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[AUTENTIQUE] Erro na requisição: ${response.status}`)
      console.error(`[AUTENTIQUE] Response: ${errorText}`)
      throw new Error(`Erro na API do Autentique: ${response.status}`)
    }
    
    const result: AutentiqueResponse = await response.json()
    
    if (!result.data?.createDocument) {
      console.error('[AUTENTIQUE] Resposta inválida da API:', result)
      throw new Error('Não foi possível criar o documento no Autentique')
    }
    
    const document = result.data.createDocument
    const whatsappLink = document.signatures[0]?.link?.short_link
    
    console.log(`[AUTENTIQUE] Documento criado com ID: ${document.id}`)
    console.log(`[AUTENTIQUE] Link do WhatsApp: ${whatsappLink}`)
    console.log(`[AUTENTIQUE] Contrato de ${contractName} gerado para ${modelName} com sucesso`)
    
    return {
      success: true,
      message: `Contrato enviado com sucesso para ${modelName} via WhatsApp`,
      documentId: document.id,
      whatsappLink: whatsappLink
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
