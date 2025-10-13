# 🔍 DIAGNÓSTICO DO LOOP INFINITO - CRIAR TREINAMENTOS

## 📋 EXECUTE ESTE SCRIPT NO CONSOLE DO NAVEGADOR

**Acesse:** https://my-pregiato-production.up.railway.app/treinamentos/criar

**Aperte F12 → Console → Cole e execute:**

```javascript
// ========================================
// 🔍 DIAGNÓSTICO COMPLETO
// ========================================

console.clear();
console.log("🔍 ========================================");
console.log("🔍 DIAGNÓSTICO DO LOOP - CRIAR TREINAMENTOS");
console.log("🔍 ========================================\n");

// 1. Verificar Clerk
console.log("📊 1. STATUS DO CLERK:");
console.log("   isLoaded:", window.Clerk?.loaded || false);
console.log("   isSignedIn:", !!window.Clerk?.user);
console.log("   userId:", window.Clerk?.user?.id || 'NULL');
console.log("   sessionId:", window.Clerk?.session?.id || 'NULL');

// 2. Verificar sessionStorage
console.log("\n📦 2. SESSION STORAGE:");
const sessionKeys = {
  clerk_failed: sessionStorage.getItem('clerk_failed'),
  server_restarted: sessionStorage.getItem('server_restarted'),
  lastRoute: sessionStorage.getItem('lastRoute'),
  server_checked: sessionStorage.getItem('server_checked'),
  page_closing: sessionStorage.getItem('page_closing')
};
console.table(sessionKeys);

// 3. Verificar rota atual
console.log("\n🗺️ 3. INFORMAÇÕES DA ROTA:");
console.log("   pathname:", window.location.pathname);
console.log("   search:", window.location.search);
console.log("   hash:", window.location.hash);
console.log("   href:", window.location.href);

// 4. Verificar localStorage
console.log("\n💾 4. LOCAL STORAGE (Clerk):");
const clerkKeys = Object.keys(localStorage).filter(k => k.includes('clerk'));
console.log("   Chaves do Clerk:", clerkKeys.length);
clerkKeys.slice(0, 5).forEach(key => {
  console.log(`   - ${key.substring(0, 50)}...`);
});

// 5. Histórico de navegação
console.log("\n📚 5. HISTÓRICO:");
console.log("   length:", window.history.length);
console.log("   state:", window.history.state);

// 6. Contador de redirecionamentos
let redirectCount = 0;
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = function(...args) {
  redirectCount++;
  console.log(`🔄 REDIRECT #${redirectCount} (pushState):`, args[2]);
  if (redirectCount > 5) {
    console.error("⚠️ LOOP DETECTADO! Mais de 5 redirecionamentos!");
    alert("LOOP DETECTADO! Verifique o console.");
  }
  return originalPushState.apply(this, args);
};

window.history.replaceState = function(...args) {
  redirectCount++;
  console.log(`🔄 REDIRECT #${redirectCount} (replaceState):`, args[2]);
  if (redirectCount > 5) {
    console.error("⚠️ LOOP DETECTADO! Mais de 5 redirecionamentos!");
    alert("LOOP DETECTADO! Verifique o console.");
  }
  return originalReplaceState.apply(this, args);
};

// 7. Verificar CSP
console.log("\n🛡️ 6. CONTENT SECURITY POLICY:");
const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
if (metaCSP) {
  const csp = metaCSP.getAttribute('content');
  console.log("   worker-src presente:", csp?.includes('worker-src') ? '✅' : '❌');
  console.log("   blob: presente:", csp?.includes('blob:') ? '✅' : '❌');
  console.log("   unsafe-eval presente:", csp?.includes('unsafe-eval') ? '✅' : '❌');
} else {
  console.log("   ❌ CSP meta tag não encontrada!");
}

// 8. Monitorar erros
console.log("\n⚠️ 7. MONITORANDO ERROS...\n");
window.addEventListener('error', (e) => {
  console.error("❌ ERRO:", e.message, e.filename, e.lineno);
});

console.log("✅ DIAGNÓSTICO COMPLETO!");
console.log("👀 Aguardando redirecionamentos...\n");
console.log("🔍 ========================================\n");
```

---

## 📸 ME ENVIE:

1. **PRINT da saída do console**
2. **PRINT da aba Network (F12 → Network)** mostrando as requisições
3. Me diga: **Quantos redirecionamentos aparecem?**

---

## ✅ SE APARECER "LOOP DETECTADO":

Execute este comando para limpar tudo:

```javascript
// LIMPAR TUDO E RECARREGAR
sessionStorage.clear();
Object.keys(localStorage).forEach(key => {
  if (key.includes('clerk')) localStorage.removeItem(key);
});
window.location.href = '/login';
```

---

## 🔧 CORREÇÕES JÁ APLICADAS:

✅ RouteTracker - não salva rotas sem autenticação  
✅ login.tsx - fallback para /dashboard  
✅ CSP - worker-src e blob: adicionados  

**Se ainda estiver em loop, precisamos ver o console!**

