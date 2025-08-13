export type ModuleDef = {
  slug: string;
  title: string;
  description: string;
  features: string[];
};

export const modules: ModuleDef[] = [
  { slug: 'financeiro', title: 'Financeiro', description: 'Módulo de contabilidade e gestão financeira.', features: [
    'Faturamento e Pagamentos: emissão e controle de faturas, envio por e-mail, recorrentes, registros e alertas',
    'Reconciliação Bancária: importação de extratos, reconciliação automática e regras personalizadas',
    'Configuração de Impostos: regras fiscais e múltiplos impostos (ISS, ICMS, PIS, COFINS, IVA, etc.)'
  ] },
  { slug: 'conhecimento', title: 'Conhecimento', description: 'Gerencie e compartilhe conhecimento interno.', features: [
    'Editor de Artigos: edição avançada, colaboração em tempo real, exportação em PDF e revisões',
    'Gestão de Artigos: organização por lista, kanban, cartões e calendário'
  ] },
  { slug: 'assinatura-documentos', title: 'Assinatura de Documentos', description: 'Assinatura eletrônica integrada.', features: [
    'Fluxos de assinatura, confirmação de pedidos e contratos'
  ] },
  { slug: 'crm', title: 'CRM', description: 'Relacionamento com o cliente.', features: [
    'Oportunidades: funil com drag-and-drop, pontuação de leads, reuniões e próximas ações',
    'Visão 360°: e-mails, reuniões e histórico de compras',
    'Gamificação: metas e medalhas'
  ] },
  { slug: 'estudio', title: 'Estúdio', description: 'Personalize sem código.', features: [
    'Adicionar/alterar campos, visualizações, automações e relatórios PDF',
    'Criação de apps'
  ] },
  { slug: 'assinaturas', title: 'Assinaturas', description: 'Receitas recorrentes e contratos.', features: [
    'Renovações, faturamento automático e métricas de receita recorrente'
  ] },
  { slug: 'locacao', title: 'Locação', description: 'Gerencie aluguel de produtos.', features: [
    'Cotações, pedidos, agenda, faturamento',
    'Retirada/devolução e custos por atraso/margem'
  ] },
  { slug: 'ponto-de-venda', title: 'Ponto de Venda', description: 'PDV para lojas físicas.', features: [
    'Checkout com código de barras/balanças, preços/descontos e pedidos paralelos',
    'Fidelidade: cartões e eWallets'
  ] },
  { slug: 'mensagens', title: 'Mensagens', description: 'Comunicação interna.', features: [
    'Chat interno, anotações e arquivos',
    'Notificações por e-mail e inbox'
  ] },
  { slug: 'documentos', title: 'Documentos', description: 'Gestão de arquivos.', features: [
    'Espaços de trabalho, etiquetas e ciclo de vida'
  ] },
  { slug: 'projeto', title: 'Projeto', description: 'Projetos e tarefas.', features: [
    'Tarefas, estágios, recorrência e subtarefas',
    'Painel com rentabilidade/desempenho'
  ] },
  { slug: 'planilhas-de-horas', title: 'Planilhas de Horas', description: 'Rastreamento e validação de horas.', features: [
    'Cronômetro por projeto/tarefa/pedido',
    'Faturamento por horas'
  ] },
  { slug: 'servico-de-campo', title: 'Serviço de Campo', description: 'Intervenções em campo.', features: [
    'Agendamento, produtos/equipamentos e faturamento de horas'
  ] },
  { slug: 'planejamento', title: 'Planejamento', description: 'Cronograma e recursos.', features: [
    'Turnos manuais/automáticos e alocação de recursos'
  ] },
  { slug: 'central-de-ajuda', title: 'Central de Ajuda', description: 'Suporte com chamados.', features: [
    'Multicanal (e-mail, chat, formulários), atribuição automática e SLAs'
  ] },
  { slug: 'site', title: 'Site', description: 'Sites e e-commerce.', features: [
    'Criação de páginas e loja virtual com checkout/pagamentos'
  ] },
  { slug: 'redes-sociais', title: 'Redes Sociais', description: 'Gerencie redes sociais.', features: [
    'Publicação/agendamento e monitoramento de menções/interações'
  ] },
  { slug: 'marketing-email', title: 'Marketing de E-mail', description: 'Automação de e-mail.', features: [
    'Templates, listas e métricas (abertura/cliques)'
  ] },
  { slug: 'compras', title: 'Compras', description: 'Compras e fornecedores.', features: [
    'Pedidos, variantes, regras e verificação de estoque'
  ] },
  { slug: 'inventario', title: 'Inventário', description: 'Armazém e estoque.', features: [
    'Séries/lotes, validade, locais, reposição e transportadoras'
  ] },
  { slug: 'fabricacao', title: 'Fabricação', description: 'Produção.', features: [
    'Ordens, listas de materiais e etapas de produção'
  ] },
  { slug: 'vendas', title: 'Vendas', description: 'Processo de vendas.', features: [
    'Cotações/pedidos e up/cross-selling'
  ] },
  { slug: 'rh', title: 'RH', description: 'Recursos Humanos.', features: [
    'Folgas, avaliações, recrutamento, frota, e-learning e documentos assinados'
  ] },
  { slug: 'dashboard', title: 'Dashboard', description: 'Painéis e analytics.', features: [
    'Métricas por módulo (projetos, marketing, vendas, etc.)'
  ] }
];


