/**
 * Scheduling Feature - TypeScript Types
 * Kanban Board for Lead Management
 */

export interface SeletivaInfo {
  nomeLead: string;
  codOperator: string;
  dateSeletiva: string;
  localSeletiva: string;
  horarioAgendadoLead: string;
}

export interface OperatorLeadKanban {
  id: string;
  nameLead: string;
  phoneLead: string;
  responsible: string | null;
  age: number | null;
  publicADS: string | null;
  createdAt: string;
  statusContact: boolean;
  dateContact: string | null;
  statusSeletiva: boolean;
  seletivaInfo: SeletivaInfo | null;
  statusContactLabel: string; // "Lead Scheduled" or "Lead Pending"
  kanbanStatus: 'new' | 'scheduled' | 'pending';
}

export interface KanbanColumn {
  status: 'new' | 'scheduled' | 'pending';
  label: string;
  count: number;
  leads: OperatorLeadKanban[];
}

export interface KanbanData {
  columns: KanbanColumn[];
  totalLeads: number;
}

export interface OperatorDashboard {
  scheduledToday: number;
  scheduledWeek: number;
  scheduledMonth: number;
  pendingToday: number;
  pendingWeek: number;
  pendingMonth: number;
  totalLeads: number;
  totalNew: number;
  totalScheduled: number;
  totalPending: number;
}

export interface KanbanCardProps {
  lead: OperatorLeadKanban;
  onCardClick?: (lead: OperatorLeadKanban) => void;
}

export interface KanbanColumnProps {
  column: KanbanColumn;
  onCardClick?: (lead: OperatorLeadKanban) => void;
}

export interface KanbanBoardProps {
  kanbanData: KanbanData;
  isLoading: boolean;
  onCardClick?: (lead: OperatorLeadKanban) => void;
  onRefresh?: () => void;
}

export interface DashboardMetricsProps {
  dashboard: OperatorDashboard;
  isLoading: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface KanbanApiResponse extends ApiResponse<KanbanData> {}
export interface DashboardApiResponse extends ApiResponse<OperatorDashboard> {}

