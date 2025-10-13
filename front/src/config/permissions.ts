/**
 * Sistema de Permissões e Controle de Acesso
 * Define todas as roles e suas permissões no sistema
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  OPERATOR = 'OPERATOR',
  PRODUCER = 'PRODUCER',
  MODEL = 'MODEL',
  STUDENT = 'STUDENT',
  USER = 'USER',
}

export enum Permission {
  // Dashboard
  VIEW_DASHBOARD = 'view_dashboard',
  
  // CRM
  VIEW_CRM = 'view_crm',
  CREATE_LEAD = 'create_lead',
  EDIT_LEAD = 'edit_lead',
  DELETE_LEAD = 'delete_lead',
  ASSIGN_LEAD = 'assign_lead',
  
  // Atendimento
  VIEW_ATTENDANCE = 'view_attendance',
  MANAGE_CHATS = 'manage_chats',
  
  // Talentos
  VIEW_TALENTS = 'view_talents',
  CREATE_TALENT = 'create_talent',
  EDIT_TALENT = 'edit_talent',
  DELETE_TALENT = 'delete_talent',
  
  // Contratos
  VIEW_CONTRACTS = 'view_contracts',
  CREATE_CONTRACT = 'create_contract',
  EDIT_CONTRACT = 'edit_contract',
  DELETE_CONTRACT = 'delete_contract',
  
  // Treinamentos
  VIEW_TRAININGS = 'view_trainings',
  CREATE_TRAINING = 'create_training',
  EDIT_TRAINING = 'edit_training',
  DELETE_TRAINING = 'delete_training',
  MANAGE_TRAININGS = 'manage_trainings',
  ENROLL_TRAINING = 'enroll_training',
  
  // Finanças
  VIEW_FINANCES = 'view_finances',
  MANAGE_FINANCES = 'manage_finances',
  
  // Usuários
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  
  // Ponto Eletrônico
  VIEW_TIMESHEET = 'view_timesheet',
  MANAGE_TIMESHEET = 'manage_timesheet',
  
  // Configurações
  VIEW_SETTINGS = 'view_settings',
  MANAGE_SETTINGS = 'manage_settings',
}

/**
 * Mapa de permissões por role
 * Define o que cada tipo de usuário pode fazer no sistema
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin tem acesso total
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_CRM,
    Permission.CREATE_LEAD,
    Permission.EDIT_LEAD,
    Permission.DELETE_LEAD,
    Permission.ASSIGN_LEAD,
    Permission.VIEW_ATTENDANCE,
    Permission.MANAGE_CHATS,
    Permission.VIEW_TALENTS,
    Permission.CREATE_TALENT,
    Permission.EDIT_TALENT,
    Permission.DELETE_TALENT,
    Permission.VIEW_CONTRACTS,
    Permission.CREATE_CONTRACT,
    Permission.EDIT_CONTRACT,
    Permission.DELETE_CONTRACT,
    Permission.VIEW_TRAININGS,
    Permission.CREATE_TRAINING,
    Permission.EDIT_TRAINING,
    Permission.DELETE_TRAINING,
    Permission.MANAGE_TRAININGS,
    Permission.ENROLL_TRAINING,
    Permission.VIEW_FINANCES,
    Permission.MANAGE_FINANCES,
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    Permission.VIEW_TIMESHEET,
    Permission.MANAGE_TIMESHEET,
    Permission.VIEW_SETTINGS,
    Permission.MANAGE_SETTINGS,
  ],

  [UserRole.INSTRUCTOR]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_CRM,
    Permission.CREATE_LEAD,
    Permission.EDIT_LEAD,
    Permission.VIEW_ATTENDANCE,
    Permission.MANAGE_CHATS,
    Permission.VIEW_TALENTS,
    Permission.CREATE_TALENT,
    Permission.EDIT_TALENT,
    Permission.VIEW_CONTRACTS,
    Permission.VIEW_TRAININGS,
    Permission.CREATE_TRAINING,
    Permission.EDIT_TRAINING,
    Permission.DELETE_TRAINING,
    Permission.MANAGE_TRAININGS,
    Permission.ENROLL_TRAINING,
    Permission.VIEW_TIMESHEET,
    Permission.VIEW_SETTINGS,
  ],

  [UserRole.OPERATOR]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_CRM,
    Permission.CREATE_LEAD,
    Permission.EDIT_LEAD,
    Permission.VIEW_ATTENDANCE,
    Permission.MANAGE_CHATS,
    Permission.VIEW_TALENTS,
    Permission.VIEW_TRAININGS,
    Permission.ENROLL_TRAINING,
    Permission.VIEW_TIMESHEET,
  ],

  [UserRole.PRODUCER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_TALENTS,
    Permission.CREATE_TALENT,
    Permission.EDIT_TALENT,
    Permission.VIEW_CONTRACTS,
    Permission.VIEW_TRAININGS,
    Permission.ENROLL_TRAINING,
    Permission.VIEW_TIMESHEET,
  ],

  [UserRole.MODEL]: [
    // Model só pode ver treinamentos
    Permission.VIEW_TRAININGS,
    Permission.ENROLL_TRAINING,
  ],

  [UserRole.STUDENT]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_TRAININGS,
    Permission.ENROLL_TRAINING,
    Permission.VIEW_TIMESHEET,
  ],

  [UserRole.USER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_TRAININGS,
    Permission.ENROLL_TRAINING,
  ],
};

/**
 * Verifica se uma role tem uma permissão específica
 */
export function hasPermission(role: UserRole | string, permission: Permission): boolean {
  const userRole = role as UserRole;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Verifica se uma role tem todas as permissões especificadas
 */
export function hasAllPermissions(role: UserRole | string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Verifica se uma role tem pelo menos uma das permissões especificadas
 */
export function hasAnyPermission(role: UserRole | string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Mapeamento de rotas protegidas e suas permissões necessárias
 */
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/dashboard': [Permission.VIEW_DASHBOARD],
  '/crm': [Permission.VIEW_CRM],
  '/crm/leads': [Permission.VIEW_CRM],
  '/crm/leads/novo': [Permission.CREATE_LEAD],
  '/atendimento': [Permission.VIEW_ATTENDANCE],
  '/talentos': [Permission.VIEW_TALENTS],
  '/talentos/novo': [Permission.CREATE_TALENT],
  '/contratos': [Permission.VIEW_CONTRACTS],
  '/treinamentos': [Permission.VIEW_TRAININGS],
  '/treinamentos/criar': [Permission.CREATE_TRAINING],
  '/treinamentos/gerenciar': [Permission.MANAGE_TRAININGS],
  '/treinamentos/editar': [Permission.EDIT_TRAINING],
  '/financas': [Permission.VIEW_FINANCES],
  '/usuarios': [Permission.VIEW_USERS],
  '/ponto': [Permission.VIEW_TIMESHEET],
  '/configuracoes': [Permission.VIEW_SETTINGS],
};

/**
 * Verifica se o usuário tem permissão para acessar uma rota
 */
export function canAccessRoute(role: UserRole | string, route: string): boolean {
  // Encontrar a rota mais específica que corresponde
  const matchingRoute = Object.keys(ROUTE_PERMISSIONS)
    .filter(r => route.startsWith(r))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchingRoute) {
    return true; // Se não há restrição definida, permite acesso
  }

  const requiredPermissions = ROUTE_PERMISSIONS[matchingRoute];
  return hasAnyPermission(role, requiredPermissions);
}

