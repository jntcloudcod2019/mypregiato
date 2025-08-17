import { ContractData, AutentiqueResponse } from '@/types/contract'
import { ContractsService } from '@/services/contracts-service'

export class AutentiqueService {
  private static readonly API_URL = 'https://api.autentique.com.br/v2/graphql'
  private static readonly TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiZmVkYzRjZWE1ZWZkOWM4MGNmNmVlMmM1NTNkZWIzODAzODE5YzYwM2ExZDM4NzViOGY0NjZmZTc0YWIzZTFlZTdkYTJiZjE0OGM0YzU5NDgiLCJpYXQiOjE3MzU5ODczMTQuNjcxODY2LCJuYmYiOjE3MzU5ODczMTQuNjcxODY5LCJleHAiOjE3Njc1MjMzMTQuNjYzMzEzLCJzdWIiOiI0Nzc0MTQiLCJzY29wZXMiOlsidXNlci13cml0ZSIsInVzZXItcmVhZCIsImRvY3VtZW50LXdyaXRlIiwiZG9jdW1lbnQtcmVhZCIsImZvbGRlci13cml0ZSIsImZvbGRlci1yZWFkIl19.bxBLCY1IgkSu3Ar1MvDDbZRXDd1bWA6VDVbSkFIyWYVcZ7tBnrnWXrJKrK6rAoO0iTqb-3hT-D67Vd7Bfub5gg7taqfCyI9pDqFYcvHSLODhfUfZKOjmWgZHfGPhvzYYNJa9Q5kPfxqYnLTlJ0bfzIdFGMdyZv-TtNXRQBgYkYVDpWrKUf-V4Hg_HgRsYWgZb3CgaXW7EYdl8YCFzJ1LyOgZf_vUh9wHvJ6DzCOhI-M2U3N-kVQwRYvyLdP7MhOlGHsKQO0qXvGlBqKGgNgJvCgQ9MqRHgYaVVzJhQDrJ9N2fGtCO_lHgOmYCUDwdU2Z8RzpZZqZGOD3qXeQyP3sVQNL4UQYlKxZfvgZD1N9DQ-3fzT7RhJkFv7N3Y'

  static async sendContract(
    pdfBase64: string,
    contractData: ContractData,
    contractType: string
  ): Promise<{
    success: boolean
    message: string
    documentId?: string
    whatsappLink?: string
    contractRecord?: any
  }> {
    try {
      console.log('[AUTENTIQUE] Iniciando envio do contrato...')
      console.log('[AUTENTIQUE] Dados do modelo:', contractData.modelo)
      
      if (!pdfBase64 || !contractData.modelo?.phone) {
        throw new Error('PDF ou telefone do modelo não fornecido')
      }

      const blob = this.base64ToBlob(pdfBase64)
      console.log('[AUTENTIQUE] PDF convertido para blob, tamanho:', blob.size)

      const formData = this.createFormData(blob, contractData, contractType)
      const response = await this.sendRequest(formData)

      console.log('[AUTENTIQUE] Resposta da API:', response)

      if (response.errors?.length > 0) {
        console.error('[AUTENTIQUE] Erro na API:', response.errors)
        return {
          success: false,
          message: `Erro da API: ${response.errors[0].message}`
        }
      }

      if (!response.data?.createDocument) {
        return {
          success: false,
          message: 'Resposta inválida da API do Autentique'
        }
      }

      const document = response.data.createDocument
      const modeloSignature = document.signatures?.find(s => 
        s.email === contractData.modelo.email
      )

      const whatsappLink = modeloSignature?.link?.short_link
      const documentId = document.id

      console.log('[AUTENTIQUE] Contrato enviado com sucesso!')
      console.log('[AUTENTIQUE] Document ID:', documentId)
      console.log('[AUTENTIQUE] WhatsApp Link:', whatsappLink)

      // Integrar com o sistema de contratos
      try {
        const { ContractsService } = await import('@/services/contracts-service')
        const contractRecord = await ContractsService.save({
          tipo: contractType,
          cliente: contractData.modelo.fullName,
          produtor: 'Produtor Atual',
          data: `${contractData.dia}/${contractData.mes}/${contractData.ano}`,
          status: whatsappLink ? 'Enviado' : 'Pendente',
          valor: contractData.valorContrato || 'Não informado',
          documentId,
          whatsappLink
        })
        console.log('[AUTENTIQUE] Contrato salvo no sistema (API):', contractRecord)

        return {
          success: true,
          message: 'Contrato enviado com sucesso!',
          documentId,
          whatsappLink,
          contractRecord
        }
      } catch (integrationError) {
        console.error('[AUTENTIQUE] Erro na integração com contratos:', integrationError)
        // Mesmo com erro na integração, o envio foi bem-sucedido
        return {
          success: true,
          message: 'Contrato enviado com sucesso! (Erro ao salvar no sistema local)',
          documentId,
          whatsappLink
        }
      }

    } catch (error) {
      console.error('[AUTENTIQUE] Erro completo:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  private static base64ToBlob(base64: string): Blob {
    try {
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      return new Blob([byteArray], { type: 'application/pdf' })
    } catch (error) {
      console.error('[AUTENTIQUE] Erro ao converter base64 para blob:', error)
      throw new Error('Erro ao processar PDF')
    }
  }

  private static createFormData(blob: Blob, contractData: ContractData, contractType: string): FormData {
    const operations = {
      query: `
        mutation CreateDocumentMutation(
          $document: CreateDocumentInput!
          $signers: [CreateSignerInput!]!
          $file: Upload!
        ) {
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
          name: `Contrato ${ContractsService.getContractTypeDisplayName(contractType)} - ${contractData.modelo.fullName}`
        },
        signers: [
          {
            email: contractData.modelo.phone,
            action: "SIGN",
            delivery_method : "DELIVERY_METHOD_WHATSAPP"
          }
        ],
        file: null
      }
    }

    const formData = new FormData()
    formData.append('operations', JSON.stringify(operations))
    formData.append('map', JSON.stringify({ "0": ["variables.file"] }))
    formData.append('0', blob, 'contract.pdf')

    return formData
  }

  private static async sendRequest(formData: FormData): Promise<AutentiqueResponse> {
    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.TOKEN}`,
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }
}

// Manter compatibilidade com a função antiga
export async function sendContractToAutentique(
  pdfBase64: string,
  contractName: string,
  phoneNumber: string,
  modelName: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Criar dados básicos do modelo para compatibilidade
    const contractData: ContractData = {
      cidade: '',
      uf: '',
      dia: new Date().getDate().toString(),
      mes: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
      ano: new Date().getFullYear().toString(),
      modelo: {
        id: 'temp',
        fullName: modelName,
        document: '',
        email: 'temp@temp.com',
        phone: phoneNumber,
        postalcode: '',
        street: '',
        neighborhood: '',
        city: '',
        numberAddress: '',
        complement: ''
      },
      valorContrato: '0,00',
      metodoPagamento: [],
      paymentData: {}
    }

    const result = await AutentiqueService.sendContract(pdfBase64, contractData, 'agenciamento')
    return {
      success: result.success,
      message: result.message
    }
  } catch (error) {
    console.error('[SENDCONTRACTTOAUTENTIQUE] Erro:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}
