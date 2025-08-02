import { get, post, put, del } from './api';

// Exemplos de funções específicas para diferentes domínios da aplicação

// 📞 EXEMPLO: Serviço de Mensagens
export const sendMessage = async (data: {
  phone: string;
  message: string;
  sender: string;
}) => {
  // Exemplo de chamada:
  // await sendMessage({
  //   phone: "11999999999",
  //   message: "Olá, tudo bem?",
  //   sender: "Operador01"
  // });
  return await post('/messages/send', data);
};

// 🎓 EXEMPLO: Serviço de Treinamentos
export const createTraining = async (data: {
  name: string;
  description: string;
  instructor: string;
  duration: number;
  lessons: Array<{
    title: string;
    videoUrl: string;
    description: string;
  }>;
}) => {
  // Exemplo de chamada:
  // await createTraining({
  //   name: "Curso de React",
  //   description: "Aprenda React do zero",
  //   instructor: "João Silva",
  //   duration: 120,
  //   lessons: [
  //     {
  //       title: "Introdução ao React",
  //       videoUrl: "https://youtube.com/watch?v=abc123",
  //       description: "Conceitos básicos"
  //     }
  //   ]
  // });
  return await post('/trainings', data);
};

export const getTrainings = async () => {
  // Exemplo de chamada:
  // const trainings = await getTrainings();
  return await get('/trainings');
};

export const updateTraining = async (id: string, data: Partial<{
  name: string;
  description: string;
  instructor: string;
  duration: number;
}>) => {
  // Exemplo de chamada:
  // await updateTraining('123', {
  //   name: "Curso de React Avançado",
  //   duration: 180
  // });
  return await put(`/trainings/${id}`, data);
};

export const deleteTraining = async (id: string) => {
  // Exemplo de chamada:
  // await deleteTraining('123');
  return await del(`/trainings/${id}`);
};

// 👥 EXEMPLO: Serviço de Usuários
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  // Exemplo de chamada:
  // const users = await getUsers({ page: 1, limit: 10, search: "João" });
  return await get('/users', params);
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'manager';
  department?: string;
}) => {
  // Exemplo de chamada:
  // await createUser({
  //   name: "Maria Silva",
  //   email: "maria@empresa.com",
  //   password: "senha123",
  //   role: "user",
  //   department: "Vendas"
  // });
  return await post('/users', data);
};

// 📊 EXEMPLO: Serviço de Relatórios
export const getReport = async (type: string, filters?: {
  startDate?: string;
  endDate?: string;
  department?: string;
  userId?: string;
}) => {
  // Exemplo de chamada:
  // const report = await getReport('sales', {
  //   startDate: "2024-01-01",
  //   endDate: "2024-01-31",
  //   department: "Vendas"
  // });
  return await get(`/reports/${type}`, filters);
};

// 📋 EXEMPLO: Serviço de Contratos
export const createContract = async (data: {
  clientName: string;
  contractType: 'agenciamento' | 'super-fotos' | 'comprometimento';
  startDate: string;
  endDate: string;
  value: number;
  details: Record<string, any>;
}) => {
  // Exemplo de chamada:
  // await createContract({
  //   clientName: "Ana Clara",
  //   contractType: "agenciamento",
  //   startDate: "2024-02-01",
  //   endDate: "2024-12-31",
  //   value: 5000,
  //   details: {
  //     percentage: 20,
  //     exclusivity: true
  //   }
  // });
  return await post('/contracts', data);
};

export const getContracts = async (filters?: {
  status?: 'active' | 'expired' | 'cancelled';
  type?: string;
  clientName?: string;
}) => {
  // Exemplo de chamada:
  // const contracts = await getContracts({ status: 'active', type: 'agenciamento' });
  return await get('/contracts', filters);
};

// 🏢 EXEMPLO: Serviço de CRM
export const createLead = async (data: {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  notes?: string;
}) => {
  // Exemplo de chamada:
  // await createLead({
  //   name: "Pedro Santos",
  //   email: "pedro@email.com",
  //   phone: "11988887777",
  //   source: "Website",
  //   status: "new",
  //   notes: "Interessado em agenciamento"
  // });
  return await post('/leads', data);
};

export const updateLeadStatus = async (id: string, status: string) => {
  // Exemplo de chamada:
  // await updateLeadStatus('123', 'qualified');
  return await put(`/leads/${id}/status`, { status });
};