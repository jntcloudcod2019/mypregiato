# Correções do Loop de Chats

Este documento descreve as correções implementadas para resolver o problema de loop infinito e duplicação de mensagens no sistema de chat do My Pregiato.

## Problema Identificado

O sistema apresentava um comportamento de loop infinito onde:

1. Chats duplicados eram criados no banco de dados devido a inconsistências na normalização de números de telefone
2. Mensagens eram processadas múltiplas vezes no frontend, causando re-renders excessivos
3. O modo DEV_LOOPBACK no backend Node.js causava reprocessamento de mensagens próprias
4. Não havia mecanismos robustos de deduplicação no frontend

## Soluções Implementadas

### 1. Normalização Padronizada de Números de Telefone

Criamos um sistema consistente de normalização de números entre o frontend e o backend:

```typescript
// phoneUtils.ts
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const digits = stripNonDigits(phone);
  
  // Para grupos, apenas retornar os dígitos (sem adicionar prefixo)
  if (isGroupId(phone)) {
    return digits;
  }
  
  // Para números individuais, aplicar formato E.164 BR se necessário
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  
  return digits;
}
```

No backend Node.js (zap.js), implementamos a mesma lógica:

```javascript
function normalizeNumber(num, isGroup = false) {
  if (!num) return null;
  
  // Remove todos os caracteres não numéricos
  const digits = String(num).replace(/\D/g, '');
  
  // Para grupos, apenas retornar os dígitos (sem adicionar prefixo)
  if (isGroup || (digits.startsWith('120') && digits.length >= 18)) {
    return digits;
  }
  
  // Para números individuais, aplicar formato E.164 BR se necessário
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  
  return digits;
}
```

### 2. Deduplicação de Mensagens no Frontend

Criamos um hook especializado para deduplicação de mensagens:

```typescript
// useChatDeduplication.ts
export function useChatDeduplication() {
  // Conjunto para armazenar IDs de mensagens já processadas
  const processedIdsRef = useRef<Set<string>>(new Set());
  
  // Mapa para armazenar a última chave de mensagem por chat
  const lastMessageKeyByChatRef = useRef<Record<string, string>>({});
  
  const isMessageDuplicate = (id: string | undefined, chatId: string, fallbackKey: string): boolean => {
    // Verificar duplicação por ID exato
    if (id && processedIdsRef.current.has(id)) {
      return true;
    }
    
    // Verificar duplicação por conteúdo + chat
    const lastKey = lastMessageKeyByChatRef.current[chatId];
    if (lastKey === fallbackKey) {
      return true;
    }
    
    // Registrar para futuras verificações
    if (id) {
      processedIdsRef.current.add(id);
    }
    lastMessageKeyByChatRef.current[chatId] = fallbackKey;
    
    return false;
  };
  
  // ...
}
```

### 3. Desativação do DEV_LOOPBACK em Produção

Modificamos a lógica de ativação do DEV_LOOPBACK para garantir que ele esteja desativado em produção:

```javascript
// zap.js
// Desativado por padrão em produção para evitar loops infinitos
const DEV_LOOPBACK = process.env.DEV_LOOPBACK_INBOUND === 'true' && process.env.NODE_ENV !== 'production';
```

Também adicionamos uma flag `fromMe` nas mensagens para identificar loopbacks:

```javascript
const simulated = {
  // ...
  fromMe: true // Adicionar flag fromMe para identificar mensagens de loopback
};
```

### 4. Throttle e Debounce para Atualizações

Implementamos mecanismos de throttle e debounce para limitar a frequência de atualizações:

```typescript
// useThrottledRefresh.ts
export function useThrottledRefresh<T extends (...args: any[]) => Promise<any>>(
  refreshFn: T,
  defaultDelay: number = 5000
) {
  // ...
  
  const throttledRefresh = useCallback(
    async (delay: number = defaultDelay, ...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRefresh = now - throttleRef.current.lastTime;
      
      if (timeSinceLastRefresh < delay) {
        // Agendar para depois
        // ...
      }
      
      // Executar imediatamente
      throttleRef.current.lastTime = now;
      return refreshFn(...args);
    },
    [refreshFn, defaultDelay]
  );
  
  return throttledRefresh;
}
```

### 5. Atualizações em Lote

Implementamos um sistema de atualizações em lote para evitar re-renders excessivos:

```typescript
// useBatchUpdates.ts
export function useBatchUpdates<T>(
  commitFn: (updates: Map<string, T>) => void,
  delay: number = 120
) {
  // ...
  
  const queueUpdate = useCallback(
    (id: string, update: T) => {
      // Mescla com atualizações existentes
      const existing = pendingUpdatesRef.current.get(id);
      const merged = existing ? { ...existing, ...update } : update;
      
      pendingUpdatesRef.current.set(id, merged);
      scheduleCommit();
    },
    [scheduleCommit]
  );
  
  // ...
}
```

### 6. Processador de Mensagens Inbound

Criamos um hook especializado para processar mensagens inbound de forma segura:

```typescript
// useInboundMessageProcessor.ts
export function useInboundMessageProcessor({
  onMessageReceived,
  onChatUpdated,
  selectedChatId
}: InboundMessageProcessorOptions = {}) {
  // ...
  
  const processInboundMessage = useCallback(
    (event: any): boolean => {
      // Ignorar mensagens fromMe
      if (event?.message?.fromMe === true) {
        return false;
      }
      
      // Extrair dados da mensagem
      const id = event?.message?.id || event?.message?.externalMessageId;
      const chatId = event?.chatId;
      
      // Verificar duplicação
      if (isMessageDuplicate(id, chatId, fallbackKey)) {
        return false;
      }
      
      // Processar a mensagem
      // ...
      
      return true;
    },
    [onMessageReceived, queueUpdate, isMessageDuplicate]
  );
  
  return { processInboundMessage };
}
```

### 7. Logs Detalhados para Depuração

Adicionamos logs detalhados controlados por uma flag em localStorage:

```typescript
const isDebugEnabled = localStorage.getItem('debug.chat') === 'true';
if (isDebugEnabled) {
  console.debug('[chat] message.inbound recebido:', JSON.stringify({
    chatId: evt?.chatId,
    messageId: evt?.message?.id || evt?.message?.externalMessageId,
    fromMe: evt?.message?.fromMe,
    type: evt?.message?.type
  }));
}
```

## Como Usar

### Ativação do Modo Debug

Para ativar os logs detalhados, execute no console do navegador:

```javascript
localStorage.setItem('debug.chat', 'true');
```

Para desativar:

```javascript
localStorage.removeItem('debug.chat');
```

### Verificação de Normalização

Para verificar a normalização de números no frontend:

```javascript
import { normalizePhone } from '@/utils/phoneUtils';

// Exemplo
console.log(normalizePhone('11999887766')); // '5511999887766'
console.log(normalizePhone('120363...@g.us')); // '120363...'
```

## Próximos Passos

1. **Monitoramento**: Implementar monitoramento para detectar loops precocemente
2. **Testes Automatizados**: Criar testes para validar a normalização e deduplicação
3. **Limpeza do Banco**: Remover chats duplicados existentes
4. **Dead Letter Queue**: Implementar DLQ para mensagens problemáticas no RabbitMQ
