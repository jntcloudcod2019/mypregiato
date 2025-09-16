import { createContext } from 'react';

export interface WhatsAppContextProps {
  isConnected: boolean;
  connectionError: string | null;
  isServiceReady: boolean;
}

export const WhatsAppContext = createContext<WhatsAppContextProps | undefined>(undefined);
