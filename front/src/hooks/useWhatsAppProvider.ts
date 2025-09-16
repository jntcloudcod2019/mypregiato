import { useContext } from 'react';
import { WhatsAppContext } from '@/contexts/whatsapp-context';

export const useWhatsAppProvider = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsAppProvider must be used within WhatsAppProvider');
  }
  return context;
};
