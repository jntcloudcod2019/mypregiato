/**
 * Scheduling API Service
 * Handles API calls for Kanban board and dashboard metrics
 */

import axios from 'axios';
import type { 
  KanbanApiResponse, 
  DashboardApiResponse,
  KanbanData,
  OperatorDashboard,
  PaginatedKanbanData,
  ColumnPaginationState
} from '../types/scheduling';

interface PaginatedKanbanApiResponse {
  success: boolean;
  data: PaginatedKanbanData;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pregiato-api-production.up.railway.app/api';

// Create axios instance with default config
const schedulingApiClient = axios.create({
  baseURL: `${API_BASE_URL}/operator-leads`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Gets Kanban board data for an operator
 * @param emailOperator - Operator's email
 * @returns Kanban data with leads grouped by status
 */
export const getKanbanData = async (emailOperator: string): Promise<KanbanData> => {
  try {
    console.log(`📊 [Scheduling API] Fetching Kanban data for: ${emailOperator}`);
    
    const response = await schedulingApiClient.get<KanbanApiResponse>(`/kanban/${encodeURIComponent(emailOperator)}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch Kanban data');
    }
    
    console.log(`✅ [Scheduling API] Kanban data retrieved successfully:`, {
      totalLeads: response.data.data.totalLeads,
      columns: response.data.data.columns.length
    });
    
    return response.data.data;
  } catch (error) {
    console.error('❌ [Scheduling API] Error fetching Kanban data:', error);
    
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Network error fetching Kanban data');
    }
    
    throw error;
  }
};

/**
 * Gets dashboard metrics for an operator
 * @param emailOperator - Operator's email
 * @returns Dashboard metrics with scheduled and pending counts
 */
export const getDashboardMetrics = async (emailOperator: string): Promise<OperatorDashboard> => {
  try {
    console.log(`📈 [Scheduling API] Fetching dashboard metrics for: ${emailOperator}`);
    
    const response = await schedulingApiClient.get<DashboardApiResponse>(`/dashboard/${encodeURIComponent(emailOperator)}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch dashboard metrics');
    }
    
    console.log(`✅ [Scheduling API] Dashboard metrics retrieved successfully:`, {
      totalLeads: response.data.data.totalLeads,
      scheduledToday: response.data.data.scheduledToday,
      pendingToday: response.data.data.pendingToday
    });
    
    return response.data.data;
  } catch (error) {
    console.error('❌ [Scheduling API] Error fetching dashboard metrics:', error);
    
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Network error fetching dashboard metrics');
    }
    
    throw error;
  }
};

/**
 * Gets paginated Kanban board data for an operator
 * Supports independent pagination for each column
 * @param emailOperator - Operator's email
 * @param columnPagination - Pagination state for each column
 * @returns Paginated Kanban data
 */
export const getPaginatedKanbanData = async (
  emailOperator: string,
  columnPagination: ColumnPaginationState
): Promise<PaginatedKanbanData> => {
  try {
    console.log(`📊 [Scheduling API] Fetching paginated Kanban data for: ${emailOperator}`, columnPagination);
    
    const params = {
      newPage: columnPagination.new.page,
      newPageSize: columnPagination.new.pageSize,
      scheduledPage: columnPagination.scheduled.page,
      scheduledPageSize: columnPagination.scheduled.pageSize,
      pendingPage: columnPagination.pending.page,
      pendingPageSize: columnPagination.pending.pageSize,
    };
    
    const response = await schedulingApiClient.get<PaginatedKanbanApiResponse>(
      `/kanban/paginated/${encodeURIComponent(emailOperator)}`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch paginated Kanban data');
    }
    
    console.log(`✅ [Scheduling API] Paginated Kanban data retrieved:`, {
      totalLeads: response.data.data.totalLeads,
      columns: response.data.data.columns.map(c => ({
        status: c.status,
        totalCount: c.totalCount,
        currentPage: c.currentPage,
        totalPages: c.totalPages
      }))
    });
    
    return response.data.data;
  } catch (error) {
    console.error('❌ [Scheduling API] Error fetching paginated Kanban data:', error);
    
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Network error fetching paginated Kanban data');
    }
    
    throw error;
  }
};

/**
 * Refreshes Kanban data (convenience wrapper)
 */
export const refreshKanban = async (emailOperator: string): Promise<KanbanData> => {
  console.log(`🔄 [Scheduling API] Refreshing Kanban for: ${emailOperator}`);
  return getKanbanData(emailOperator);
};

export default {
  getKanbanData,
  getDashboardMetrics,
  getPaginatedKanbanData,
  refreshKanban,
};

