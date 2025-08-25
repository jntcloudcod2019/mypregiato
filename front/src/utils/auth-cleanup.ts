/**
 * Utilitários para limpeza de dados de autenticação
 */

/**
 * Limpa todos os dados residuais que podem interferir com a autenticação
 */
export function clearAuthData(): void {
  try {
    // Limpar dados do Clerk
    sessionStorage.removeItem('clerk_failed');
    sessionStorage.removeItem('clerk_last_failure');
    
    // Limpar dados de autenticação do localStorage
    localStorage.removeItem('atd.tickets');
    
    // Limpar cookies relacionados à autenticação
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ Dados de autenticação limpos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar dados de autenticação:', error);
  }
}

/**
 * Verifica se há dados residuais que podem causar problemas de autenticação
 */
export function checkAuthDataIssues(): boolean {
  try {
    const clerkFailed = sessionStorage.getItem('clerk_failed') === 'true';
    const lastFailure = sessionStorage.getItem('clerk_last_failure');
    
    if (clerkFailed && lastFailure) {
      const timeSinceFailure = Date.now() - parseInt(lastFailure);
      // Se a falha foi há mais de 1 hora, limpar automaticamente
      if (timeSinceFailure > 60 * 60 * 1000) {
        console.log('🔄 Limpando dados de falha antigos do Clerk');
        clearAuthData();
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao verificar dados de autenticação:', error);
    return false;
  }
}

/**
 * Força a reinicialização da autenticação
 */
export function forceAuthReinit(): void {
  try {
    // Limpar dados
    clearAuthData();
    
    // Recarregar a página para forçar reinicialização
    window.location.reload();
  } catch (error) {
    console.error('❌ Erro ao forçar reinicialização da autenticação:', error);
  }
}
