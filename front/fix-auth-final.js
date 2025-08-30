/**
 * SCRIPT FINAL PARA CORRIGIR AUTENTICAÇÃO
 * Execute no console do navegador (F12) na página de atendimento
 */

console.log('🔧 Iniciando correção FINAL do sistema de autenticação...');

try {
  // 1. Limpar TODOS os dados problemáticos do sessionStorage
  const keysToRemove = [
    'clerk_failed',
    'clerk_last_failure', 
    'server_restarted',
    'server_restart_time',
    'server_checked',
    'page_closing',
    'page_close_time'
  ];

  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`✅ Removido: ${key}`);
  });

  // 2. Verificar se ainda há itens problemáticos
  const remaining = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('clerk') || key.includes('server') || key.includes('auth'))) {
      remaining.push(key);
    }
  }

  if (remaining.length > 0) {
    console.log('⚠️ Itens restantes no sessionStorage:', remaining);
    // Remover todos os itens restantes problemáticos
    remaining.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`✅ Removido: ${key}`);
    });
  } else {
    console.log('✅ SessionStorage completamente limpo');
  }

  console.log('🚀 Recarregando página em 2 segundos...');
  setTimeout(() => {
    window.location.reload();
  }, 2000);

} catch (error) {
  console.error('❌ Erro durante limpeza:', error);
  console.log('🔄 Tentando recarregar mesmo assim...');
  window.location.reload();
}
