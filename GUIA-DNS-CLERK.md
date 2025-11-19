# 📡 GUIA COMPLETO: Configurar DNS para Clerk em Produção

**Documentação Oficial:** https://clerk.com/docs/guides/dashboard/dns-domains

---

## 🎯 **POR QUE CONFIGURAR DNS?**

Sem DNS configurado, você está usando domínio interno Railway:
- ❌ `clerk.mypregiato-667d986e.railway.internal`

Com DNS configurado, você terá:
- ✅ `mypregiato.com.br` (ou seu domínio personalizado)
- ✅ Sessões compartilhadas entre subdomínios
- ✅ Emails verificados do seu domínio
- ✅ URL profissional para seus usuários

---

## 📋 **PRÉ-REQUISITOS**

Antes de começar, você precisa:

1. **Ter um domínio próprio**
   - Exemplo: `mypregiato.com.br`
   - Pode ser `.com`, `.com.br`, `.app`, etc.
   
2. **Acesso ao painel DNS do seu provedor**
   - GoDaddy, Registro.br, Cloudflare, Namecheap, etc.
   
3. **Instância de produção do Clerk criada**
   - Já temos: chaves `pk_live_` e `sk_live_`

---

## 🔧 **PASSO A PASSO COMPLETO**

### **ETAPA 1: Acessar o Clerk Dashboard**

