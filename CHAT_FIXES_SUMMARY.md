# Resumo das Correções no Sistema de Chat

Este documento descreve as correções implementadas para resolver o problema de loop infinito e duplicação de mensagens no sistema de chat.

## 1. Normalização de Números

### Problema:
Inconsistências na normalização de números de telefone e IDs de grupo entre o backend Node.js (zap.js) e o backend .NET, causando a criação de chats duplicados para o mesmo contato.

### Correções:
- Implementada uma função padronizada de normalização em `zap.js`:
  ```javascript
  function normalizeNumber(num, isGroup = false) {
    if (!num) return null;
    
    // Remover todos os caracteres não numéricos
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
- Adicionados logs detalhados para rastreamento de normalização:
  ```javascript
  console.log(`📞 Normalização de número: original=${fromResolved}, normalizado=${incoming.fromNormalized}, isGroup=${isGroup}`);
  ```

## 2. Correção da Heurística de Grupos

### Problema:
A heurística para identificação de grupos em `ChatsController.cs` usava `Contains("@g.us")` em vez de `EndsWith("@g.us")`, o que poderia causar falsos positivos.

### Correções:
- Alterada a heurística para usar `EndsWith` em vez de `Contains`:
  ```csharp
  var isGroup = (to?.EndsWith("@g.us") ?? false) || (to?.StartsWith("120") == true && to!.Length >= 18);
  ```
- Melhorada a normalização de IDs de grupo:
  ```csharp
  if (toNormalized.EndsWith("@g.us") || toNormalized.EndsWith("@c.us")) {
      toNormalized = toNormalized.Split('@')[0];
  }
  ```
- Adicionados logs para debug:
  ```csharp
  _logger.LogDebug($"Normalização em Send: original={to}, normalizado={toNormalized}, isGroup={isGroup}");
  ```

## 3. Desativação de DEV_LOOPBACK em Produção

### Problema:
O modo DEV_LOOPBACK estava ativo por padrão em produção, causando loops de mensagens quando o usuário enviava mensagens para si mesmo.

### Correções:
- Alterada a lógica para desativar DEV_LOOPBACK em produção por padrão:
  ```javascript
  const DEV_LOOPBACK = process.env.DEV_LOOPBACK_INBOUND === 'true' && process.env.NODE_ENV !== 'production';
  ```
- Adicionada flag `fromMe` nas mensagens de loopback para identificação:
  ```javascript
  const simulated = {
    // ...
    fromMe: true
  };
  ```

## 4. Deduplicação de Mensagens no Frontend

### Problema:
O frontend não tinha mecanismos robustos para evitar a duplicação de mensagens recebidas via SignalR.

### Correções:
- Implementada deduplicação por ID exato da mensagem:
  ```typescript
  if (processedInboundIdsRef.current.has(id)) {
    if (isDebugEnabled) console.debug('[chat] Mensagem já processada (ID duplicado):', id);
    return;
  }
  ```
- Adicionada deduplicação secundária por conteúdo e chat:
  ```typescript
  const fallbackKey = `${chatId}|${text || ''}|${ts || ''}`;
  const lastKey = lastMessageKeyByChatRef.current[chatId];
  if (lastKey === fallbackKey) {
    if (isDebugEnabled) console.debug('[chat] Mensagem com conteúdo duplicado, ignorando:', fallbackKey);
    return;
  }
  ```
- Ignorando mensagens `fromMe` para evitar loops:
  ```typescript
  if (evt?.message?.fromMe === true) {
    if (isDebugEnabled) console.debug('[chat] Ignorando mensagem fromMe:', evt?.message?.id);
    return;
  }
  ```

## 5. Implementação de Debounce e Throttle

### Problema:
Múltiplas chamadas a `refreshChats()` causavam re-renders excessivos e potenciais loops.

### Correções:
- Implementado debounce para `refreshChats()`:
  ```typescript
  const refreshChats = async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    
    // Limitar a frequência de refresh para no máximo uma vez a cada 2 segundos
    if (timeSinceLastRefresh < 2000) {
      if (refreshChatsRef.current) {
        clearTimeout(refreshChatsRef.current);
      }
      
      refreshChatsRef.current = setTimeout(() => {
        refreshChatsRef.current = null;
        refreshChats();
      }, 2000 - timeSinceLastRefresh);
      
      return;
    }
    
    // ... resto da função
  };
  ```
- Implementado throttle para chamadas via SignalR:
  ```typescript
  const throttledRefresh = async (ms = 5000) => {
    // ... lógica de throttle
  };
  ```

## 6. Logs Detalhados para Depuração

### Problema:
Falta de visibilidade no fluxo de mensagens, dificultando a identificação de problemas.

### Correções:
- Adicionados logs detalhados controlados por flag em localStorage:
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
- Logs para rastreamento de normalização de números no backend Node.js:
  ```javascript
  console.log(`📞 Normalização de número: original=${fromResolved}, normalizado=${incoming.fromNormalized}, isGroup=${isGroup}`);
  ```

## Conclusão

As correções implementadas abordam os principais problemas identificados na análise:

1. **Normalização de Números**: Padronização entre Node.js e .NET
2. **Heurística de Grupos**: Correção da lógica de identificação
3. **DEV_LOOPBACK**: Desativação em produção
4. **Deduplicação**: Implementação de mecanismos robustos no frontend
5. **Debounce/Throttle**: Controle de frequência de atualizações
6. **Logs**: Adição de logs detalhados para depuração

Estas correções devem eliminar o problema de loop infinito e duplicação de mensagens no sistema de chat, resultando em uma experiência mais estável e previsível para os usuários.
