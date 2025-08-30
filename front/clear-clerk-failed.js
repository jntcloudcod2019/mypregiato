// Script para limpar todo o estado de autenticação problemático
console.log('🔧 Limpando estado de autenticação...');

try {
  // Verificar valores atuais
  console.log('Estado atual:', {
    clerk_failed: sessionStorage.getItem('clerk_failed'),
    clerk_last_failure: sessionStorage.getItem('clerk_last_failure'),
    auth_token: sessionStorage.getItem('auth_token'),
    userRole: sessionStorage.getItem('userRole')
  });
  
  // Limpar todos os itens relacionados à autenticação
  const authKeys = [
    'clerk_failed',
    'clerk_last_failure', 
    'auth_token',
    'userRole',
    'auth_checked',
    'clerk_auth_state'
  ];
  
  authKeys.forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
  
  console.log('✅ Estado de autenticação limpo');
  
  // Aguardar um pouco e recarregar
  setTimeout(() => {
    window.location.reload();
  }, 500);
  
} catch (error) {
  console.error('❌ Erro ao limpar estado:', error);
}
