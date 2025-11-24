# 🎯 INSTRUÇÕES DE USO - MIGRAÇÃO CLERK

## ✅ Projeto criado com sucesso!

Todos os arquivos necessários foram criados na pasta `migration-clerk/`.

## 📝 PASSO A PASSO

### 1️⃣ **Processar os nomes**

```bash
cd migration-clerk
npm run process
```

**O que faz:**
- Lê `nomes_unicos.json` (da raiz do projeto)
- Limpa e formata os nomes
- Gera emails únicos
- Cria `users-processed.json` com dados prontos

**Saída esperada:**
```
🔄 Processando nomes_unicos.json...

✅ 1/1063: Adriano Domingos → adriano_domingos@pregiato.com.br
✅ 2/1063: Alessandra Silva → alessandra_silva@pregiato.com.br
...

✅ Processamento concluído!
📊 Total processados: 1050
❌ Total com erros: 13
📁 Arquivo gerado: users-processed.json
```

### 2️⃣ **Revisar usuários processados** (opcional)

```bash
cat users-processed.json | head -n 50
```

Verifique se os emails e nomes estão corretos.

### 3️⃣ **Executar migração**

```bash
npm start
```

**O que faz:**
- Cria cada usuário no Clerk via API
- Adiciona à organização Pregiato
- Respeita rate limits (1 req/segundo)
- Gera logs de sucesso e erros

**Saída esperada:**
```
🚀 ==================== MIGRAÇÃO EM MASSA CLERK ====================

📁 Lendo users-processed.json...
📊 Total de usuários: 1050
⏩ Offset: 0
⏱️  Delay entre requisições: 1000ms

🔄 [1] Criando: Adriano Domingos (adriano_domingos@pregiato.com.br)
✅ [1] Criado com sucesso! Clerk ID: user_2abc123...
🏢 [1] Adicionado à organização

🔄 [2] Criando: Alessandra Silva (alessandra_silva@pregiato.com.br)
✅ [2] Criado com sucesso! Clerk ID: user_2def456...
🏢 [2] Adicionado à organização

...

✅ ==================== MIGRAÇÃO CONCLUÍDA ====================
📊 Total processados: 1050
❌ Total com erros: 0
📁 Logs salvos: migration-success.json e migration-errors.json
```

## ⏱️ ESTIMATIVA DE TEMPO

Com **1063 usuários** e delay de **1 segundo** entre requisições:

- **Tempo total**: ~18 minutos (1063 segundos)
- Se houver rate limits: +10s por cada ocorrência

## 🔄 CONTINUAR MIGRAÇÃO INTERROMPIDA

Se o processo parar (Ctrl+C, erro, etc), você pode continuar de onde parou:

1. Veja quantos usuários foram processados no log
2. Edite `.env`:
   ```env
   OFFSET=500  # Começar do usuário 500
   ```
3. Execute novamente:
   ```bash
   npm start
   ```

## 📊 VERIFICAR RESULTADOS

### Sucesso:
```bash
cat migration-success.json
```

### Erros:
```bash
cat migration-errors.json
```

### Erros de processamento:
```bash
cat process-errors.json
```

## 🔐 CREDENCIAIS DOS USUÁRIOS CRIADOS

Todos os usuários terão:

| Campo | Valor |
|-------|-------|
| **Email** | `primeiro_sobrenome@pregiato.com.br` |
| **Senha** | `modelpregiato123` |
| **Role** | `MODEL` |
| **Organização** | Pregiato (org_35XUIz5zcKDS57ibItdzgNiIh99) |
| **External ID** | `user_primeiro_123` |

## ⚠️ IMPORTANTE

1. **Backup**: Os usuários são criados diretamente no Clerk de PRODUÇÃO
2. **Emails únicos**: Se houver duplicatas, o script adiciona sufixos (email1@, email2@)
3. **Não reversível**: Usuários criados não podem ser excluídos em massa via API
4. **Rate limits**: O script aguarda automaticamente se atingir o limite

## 🐛 PROBLEMAS COMUNS

### "users-processed.json não encontrado"
**Solução**: Execute `npm run process` primeiro

### "Clerk Secret Key inválida"
**Solução**: Verifique o arquivo `.env`

### Muitos erros 422 (email exists)
**Solução**: Normal se estiver re-executando. Usuários duplicados são pulados automaticamente.

### Rate limit (429)
**Solução**: O script aguarda 10s e continua automaticamente

## 📞 PRÓXIMOS PASSOS

Após a migração:

1. ✅ Verificar no dashboard do Clerk: https://dashboard.clerk.com
2. ✅ Testar login de alguns usuários
3. ✅ Verificar se estão na organização correta
4. ✅ Criar usuários no banco de dados local (se necessário)

---

**⚡ PRONTO PARA COMEÇAR!**

Execute:
```bash
npm run process
```

