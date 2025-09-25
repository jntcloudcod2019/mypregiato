// Script para limpar o status de falha do Clerk
// Execute este script no console do navegador para resetar o Clerk

console.log('🧹 Limpando status de falha do Clerk...');

try {
  // Limpar sessionStorage
  sessionStorage.removeItem('clerk_failed');
  sessionStorage.removeItem('clerk_last_failure');
  
  // Limpar localStorage também
  localStorage.removeItem('clerk_failed');
  localStorage.removeItem('clerk_last_failure');
  
  console.log('✅ Status de falha do Clerk limpo com sucesso!');
  console.log('🔄 Recarregue a página para tentar novamente.');
  
  // Recarregar a página automaticamente
  window.location.reload();
  
} catch (error) {
  console.error('❌ Erro ao limpar status do Clerk:', error);
  console.log('🔄 Tente recarregar a página manualmente.');
}