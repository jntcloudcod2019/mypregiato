/**
 * Servidor de Produção - MY PREGIATO
 * 
 * Este servidor implementa:
 * - Proxy do Clerk Frontend API (/__clerk/*)
 * - Content Security Policy (CSP)
 * - Serving de arquivos estáticos (React SPA)
 * - Headers de segurança
 */

const express = require('express');
const path = require('path');
const { createClerkProxyMiddleware } = require('./clerk-proxy.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// CONFIGURAÇÃO DO CLERK PROXY
// ============================================================================

const CLERK_PROXY_URL = process.env.CLERK_PROXY_URL || 'https://my-pregiato-production.up.railway.app/__clerk';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_live_yhu3BQHiGHGqlljcLBhoMEUguD3he5V51IOqetmx17';

console.log('🚀 [SERVER] Inicializando servidor de produção...');
console.log('📡 [SERVER] Clerk Proxy URL:', CLERK_PROXY_URL);
console.log('🔐 [SERVER] Clerk Secret Key:', CLERK_SECRET_KEY ? '✅ Configurada' : '❌ NÃO configurada');

// Clerk Proxy Middleware - DEVE vir ANTES de outros middlewares
app.use('/__clerk', createClerkProxyMiddleware({
  proxyUrl: CLERK_PROXY_URL,
  secretKey: CLERK_SECRET_KEY,
}));

// ============================================================================
// CONTENT SECURITY POLICY (CSP)
// ============================================================================

app.use((req, res, next) => {
  // Pular CSP para requisições do proxy do Clerk
  if (req.path.startsWith('/__clerk')) {
    return next();
  }

  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' blob: data: https://fonts.googleapis.com https://clerk.com https://*.clerk.accounts.dev; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' data: blob: https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "media-src 'self' data: blob: https: https://bucket-production-1aef.up.railway.app; " +
    "connect-src 'self' http://localhost:5656 https://clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://pregiato-api-production.up.railway.app https://bucket-production-1aef.up.railway.app https://viacep.com.br wss:; " +
    "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev; " +
    "worker-src 'self' blob:; " +
    "child-src 'self' blob:; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  
  // Outros headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// ============================================================================
// MIDDLEWARES GERAIS
// ============================================================================

app.use(express.json());

// Logging de requisições (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
  });
}

// ============================================================================
// SERVING DE ARQUIVOS ESTÁTICOS (REACT SPA)
// ============================================================================

const frontEndPath = path.join(__dirname, '../dist');
console.log('📁 [SERVER] Servindo arquivos de:', frontEndPath);

app.use(express.static(frontEndPath));

// ============================================================================
// FALLBACK PARA SPA (REACT ROUTER)
// ============================================================================

// Todas as rotas não encontradas retornam index.html (SPA)
app.get('*', (req, res) => {
  // Não aplicar fallback para rotas de API ou proxy
  if (req.path.startsWith('/api') || req.path.startsWith('/__clerk')) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.sendFile(path.join(frontEndPath, 'index.html'));
});

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║         ✅ SERVIDOR MY PREGIATO INICIADO COM SUCESSO!        ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🔒 Clerk Proxy ativo em: ${CLERK_PROXY_URL}`);
  console.log(`📦 Arquivos estáticos: ${frontEndPath}`);
  console.log('');
  console.log('🎯 Pronto para receber requisições!');
  console.log('');
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ [SERVER] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [SERVER] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

