/**
 * Scheduling Page
 * Kanban board for lead scheduling management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { KanbanBoard } from '../../components/scheduling/KanbanBoard';
import { DashboardMetrics } from '../../components/scheduling/DashboardMetrics';
import type { KanbanData, OperatorDashboard, OperatorLeadKanban } from '../../types/scheduling';
import { getKanbanData, getDashboardMetrics } from '../../services/scheduling-api';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import '../../styles/kanban.css';

export default function SchedulingPage() {
  const { user } = useUser();
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    columns: [],
    totalLeads: 0,
  });
  const [dashboard, setDashboard] = useState<OperatorDashboard>({
    scheduledToday: 0,
    scheduledWeek: 0,
    scheduledMonth: 0,
    pendingToday: 0,
    pendingWeek: 0,
    pendingMonth: 0,
    totalLeads: 0,
    totalNew: 0,
    totalScheduled: 0,
    totalPending: 0,
  });
  const [isLoadingKanban, setIsLoadingKanban] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emailOperator = user?.emailAddresses?.[0]?.emailAddress || '';

  // Fetch Kanban data (memoized with useCallback)
  const fetchKanbanData = useCallback(async () => {
    if (!emailOperator) {
      setError('Usuário não autenticado ou email não encontrado');
      setIsLoadingKanban(false);
      return;
    }

    try {
      setIsLoadingKanban(true);
      setError(null);
      console.log('📊 [Scheduling Page] Fetching Kanban data for:', emailOperator);
      
      const data = await getKanbanData(emailOperator);
      setKanbanData(data);
      
      console.log('✅ [Scheduling Page] Kanban data loaded:', data.totalLeads, 'leads');
    } catch (err) {
      console.error('❌ [Scheduling Page] Error loading Kanban:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do Kanban');
    } finally {
      setIsLoadingKanban(false);
    }
  }, [emailOperator]);

  // Fetch Dashboard metrics (memoized with useCallback)
  const fetchDashboardData = useCallback(async () => {
    if (!emailOperator) {
      setIsLoadingDashboard(false);
      return;
    }

    try {
      setIsLoadingDashboard(true);
      console.log('📈 [Scheduling Page] Fetching dashboard metrics for:', emailOperator);
      
      const data = await getDashboardMetrics(emailOperator);
      setDashboard(data);
      
      console.log('✅ [Scheduling Page] Dashboard loaded');
    } catch (err) {
      console.error('❌ [Scheduling Page] Error loading dashboard:', err);
      // Don't set error for dashboard - it's not critical
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [emailOperator]);

  // Initial load
  useEffect(() => {
    if (emailOperator) {
      fetchKanbanData();
      fetchDashboardData();
    }
  }, [emailOperator, fetchKanbanData, fetchDashboardData]);

  // Refresh both Kanban and Dashboard
  const handleRefresh = () => {
    console.log('🔄 [Scheduling Page] Refreshing data...');
    fetchKanbanData();
    fetchDashboardData();
  };

  // Handle card click (future: open detail modal)
  const handleCardClick = (lead: OperatorLeadKanban) => {
    console.log('🔍 [Scheduling Page] Card clicked:', lead.nameLead, lead.id);
    // TODO: Open detail modal or navigate to lead details
  };

  // Error state
  if (error && !isLoadingKanban) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard Metrics */}
      <DashboardMetrics dashboard={dashboard} isLoading={isLoadingDashboard} />

      {/* Kanban Board */}
      <KanbanBoard 
        kanbanData={kanbanData} 
        isLoading={isLoadingKanban}
        onCardClick={handleCardClick}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

