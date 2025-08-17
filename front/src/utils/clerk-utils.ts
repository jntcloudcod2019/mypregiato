/**
 * Utilitários para gerenciar a integração com o Clerk
 */

/**
 * Verifica se o Clerk está disponível baseado no histórico de erros
 * @returns {boolean} Verdadeiro se o Clerk deve ser ativado
 */
export function detectClerkAvailability(forceEnabled = true): boolean {
  // No modo de desenvolvimento, podemos forçar uma verificação
  const isDev = import.meta.env.DEV;
  
  try {
    // Verificar se o Clerk já falhou antes nesta sessão
    const clerkFailed = sessionStorage.getItem('clerk_failed') === 'true';
    if (clerkFailed) {
      console.log("Clerk desabilitado devido a falhas anteriores nesta sessão");
      return false;
    }
  } catch (error) {
    // Se não conseguir acessar sessionStorage, apenas continua
    console.warn("Não foi possível verificar o estado do Clerk no sessionStorage");
  }
  
  // Se não houver falhas registradas, usar com base no parâmetro
  return forceEnabled;
}

/**
 * Marca o Clerk como tendo falhado na sessão atual
 */
export function markClerkAsFailed(): void {
  try {
    sessionStorage.setItem('clerk_failed', 'true');
  } catch (error) {
    console.error("Não foi possível registrar falha do Clerk no sessionStorage:", error);
  }
}

/**
 * Limpa o status de falha do Clerk
 */
export function clearClerkFailedStatus(): void {
  try {
    sessionStorage.removeItem('clerk_failed');
  } catch (error) {
    console.error("Não foi possível limpar status do Clerk no sessionStorage:", error);
  }
}

/**
 * Recupera a chave publishable do Clerk de forma segura
 */
export function getClerkPublishableKey(): string {
  // Tentar obter de variáveis de ambiente do Vite
  const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (envKey) return envKey;
  
  // Fallback para chave de teste hardcoded (apenas desenvolvimento)
  return "pk_test_c21pbGluZy1tYW1tb3RoLTYuY2xlcmsuYWNjb3VudHMuZGV2JA";
}

/**
 * Verifica se o Clerk deve ser habilitado baseado nas configurações de ambiente
 */
export function shouldEnableClerk(): boolean {
  const envEnable = import.meta.env.VITE_ENABLE_CLERK;
  if (envEnable !== undefined) {
    return envEnable === 'true';
  }
  
  // Por padrão, habilitar em desenvolvimento
  return import.meta.env.DEV;
}
