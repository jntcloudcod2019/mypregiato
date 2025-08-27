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
    sessionStorage.removeItem('server_checked');
    
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

/**
 * NOVA REGRA: Força logout e limpeza quando o servidor for reiniciado
 * Esta função deve ser chamada sempre que o servidor for reiniciado
 */
export function forceLogoutOnServerRestart(): void {
  try {
    console.log('🔄 Servidor reiniciado - Forçando logout e limpeza de dados');
    
    // 1. Limpar TODOS os dados do Clerk de forma agressiva
    const clerkKeys = [
      '__clerk_client_jwt',
      '__clerk_db_jwt',
      '__clerk_session',
      '__clerk_user',
      '__clerk_organization',
      '__clerk_last_active_organization_id',
      '__clerk_last_active_session_id'
    ];
    
    clerkKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // 2. Limpar todos os dados que começam com __clerk ou clerk
    const allLocalKeys = Object.keys(localStorage);
    const allSessionKeys = Object.keys(sessionStorage);
    
    allLocalKeys.forEach(key => {
      if (key.startsWith('__clerk') || key.startsWith('clerk')) {
        localStorage.removeItem(key);
      }
    });
    
    allSessionKeys.forEach(key => {
      if (key.startsWith('__clerk') || key.startsWith('clerk')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // 3. Limpar cookies relacionados à autenticação
    const cookiesToClear = [
      '__clerk_client_jwt',
      '__clerk_db_jwt',
      '__clerk_session',
      'clerk-db',
      'clerk-session'
    ];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    });
    
    // 4. Limpar dados específicos da aplicação
    localStorage.removeItem('atd.tickets');
    sessionStorage.removeItem('clerk_failed');
    sessionStorage.removeItem('clerk_last_failure');
    sessionStorage.removeItem('server_restarted');
    sessionStorage.removeItem('server_restart_time');
    sessionStorage.removeItem('page_closing');
    sessionStorage.removeItem('page_close_time');
    
    // 5. Marcar que o servidor foi reiniciado
    sessionStorage.setItem('server_restarted', 'true');
    sessionStorage.setItem('server_restart_time', Date.now().toString());
    
    console.log('✅ Logout forçado e limpeza completa realizada');
    
    // 6. Forçar redirecionamento para login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    
  } catch (error) {
    console.error('❌ Erro ao forçar logout após reinicialização:', error);
    // Fallback: recarregar a página
    window.location.reload();
  }
}

/**
 * Verifica se o servidor foi reiniciado e força logout se necessário
 */
export function checkServerRestart(): boolean {
  try {
    const serverRestarted = sessionStorage.getItem('server_restarted') === 'true';
    
    if (serverRestarted) {
      console.log('🔄 Detectada reinicialização do servidor - Forçando nova autenticação');
      forceLogoutOnServerRestart();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao verificar reinicialização do servidor:', error);
    return false;
  }
}

/**
 * NOVA FUNÇÃO: Força logout imediato e limpeza completa
 * Baseado em boas práticas de autenticação
 */
export function forceImmediateLogout(): void {
  try {
    console.log('🔄 Forçando logout imediato e limpeza completa');
    
    // 1. Limpar todos os dados do Clerk
    const clerkKeys = [
      '__clerk_client_jwt',
      '__clerk_db_jwt',
      '__clerk_session',
      '__clerk_user',
      '__clerk_organization',
      '__clerk_last_active_organization_id',
      '__clerk_last_active_session_id'
    ];
    
    clerkKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // 2. Limpar todos os dados que começam com __clerk
    const allLocalKeys = Object.keys(localStorage);
    const allSessionKeys = Object.keys(sessionStorage);
    
    allLocalKeys.forEach(key => {
      if (key.startsWith('__clerk') || key.startsWith('clerk')) {
        localStorage.removeItem(key);
      }
    });
    
    allSessionKeys.forEach(key => {
      if (key.startsWith('__clerk') || key.startsWith('clerk')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // 3. Limpar cookies relacionados à autenticação
    const cookiesToClear = [
      '__clerk_client_jwt',
      '__clerk_db_jwt',
      '__clerk_session',
      'clerk-db',
      'clerk-session'
    ];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    });
    
    // 4. Limpar dados específicos da aplicação
    localStorage.removeItem('atd.tickets');
    sessionStorage.removeItem('clerk_failed');
    sessionStorage.removeItem('clerk_last_failure');
    sessionStorage.removeItem('server_restarted');
    sessionStorage.removeItem('server_restart_time');
    sessionStorage.removeItem('page_closing');
    sessionStorage.removeItem('page_close_time');
    
    // 5. Marcar que o servidor foi reiniciado
    sessionStorage.setItem('server_restarted', 'true');
    sessionStorage.setItem('server_restart_time', Date.now().toString());
    
    console.log('✅ Logout forçado e limpeza completa realizada');
    
    // 6. Forçar redirecionamento para login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    
  } catch (error) {
    console.error('❌ Erro ao forçar logout imediato:', error);
    // Fallback: recarregar a página
    window.location.reload();
  }
}
