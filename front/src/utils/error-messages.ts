// Utilitário para traduzir mensagens de erro da API para mensagens amigáveis
export function translateApiError(error: any): string {
  // Se já é uma mensagem amigável, retorna como está
  if (typeof error === 'string' && !error.includes('Request failed') && !error.includes('status code')) {
    return error;
  }

  // Extrair informações do erro
  const status = error?.response?.status;
  const data = error?.response?.data;
  const message = error?.message;

  // Mapear códigos de status para mensagens amigáveis
  const statusMessages: Record<number, string> = {
    400: 'Dados inválidos enviados. Verifique as informações e tente novamente.',
    401: 'Acesso não autorizado. Faça login novamente.',
    403: 'Acesso negado. Você não tem permissão para esta ação.',
    404: 'Recurso não encontrado.',
    409: 'Conflito de dados. O registro já existe.',
    422: 'Dados inválidos. Verifique os campos obrigatórios.',
    500: 'Erro interno do servidor. Tente novamente mais tarde.',
    502: 'Servidor temporariamente indisponível.',
    503: 'Serviço temporariamente indisponível.',
    504: 'Tempo limite excedido. Tente novamente.'
  };

  // Se temos um código de status conhecido, usar a mensagem mapeada
  if (status && statusMessages[status]) {
    return statusMessages[status];
  }

  // Verificar se há erros de validação específicos
  if (data?.errors) {
    const validationErrors = data.errors;
    
    // Tratar erros de validação específicos
    if (validationErrors.items) {
      return 'Lista de itens é obrigatória. Verifique se o arquivo contém dados válidos.';
    }
    
    if (validationErrors['$[0].phone']) {
      return 'Formato de telefone inválido. Use apenas números e caracteres especiais como parênteses, hífens ou espaços.';
    }
    
    if (validationErrors['$[0].email']) {
      return 'Formato de e-mail inválido. Verifique se o e-mail está correto.';
    }
    
    if (validationErrors['$[0].name']) {
      return 'Nome é obrigatório. Verifique se todos os registros possuem nome.';
    }
    
    // Se há outros erros de validação, retornar o primeiro
    const firstError = Object.values(validationErrors)[0];
    if (Array.isArray(firstError) && firstError.length > 0) {
      return String(firstError[0]);
    }
  }

  // Verificar se há uma mensagem específica no erro
  if (data?.message) {
    return data.message;
  }

  // Se é um erro de rede
  if (message?.includes('Network Error') || message?.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Se é um erro de timeout
  if (message?.includes('timeout')) {
    return 'Tempo limite excedido. Tente novamente.';
  }

  // Se é um erro genérico de requisição
  if (message?.includes('Request failed')) {
    return 'Falha na comunicação com o servidor. Tente novamente.';
  }

  // Mensagem padrão para erros desconhecidos
  return 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.';
}

// Função para extrair detalhes específicos de erros de importação
export function extractImportErrors(error: any): string[] {
  const errors: string[] = [];
  
  if (error?.response?.data?.errors) {
    const validationErrors = error.response.data.errors;
    
    // Processar erros de validação
    Object.entries(validationErrors).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        messages.forEach((msg: string) => {
          errors.push(`${field}: ${msg}`);
        });
      } else if (typeof messages === 'string') {
        errors.push(`${field}: ${messages}`);
      }
    });
  }
  
  if (error?.response?.data?.message) {
    errors.push(error.response.data.message);
  }
  
  if (errors.length === 0) {
    errors.push(translateApiError(error));
  }
  
  return errors;
}