1. Acesse: https://dashboard.clerk.com
2. No topo do Dashboard, clique em **"Production"** (se já estiver na instância de produção)
3. No menu lateral, clique em **"Domains"** (ou acesse diretamente: https://dashboard.clerk.com/~/domains)

---

### **ETAPA 2: Adicionar Domínio Personalizado**

No painel "Domains", você verá duas seções:

#### **A) Application Domain** (Domínio principal da aplicação)

1. Clique em **"Add domain"** ou **"Set up domain"**
2. Digite seu domínio: `mypregiato.com.br`
3. Clique em **"Continue"** ou **"Add"**

O Clerk irá mostrar os **registros DNS** que você precisa adicionar:

```
Tipo: CNAME
Nome: @ (ou deixe em branco, ou use "mypregiato.com.br")
Valor: clerk-domain-xxxxx.clerk.app
TTL: Auto ou 3600
```

#### **B) Accounts Subdomain** (Opcional - para páginas de login/signup)

Se você quiser um subdomínio dedicado para autenticação (ex: `accounts.mypregiato.com.br`):

```
Tipo: CNAME
Nome: accounts
Valor: clerk-accounts-xxxxx.clerk.app
TTL: Auto ou 3600
```

---

### **ETAPA 3: Adicionar Registros DNS no Seu Provedor**

Agora você precisa adicionar os registros CNAME no painel do seu provedor de domínio.

#### **📌 EXEMPLO 1: GoDaddy**

1. Acesse: https://dcc.godaddy.com/
2. Clique no seu domínio
3. Clique em **"DNS"** ou **"Manage DNS"**
4. Role até **"Records"**
5. Clique em **"Add"** ou **"Add Record"**
6. Preencha:
   - **Type:** CNAME
   - **Name:** `@` (para domínio raiz) ou `accounts` (para subdomínio)
   - **Value:** Cole o valor fornecido pelo Clerk (ex: `clerk-domain-xxxxx.clerk.app`)
   - **TTL:** 600 ou 1 Hour
7. Clique em **"Save"**

#### **📌 EXEMPLO 2: Registro.br**

1. Acesse: https://registro.br
2. Faça login e vá em **"Meus domínios"**
3. Clique no seu domínio
4. Vá em **"Editar Zona DNS"** ou **"DNS"**
5. Clique em **"Adicionar entrada"**
6. Preencha:
   - **Tipo:** CNAME
   - **Nome:** `@` ou `accounts`
   - **Dados:** Cole o valor do Clerk
   - **TTL:** 3600
7. Clique em **"Salvar"**

#### **📌 EXEMPLO 3: Cloudflare**

1. Acesse: https://dash.cloudflare.com
2. Selecione seu domínio
3. Vá em **"DNS"** no menu lateral
4. Clique em **"Add record"**
5. Preencha:
   - **Type:** CNAME
   - **Name:** `@` ou `accounts`
   - **Target:** Cole o valor do Clerk
   - **Proxy status:** 🔴 **IMPORTANTE:** Desabilite o proxy (clique no ícone laranja para ficar cinza "DNS only")
   - **TTL:** Auto
6. Clique em **"Save"**

⚠️ **ATENÇÃO CLOUDFLARE:** O proxy DEVE estar desabilitado (DNS only) para o Clerk funcionar!

#### **📌 EXEMPLO 4: Namecheap**

1. Acesse: https://ap.www.namecheap.com/
2. Vá em **"Domain List"**
3. Clique em **"Manage"** no seu domínio
4. Vá em **"Advanced DNS"**
5. Clique em **"Add New Record"**
6. Preencha:
   - **Type:** CNAME Record
   - **Host:** `@` ou `accounts`
   - **Value:** Cole o valor do Clerk
   - **TTL:** Automatic
7. Clique em **"Save All Changes"**

---

### **ETAPA 4: Aguardar Propagação DNS**

Após adicionar os registros DNS:

- ⏱️ **Tempo de propagação:** De alguns minutos até **48 horas**
- 🌍 **É global:** Pode aparecer mais rápido em alguns lugares do mundo

#### **Como verificar se propagou:**

**Opção 1: Comando Terminal**

```bash
# Verificar CNAME
dig mypregiato.com.br CNAME +short

# Ou com nslookup
nslookup mypregiato.com.br
```

Se retornar algo como `clerk-domain-xxxxx.clerk.app`, está funcionando! ✅

**Opção 2: Sites Online**

- https://dnschecker.org
- https://www.whatsmydns.net

Digite seu domínio e selecione "CNAME" para verificar.

---

### **ETAPA 5: Verificar no Clerk Dashboard**

1. Volte ao [Clerk Dashboard → Domains](https://dashboard.clerk.com/~/domains)
2. Você verá um status ao lado do seu domínio:
   - 🟡 **Pending verification** (aguardando)
   - 🟢 **Verified** (sucesso!)
   - 🔴 **Failed** (erro - verifique os registros)

3. Se estiver **Pending**, aguarde alguns minutos e clique em **"Verify"** ou **"Check again"**

---

### **ETAPA 6: Deploy de Certificados SSL**

Quando o DNS estiver verificado:

1. O Clerk irá automaticamente provisionar certificados SSL (TLS)
2. No Dashboard, aparecerá um botão **"Deploy certificates"**
3. Clique nele
4. Aguarde alguns minutos

✅ Certificados emitidos por: **Let's Encrypt** ou **Google Trust Services**

---

### **ETAPA 7: Atualizar Configurações da Aplicação**

Após DNS configurado, atualize as URLs no seu projeto:

#### **Frontend - `front/railway.json`**

```json
{
  "environments": {
    "production": {
      "variables": {
        "VITE_API_BASE_URL": "https://api.mypregiato.com.br",
        "VITE_SIGNALR_URL": "https://api.mypregiato.com.br/hubs/whatsapp",
        "VITE_CLERK_PUBLISHABLE_KEY": "pk_live_Y2xlcmsubXlwcmVnaWF0by02NjdkOTg2ZS5yYWlsd2F5LmludGVybmFsJA"
      }
    }
  }
}
```

#### **Backend - Autorização**

Se implementar `authorizedParties`:

```csharp
AuthorizedParties = new[] { 
    "https://mypregiato.com.br",
    "https://accounts.mypregiato.com.br"
}
```

---

## 🔧 **TROUBLESHOOTING (Resolução de Problemas)**

### **❌ Problema 1: DNS não propaga após 24h**

**Causas comuns:**
- CNAME incorreto
- Proxy Cloudflare ativado (deve estar "DNS only")
- TTL muito alto
- Registro conflitante (A record no mesmo nome)

**Solução:**
1. Verifique se o valor do CNAME está exatamente como o Clerk forneceu
2. No Cloudflare, desabilite o proxy (ícone laranja → cinza)
3. Remova qualquer registro A com o mesmo nome
4. Reduza o TTL para 600 segundos

---

### **❌ Problema 2: Certificado SSL não emite**

**Erro típico:** "Stuck in certificate issuance"

**Causa:** Registros CAA bloqueando Let's Encrypt ou Google Trust Services

**Solução:**

```bash
# Verificar se tem CAA
dig mypregiato.com.br CAA +short

# Se retornar algo, você precisa adicionar:
0 issue "letsencrypt.org"
0 issue "pki.goog"
```

Ou remover os registros CAA completamente.

**Documentação:** https://clerk.com/docs/guides/development/deployment/production#deployment-stuck-in-certificate-issuance

---

### **❌ Problema 3: Cloudflare bloqueando DNS check**

**Erro:** "DNS check failed"

**Causa:** Cloudflare proxy reversível oculta o CNAME real

**Solução:**
1. No Cloudflare DNS, clique no registro CNAME
2. Clique no ícone **laranja** (Proxied) para mudar para **cinza** (DNS only)
3. Aguarde alguns minutos
4. Volte ao Clerk e clique em "Verify" novamente

---

### **❌ Problema 4: Domínio incorreto**

Se você configurou o domínio errado:

**Solução:**
1. Acesse [Clerk Dashboard → Domains](https://dashboard.clerk.com/~/domains)
2. Clique nos **três pontos** ao lado do domínio
3. Clique em **"Remove"** ou **"Change"**
4. Adicione o domínio correto

**Documentação:** https://clerk.com/docs/guides/development/deployment/changing-domains

---

## 📊 **EXEMPLO COMPLETO: mypregiato.com.br**

### **1. Registros DNS a adicionar:**

```
# Domínio principal
Tipo: CNAME
Nome: @
Valor: clerk-domain-abc123.clerk.app
TTL: 3600

# Subdomínio de contas (opcional)
Tipo: CNAME
Nome: accounts
Valor: clerk-accounts-xyz789.clerk.app
TTL: 3600
```

### **2. Resultado após configuração:**

- ✅ `https://mypregiato.com.br` → Aplicação principal
- ✅ `https://accounts.mypregiato.com.br` → Páginas de login/signup
- ✅ Certificados SSL automáticos
- ✅ Sessões compartilhadas entre subdomínios

---

## 🌐 **AUTENTICAÇÃO ENTRE SUBDOMÍNIOS**

Com DNS configurado, a autenticação funciona automaticamente entre:

### **Cenário 1: Mesmo domínio raiz** ✅

```
mypregiato.com.br          ← Login aqui
dashboard.mypregiato.com.br ← Sessão compartilhada automaticamente
accounts.mypregiato.com.br  ← Sessão compartilhada automaticamente
```

### **Cenário 2: Domínios diferentes** ⚠️

```
mypregiato.com.br    ← Login aqui
outrodominio.com.br  ← Precisa configuração adicional (Satellite Domains)
```

**Documentação:** https://clerk.com/docs/guides/dashboard/dns-domains/satellite-domains

---

## 🔐 **CONFIGURAÇÃO AVANÇADA: Satellite Domains**

Se você precisa autenticação em **domínios completamente diferentes** (ex: `admin.com` e `app.com`):

1. Acesse [Clerk Dashboard → Domains](https://dashboard.clerk.com/~/domains)
2. Na seção **"Satellite domains"**, clique em **"Add satellite domain"**
3. Configure o segundo domínio
4. No código do segundo domínio, use:

```typescript
<ClerkProvider 
  publishableKey="pk_live_..."
  domain="mypregiato.com.br"  // Domínio principal
  isSatellite={true}           // Marca como satélite
>
```

---

## 📚 **RECURSOS ADICIONAIS**

- [Clerk DNS Configuration](https://clerk.com/docs/guides/dashboard/dns-domains)
- [Production Deployment Guide](https://clerk.com/docs/guides/development/deployment/production)
- [Changing Domains](https://clerk.com/docs/guides/development/deployment/changing-domains)
- [Satellite Domains](https://clerk.com/docs/guides/dashboard/dns-domains/satellite-domains)
- [DNS Checker Tool](https://dnschecker.org)
- [Let's Encrypt CAA](https://letsencrypt.org/docs/caa/)

---

## ✅ **CHECKLIST FINAL**

Antes de considerar concluído:

- [ ] Domínio adicionado no Clerk Dashboard
- [ ] Registros CNAME configurados no provedor DNS
- [ ] DNS propagado (verificado com `dig` ou dnschecker.org)
- [ ] Status "Verified" no Clerk Dashboard
- [ ] Certificados SSL emitidos
- [ ] Aplicação acessível via domínio personalizado
- [ ] Login funcionando corretamente
- [ ] URLs atualizadas no `railway.json` e backend
- [ ] Cloudflare proxy desabilitado (se aplicável)

---

## 🎯 **RESUMO RÁPIDO**

```
1. Clerk Dashboard → Domains → Add domain
2. Copiar valor CNAME fornecido
3. Provedor DNS → Add CNAME record
4. Aguardar propagação (até 48h)
5. Clerk Dashboard → Verify
6. Deploy certificates
7. Atualizar URLs na aplicação
8. Testar! 🚀
```

---

**Última atualização:** 19/11/2025  
**Status:** Guia completo para configuração DNS do Clerk

