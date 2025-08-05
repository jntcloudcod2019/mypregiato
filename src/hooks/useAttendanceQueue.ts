
import { useState, useEffect } from 'react';
import { whatsAppApi } from '../services/whatsapp-api';

export interface QueueMetrics {
  totalQueued: number;
  totalAssigned: number;
  averageWaitTime: string;
  queueItems: QueueItem[];
}

export interface QueueItem {
  conversationId: string;
  contactName: string;
  contactPhone: string;
  priority: string;
  queuedAt: string;
  waitTime: string;
}

export const useAttendanceQueue = () => {
  const [metrics, setMetrics] = useState<QueueMetrics>({
    totalQueued: 0,
    totalAssigned: 0,
    averageWaitTime: '00:00:00',
    queueItems: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await whatsAppApi.getQueueMetrics();
      setMetrics(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar métricas da fila:', err);
      setError('Erro ao carregar fila de atendimento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchQueue, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    loading,
    error,
    refresh: fetchQueue
  };
};
