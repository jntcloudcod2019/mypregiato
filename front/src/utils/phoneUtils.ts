/**
 * Utilitários para normalização e formatação de números de telefone
 * Compatível com o padrão usado no backend para evitar duplicações
 */

/**
 * Verifica se um número é um ID de grupo do WhatsApp
 * @param phone Número ou ID a verificar
 * @returns true se for um ID de grupo
 */
export function isGroupId(phone: string): boolean {
  if (!phone) return false;
  
  // Grupos têm o sufixo @g.us ou começam com 120 e têm pelo menos 18 dígitos
  return phone.endsWith('@g.us') || 
    (phone.startsWith('120') && phone.replace(/\D/g, '').length >= 18);
}

/**
 * Remove todos os caracteres não numéricos de uma string
 * @param input String de entrada
 * @returns String contendo apenas dígitos
 */
export function stripNonDigits(input: string): string {
  if (!input) return '';
  return input.replace(/\D/g, '');
}

/**
 * Normaliza um número de telefone ou ID de grupo para um formato padrão
 * Compatível com a normalização usada no backend
 * 
 * @param phone Número de telefone ou ID de grupo
 * @returns Número normalizado
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const digits = stripNonDigits(phone);
  
  // Para grupos, apenas retornar os dígitos (sem adicionar prefixo)
  if (isGroupId(phone)) {
    return digits;
  }
  
  // Para números individuais, aplicar formato E.164 BR se necessário
  // Números brasileiros: 10 ou 11 dígitos (DDD + número)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  
  // Se já tiver código do país ou outro formato, retornar como está
  return digits;
}

/**
 * Formata um número de telefone para exibição
 * @param phone Número de telefone
 * @returns Número formatado para exibição
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  // Se for um grupo, exibir como está
  if (isGroupId(phone)) {
    return phone.endsWith('@g.us') ? 'Grupo' : 'Grupo';
  }
  
  const digits = stripNonDigits(phone);
  
  // Formato brasileiro: (XX) XXXXX-XXXX
  if (digits.length === 11) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  }
  
  // Formato brasileiro sem 9: (XX) XXXX-XXXX
  if (digits.length === 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  
  // Formato internacional com código de país
  if (digits.length > 11) {
    const countryCode = digits.substring(0, digits.length - 10);
    const number = digits.substring(digits.length - 10);
    return `+${countryCode} ${number.substring(0, 2)} ${number.substring(2, 6)}-${number.substring(6)}`;
  }
  
  // Fallback: retornar como está
  return phone;
}

/**
 * Resolve um ID de chat para WhatsApp a partir de um número ou ID de grupo
 * @param phone Número de telefone ou ID de grupo
 * @returns ID de chat formatado (com @c.us ou @g.us)
 */
export function resolveChatId(phone: string): string {
  if (!phone) return '';
  
  // Se já tiver sufixo @c.us ou @g.us, retornar como está
  if (phone.endsWith('@c.us') || phone.endsWith('@g.us')) {
    return phone;
  }
  
  // Normalizar o número/ID
  const normalizedPhone = normalizePhone(phone);
  
  // Adicionar sufixo apropriado
  if (isGroupId(phone)) {
    return `${normalizedPhone}@g.us`;
  }
  
  // Para números individuais
  return `${normalizedPhone}@c.us`;
}
