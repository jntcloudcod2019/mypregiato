export interface Module {
  title: string;
  slug: string;
  description: string;
  features: string[];
  icon?: string;
  color?: string;
}

export const modules: Module[] = [
  {
    title: "CRM",
    slug: "crm",
    description: "Gestão de leads, contatos e oportunidades de negócio",
    features: [
      "Cadastro de leads e contatos",
      "Pipeline de vendas com Kanban",
      "Automação de marketing",
      "Relatórios e dashboards",
      "Integração com WhatsApp"
    ],
    color: "bg-blue-500"
  },
  {
    title: "Contratos",
    slug: "contratos",
    description: "Gestão de contratos e documentos",
    features: [
      "Modelos de contratos",
      "Assinatura digital",
      "Gestão de versões",
      "Notificações automáticas",
      "Relatórios de contratos"
    ],
    color: "bg-green-500"
  },
  {
    title: "Financeiro",
    slug: "financeiro",
    description: "Gestão financeira e faturamento",
    features: [
      "Controle de receitas e despesas",
      "Emissão de notas fiscais",
      "Controle de pagamentos",
      "Relatórios financeiros",
      "Integração bancária"
    ],
    color: "bg-yellow-500"
  },
  {
    title: "Talentos",
    slug: "talentos",
    description: "Gestão de talentos e modelos",
    features: [
      "Cadastro de talentos",
      "Portfólio digital",
      "Agendamento de trabalhos",
      "Avaliação de desempenho",
      "Pagamentos e comissões"
    ],
    color: "bg-purple-500"
  },
  {
    title: "Eventos",
    slug: "eventos",
    description: "Gestão de eventos e seletivas",
    features: [
      "Cadastro de eventos",
      "Gestão de inscrições",
      "Check-in digital",
      "Formulários personalizados",
      "Relatórios de eventos"
    ],
    color: "bg-pink-500"
  },
  {
    title: "Treinamentos",
    slug: "treinamentos",
    description: "Plataforma de cursos e treinamentos",
    features: [
      "Criação de cursos",
      "Vídeos e materiais",
      "Avaliações e certificados",
      "Progresso dos alunos",
      "Relatórios de desempenho"
    ],
    color: "bg-indigo-500"
  }
];
