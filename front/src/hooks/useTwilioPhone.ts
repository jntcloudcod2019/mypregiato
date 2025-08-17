import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar chamadas telefônicas via Twilio
 * 
 * Este hook fornece funcionalidades para realizar chamadas telefônicas
 * usando a API do Twilio diretamente do navegador.
 */
export function useTwilioPhone() {
  // Forçar inicialização do hook mesmo se não estiver dentro de um componente React
  // para evitar problemas com o hook não sendo chamado no componente de atendimento
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'completed' | 'failed'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Log para debug - confirmar que o hook foi inicializado
  console.log('useTwilioPhone hook inicializado');

  // Limpar timer quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  /**
   * Inicia uma chamada telefônica para o número especificado
   * @param phoneNumber Número de telefone no formato E.164 (ex: +5511999999999)
   */
  const makeCall = useCallback(async (phoneNumber: string) => {
    try {
      setCallStatus('connecting');
      setIsCallInProgress(true);
      
      // Validar o formato do número de telefone
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = `+${phoneNumber}`;
      }
      
      // Remover caracteres não numéricos (exceto o sinal de +)
      phoneNumber = '+' + phoneNumber.substring(1).replace(/\D/g, '');
      
      // Configurar o Twilio Device (simulado para este exemplo)
      console.log(`Iniciando chamada para ${phoneNumber}`);
      
      // Iniciar o timer para contar a duração da chamada
      const startTime = Date.now();
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      setTimerInterval(interval);
      setCallStatus('connected');
      
      // Simular uma chamada para fins de demonstração
      // Em produção, aqui você faria a chamada real para a API do Twilio
      toast({
        title: "Chamada iniciada",
        description: `Conectando com ${phoneNumber}...`,
      });
      
      // Em uma implementação real, você faria uma chamada para seu backend:
      // const response = await axios.post('/api/twilio/call', { phoneNumber });
      
      // Retornar uma função para encerrar a chamada
      return () => {
        if (interval) {
          clearInterval(interval);
        }
        setCallStatus('completed');
        setIsCallInProgress(false);
        setCallDuration(0);
        
        toast({
          title: "Chamada encerrada",
          description: "A chamada foi finalizada.",
        });
      };
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
      setCallStatus('failed');
      setIsCallInProgress(false);
      
      toast({
        title: "Erro na chamada",
        description: "Não foi possível completar a chamada. Tente novamente.",
        variant: "destructive"
      });
      
      return () => {}; // Função vazia para manter a consistência da interface
    }
  }, []);

  return {
    makeCall,
    isCallInProgress,
    callStatus,
    callDuration
  };
}
