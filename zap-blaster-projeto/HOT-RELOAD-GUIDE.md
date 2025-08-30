# 🔥 Sistema de Hot Reload - Zap Bot

Sistema avançado que permite **atualizações em tempo real** sem perder a **conexão WhatsApp** durante testes de massa.

## 🚀 Como Usar

### Modo Desenvolvimento (Recomendado)
```bash
npm run dev
```

### Modo Simples (Nodemon)
```bash
npm run dev-simple
```

### Modo Produção (Sem Hot Reload)
```bash
npm run production
```

## ✨ Funcionalidades

### 🔄 Hot Reload Automático
- **Detecta mudanças** em arquivos `.js` automaticamente
- **Recarrega módulos** sem reiniciar o processo principal
- **Preserva conexão WhatsApp** durante atualizações
- **Debounce de 3 segundos** para evitar reloads excessivos

### 📱 Preservação de Sessão
- **Sessão WhatsApp mantida** durante atualizações
- **Conexão RabbitMQ preservada**
- **Estado interno mantido**
- **Backup automático** em caso de problemas

### 🎛️ Controles Interativos
No modo `npm run dev`, use os comandos:

- **`r + Enter`** - Reiniciar zap bot
- **`s + Enter`** - Ver estatísticas
- **`q + Enter`** - Sair
- **`h + Enter`** - Ajuda

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Desabilitar hot reload
DISABLE_HOT_RELOAD=true

# Modo produção (desabilita hot reload automaticamente)
NODE_ENV=production
```

### Arquivos Monitorados
- `*.js` (arquivos JavaScript principais)
- `package.json` (dependências)
- `.env*` (variáveis de ambiente)
- `./modules/**/*.js` (módulos customizados)
- `./services/**/*.js` (serviços)

### Arquivos Ignorados
- `node_modules/**`
- `session/**` (sessão WhatsApp)
- `whatsapp_data/**` (dados extraídos)
- `.git/**`
- `logs/**`
- `*.log`
- `backup/**`

## 🛠️ Comandos Avançados

### Via Console (Quando Ativo)
```javascript
// Ver estatísticas
hotReload.stats()

// Forçar reload de um arquivo
hotReload.reload("WhatsAppDataExtractor.js")

// Parar hot reload
hotReload.stop()
```

## 📊 Modules Suportados

### ✅ Módulos com Hot Reload Inteligente
- **`WhatsAppDataExtractor.js`** - Recarrega e reinicializa automaticamente
- **`emoji-resilience-processor.js`** - Atualização em tempo real
- **Módulos customizados** - Suporte genérico

### 🔒 Módulos Protegidos (Não Recarregam)
- **`zap.js`** (arquivo principal)
- **Sessão WhatsApp** 
- **Conexão RabbitMQ**

## 🚨 Cenários de Uso

### ✅ Ideal Para:
- **Desenvolvimento ativo** com mudanças frequentes
- **Testes de massa** sem interrupção
- **Debug em tempo real**
- **Ajustes de lógica** durante operação
- **Atualizações de processadores** de mensagem

### ⚠️ Não Recomendado Para:
- **Produção** (use `npm run production`)
- **Mudanças estruturais** no arquivo principal
- **Alterações de dependências** (reinicie manualmente)

## 📋 Logs e Debug

### Logs do Hot Reload
```
🔥 Hot Reload ativo! Use global.hotReload para comandos
📝 Mudança detectada: javascript - WhatsAppDataExtractor.js
🔄 Iniciando hot reload: javascript - WhatsAppDataExtractor.js
✅ Hot reload concluído: WhatsAppDataExtractor.js
```

### Verificação de Status
```bash
# Ver se está funcionando
npm run dev
# Depois digite: s + Enter
```

## 🐛 Troubleshooting

### Hot Reload Não Funciona
1. **Verificar ambiente**:
   ```bash
   echo $NODE_ENV
   echo $DISABLE_HOT_RELOAD
   ```

2. **Verificar dependências**:
   ```bash
   npm list chokidar
   ```

3. **Logs de erro**: Verificar console para erros de inicialização

### Performance
- **Delay padrão**: 3 segundos entre mudanças
- **Ajustar delay**: Modificar `debounceDelay` no código
- **Memória**: Sistema limpa cache automaticamente

### Limitações
- **Mudanças estruturais** requerem restart manual
- **Novas dependências** precisam de `npm install`
- **Arquivos binários** não são monitorados

## 🔬 Modo de Teste Avançado

### Teste com Múltiplas Mudanças
```bash
# Terminal 1
npm run dev

# Terminal 2 - Fazer mudanças rápidas
echo "// Teste $(date)" >> WhatsAppDataExtractor.js
sleep 1
echo "// Teste $(date)" >> emoji-resilience-processor.js
```

### Monitoramento de Performance
```javascript
// No console do Node.js
hotReload.stats()
// Mostra estatísticas de reloads e performance
```

## 🎯 Melhores Práticas

### ✅ Recomendações
1. **Usar `npm run dev`** para desenvolvimento
2. **Aguardar logs** de confirmação após mudanças
3. **Testar funcionalidade** após reload automático
4. **Verificar estatísticas** periodicamente
5. **Usar comandos interativos** para controle

### ❌ Evitar
1. **Mudanças muito frequentes** (< 3 segundos)
2. **Editar arquivos de sessão** manualmente
3. **Modificar `zap.js`** durante operação crítica
4. **Usar em produção** sem necessidade

---

## 🚀 Resultado

Com este sistema, você pode:
- **Desenvolver continuamente** sem perder conexão WhatsApp
- **Testar mudanças** em tempo real
- **Manter testes de massa** rodando sem interrupção
- **Debug eficiente** com feedback imediato

**Perfeito para desenvolvimento ágil e testes intensivos!** 🎉
