/**
 * Utilitário para normalizar respostas da API
 * Converte todas as chaves de objetos para maiúsculo
 */

// Função para normalizar uma chave para maiúsculo
const normalizeKey = (key: string): string => {
  return key.charAt(0).toUpperCase() + key.slice(1);
};

// Função para normalizar um valor (recursiva)
const normalizeValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }
  
  if (typeof value === 'object') {
    const normalized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const normalizedKey = normalizeKey(key);
      normalized[normalizedKey] = normalizeValue(val);
    }
    return normalized;
  }
  
  return value;
};

/**
 * Normaliza uma resposta da API convertendo todas as chaves para maiúsculo
 * @param data - Dados retornados pela API
 * @returns Dados normalizados com chaves em maiúsculo
 */
export const normalizeApiResponse = <T>(data: unknown): T => {
  return normalizeValue(data) as T;
};

/**
 * Normaliza um array de respostas da API
 * @param data - Array de dados retornados pela API
 * @returns Array de dados normalizados
 */
export const normalizeApiResponseArray = <T>(data: unknown[]): T[] => {
  return data.map(item => normalizeApiResponse<T>(item));
};

/**
 * Interface para dados normalizados de usuário
 */
export interface NormalizedUserDto {
  Id: string;
  ClerkId: string;
  Email: string;
  FirstName: string;
  LastName: string;
  ImageUrl?: string;
  Role: string;
  CreatedAt: string | Date;
  UpdatedAt: string | Date;
}

/**
 * Interface para dados normalizados de talento
 */
export interface NormalizedTalentDto {
  Id: string;
  ProducerId?: string;
  FullName: string;
  Email?: string;
  Phone?: string;
  Postalcode?: string;
  Street?: string;
  Neighborhood?: string;
  City?: string;
  NumberAddress?: string;
  Complement?: string;
  Uf?: string;
  Document?: string;
  BirthDate?: string | Date;
  Age: number;
  Gender?: string;
  InviteSent: boolean;
  Status: boolean;
  DnaStatus: string;
  InviteToken?: string;
  ClerkInviteId?: string;
  CreatedAt: string | Date;
  UpdatedAt: string | Date;
}
