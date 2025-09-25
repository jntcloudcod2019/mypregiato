// Script para testar a configuração do Clerk
// Execute este script no console do navegador para verificar a configuração

console.log('🔍 Testando configuração do Clerk...');

// Verificar variáveis de ambiente
console.log('📋 Variáveis de ambiente:', {
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  VITE_ENABLE_CLERK: import.meta.env.VITE_ENABLE_CLERK,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_DEV_MODE: import.meta.env.VITE_DEV_MODE
});

// Verificar sessionStorage
console.log('💾 SessionStorage:', {
  clerk_failed: sessionStorage.getItem('clerk_failed'),
  clerk_last_failure: sessionStorage.getItem('clerk_last_failure')
});

// Verificar localStorage
console.log('💾 LocalStorage:', {
  clerk_failed: localStorage.getItem('clerk_failed'),
  clerk_last_failure: localStorage.getItem('clerk_last_failure')
});

// Verificar se o Clerk está disponível globalmente
console.log('🌐 Clerk global:', {
  windowClerk: typeof window.Clerk,
  clerkAvailable: typeof window.Clerk !== 'undefined'
});

// Verificar se há erros no console
console.log('❌ Verifique se há erros no console relacionados ao Clerk');

// Sugestões de solução
console.log('💡 Sugestões de solução:');
console.log('1. Se VITE_CLERK_PUBLISHABLE_KEY estiver undefined, verifique o arquivo .env');
console.log('2. Se clerk_failed for true, execute clear-clerk-failed.js');
console.log('3. Se houver erros de rede, verifique a conectividade');
console.log('4. Se o problema persistir, verifique se a chave do Clerk está correta');
