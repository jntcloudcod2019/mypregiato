/**
 * DashboardMetrics Component
 * Displays metrics cards for scheduled and pending leads
 */

import React from 'react';
import type { DashboardMetricsProps } from '../../types/scheduling';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CalendarCheckIcon, ClockIcon, TrendingUpIcon, AlertCircleIcon } from 'lucide-react';

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ dashboard, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Agendados Hoje',
      value: dashboard.scheduledToday,
      icon: CalendarCheckIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Agendados (Semana)',
      value: dashboard.scheduledWeek,
      icon: TrendingUpIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pendentes Hoje',
      value: dashboard.pendingToday,
      icon: AlertCircleIcon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Pendentes (Semana)',
      value: dashboard.pendingWeek,
      icon: ClockIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {index < 2 ? 'leads agendados' : 'leads pendentes'}
              </p>
            </CardContent>
          </Card>
        );
      })}

      {/* Summary Card */}
      <Card className="col-span-full lg:col-span-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <TrendingUpIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Resumo Geral</h3>
                <p className="text-sm text-gray-600">Visão completa dos seus leads</p>
              </div>
            </div>
            
            <div className="flex gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{dashboard.totalNew}</p>
                <p className="text-xs text-gray-600">Novos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dashboard.totalScheduled}</p>
                <p className="text-xs text-gray-600">Agendados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{dashboard.totalPending}</p>
                <p className="text-xs text-gray-600">Pendentes</p>
              </div>
              <div className="text-center border-l-2 border-gray-300 pl-6">
                <p className="text-3xl font-bold text-purple-600">{dashboard.totalLeads}</p>
                <p className="text-xs text-gray-600 font-semibold">TOTAL</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

