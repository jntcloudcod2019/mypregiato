
import { useCallback } from 'react'
import { ContractsService } from '@/services/contracts-service'
import { ContractData } from '@/types/contract'

export const useContractIntegration = () => {
  const saveContract = useCallback((
    contractType: string,
    contractData: ContractData,
    valor: string,
    documentId?: string,
    whatsappLink?: string
  ) => {
    try {
      const contractRecord = ContractsService.save({
        tipo: contractType,
        cliente: contractData.modelo.fullName,
        produtor: 'Produtor Atual', // Isso deve vir do contexto do usuário logado
        data: `${contractData.dia}/${contractData.mes}/${contractData.ano}`,
        status: whatsappLink ? 'Enviado' : 'Pendente',
        valor: valor,
        documentId,
        whatsappLink
      })

      console.log('[CONTRACT_INTEGRATION] Contrato salvo automaticamente:', contractRecord)
      return contractRecord
    } catch (error) {
      console.error('[CONTRACT_INTEGRATION] Erro ao salvar contrato:', error)
      throw error
    }
  }, [])

  const updateContractStatus = useCallback((
    contractId: string, 
    status: 'Ativo' | 'Pendente' | 'Concluído' | 'Enviado',
    whatsappLink?: string
  ) => {
    try {
      const updated = ContractsService.update(contractId, { 
        status,
        ...(whatsappLink && { whatsappLink })
      })
      
      console.log('[CONTRACT_INTEGRATION] Status do contrato atualizado:', updated)
      return updated
    } catch (error) {
      console.error('[CONTRACT_INTEGRATION] Erro ao atualizar status:', error)
      throw error
    }
  }, [])

  return {
    saveContract,
    updateContractStatus
  }
}
