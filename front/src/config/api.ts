/**
 * Configuração centralizada da API
 * Este arquivo centraliza todas as configurações de URL da API
 */

// URL base da API - prioriza variável de ambiente, fallback para localhost em desenvolvimento
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:5656' : 'https://pregiato-api-production.up.railway.app');

// URL completa da API com /api
export const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/api`;

// URL do SignalR Hub
export const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL || 
  `${API_BASE_URL.replace(/\/$/, '')}/hubs/whatsapp`;

// URL do Clerk
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Configurações de timeout
export const API_TIMEOUT = 30000; // 30 segundos

// Headers padrão
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Log das configurações (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 Configurações da API:', {
    API_BASE_URL,
    API_URL,
    SIGNALR_URL,
    CLERK_PUBLISHABLE_KEY: CLERK_PUBLISHABLE_KEY ? '✅ Configurado' : '❌ Não configurado'
  });
}
