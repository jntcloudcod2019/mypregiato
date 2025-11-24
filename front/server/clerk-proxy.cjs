/**
 * Clerk Proxy Middleware
 * 
 * Este middleware implementa o proxy do Clerk Frontend API conforme documentação:
 * https://clerk.com/docs/guides/dashboard/dns-domains/proxy-fapi
 * 
 * Requisitos:
 * - Forwarda requisições de /__clerk/* para https://frontend-api.clerk.dev/*
 * - Adiciona headers necessários: Clerk-Proxy-Url, Clerk-Secret-Key, X-Forwarded-For
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Cria o middleware de proxy do Clerk
 * @param {Object} options - Opções de configuração
 * @param {string} options.proxyUrl - URL completa do proxy (ex: https://my-pregiato-production.up.railway.app/__clerk)
 * @param {string} options.secretKey - Clerk Secret Key
 * @returns {Function} Middleware do Express
 */
function createClerkProxyMiddleware(options) {
  const { proxyUrl, secretKey } = options;

  if (!proxyUrl || !secretKey) {
    throw new Error('Clerk Proxy requer proxyUrl e secretKey');
  }

  console.log('🔒 [CLERK PROXY] Configurando proxy:', proxyUrl);

  return createProxyMiddleware({
    target: 'https://frontend-api.clerk.dev',
    changeOrigin: true,
    pathRewrite: {
      '^/__clerk': '', // Remove /__clerk do path
    },
    onProxyReq: (proxyReq, req, res) => {
      // Headers obrigatórios do Clerk para proxy
      proxyReq.setHeader('Clerk-Proxy-Url', proxyUrl);
      proxyReq.setHeader('Clerk-Secret-Key', secretKey);
      
      // IP do cliente original
      const clientIp = req.headers['x-forwarded-for'] || 
                       req.headers['x-real-ip'] || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress;
      proxyReq.setHeader('X-Forwarded-For', clientIp);

      // Preservar headers importantes da requisição original
      const headersToPreserve = [
        'authorization',
        'accept',
        'host',
        'origin',
        'referer',
        'sec-fetch-dest',
        'user-agent',
        'x-forwarded-host',
        'x-forwarded-proto',
        'cloudfront-forwarded-proto',
        'content-type',
        'cookie'
      ];

      headersToPreserve.forEach(header => {
        if (req.headers[header]) {
          proxyReq.setHeader(header, req.headers[header]);
        }
      });

      // Ajustar Host header para o destino
      proxyReq.setHeader('Host', 'frontend-api.clerk.dev');

      console.log('🔐 [CLERK PROXY] Request:', req.method, req.url, '→', proxyReq.path);
      console.log('🔐 [CLERK PROXY] Headers:', {
        'Clerk-Proxy-Url': proxyUrl,
        'X-Forwarded-For': clientIp,
        'Authorization': req.headers.authorization ? '✅ Present' : '❌ Missing',
        'Origin': req.headers.origin || 'N/A'
      });
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('✅ [CLERK PROXY] Response:', proxyRes.statusCode, req.url);
      
      // Adicionar CORS headers se necessário
      if (req.headers.origin) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
      }
    },
    onError: (err, req, res) => {
      console.error('❌ [CLERK PROXY] Erro:', err.message);
      res.status(500).json({
        error: 'Clerk Proxy Error',
        message: err.message,
      });
    },
  });
}

module.exports = { createClerkProxyMiddleware };

