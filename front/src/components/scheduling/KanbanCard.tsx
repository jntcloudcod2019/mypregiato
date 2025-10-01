/**
 * KanbanCard Component
 * Individual lead card in the Kanban board
 */

import React from 'react';
import type { KanbanCardProps, SeletivaInfo } from '../../types/scheduling';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { CalendarIcon, ClockIcon, MapPinIcon, PhoneIcon, UserIcon } from 'lucide-react';

export const KanbanCard: React.FC<KanbanCardProps> = ({ lead, onCardClick }) => {
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '-';
    return timeString.slice(0, 5); // HH:MM
  };

  const getStatusBadge = (): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string } => {
    if (lead.statusContact) {
      return { variant: 'default', label: 'Lead Agendado' };
    }
    return { variant: 'outline', label: 'Lead Pendente' };
  };

  const parseSeletivaInfo = (): SeletivaInfo | null => {
    if (!lead.seletivaInfo) return null;
    return lead.seletivaInfo;
  };

  const seletivaData = parseSeletivaInfo();
  const statusBadge = getStatusBadge();

  return (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4"
      style={{ 
        borderLeftColor: lead.kanbanStatus === 'new' ? '#3b82f6' : 
                         lead.kanbanStatus === 'scheduled' ? '#10b981' : '#f59e0b' 
      }}
      onClick={() => onCardClick?.(lead)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-lg">{lead.nameLead}</h3>
          </div>
          <Badge variant={statusBadge.variant} className="text-xs">
            {statusBadge.label}
          </Badge>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <PhoneIcon className="w-3.5 h-3.5" />
            <span className="font-mono">{lead.phoneLead}</span>
          </div>

          {lead.age && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-xs">Idade:</span>
              <span>{lead.age} anos</span>
            </div>
          )}

          {lead.responsible && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-xs">Responsável:</span>
              <span>{lead.responsible}</span>
            </div>
          )}

          {lead.publicADS && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-xs">Público:</span>
              <span className="italic">{lead.publicADS}</span>
            </div>
          )}
        </div>

        {/* Seletiva Info (if scheduled) */}
        {lead.statusSeletiva && seletivaData && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
            <h4 className="text-xs font-semibold text-green-800 mb-2">📅 Seletiva Agendada</h4>
            <div className="space-y-1.5 text-xs text-green-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3 h-3" />
                <span>{formatDate(seletivaData.dateSeletiva)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-3 h-3" />
                <span>{formatTime(seletivaData.horarioAgendadoLead)}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPinIcon className="w-3 h-3 mt-0.5" />
                <span className="flex-1">{seletivaData.localSeletiva}</span>
              </div>
              {seletivaData.codOperator && (
                <div className="text-xs text-green-600 mt-1">
                  Operador: {seletivaData.codOperator}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer: Created Date */}
        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
          Criado em: {formatDate(lead.createdAt)}
          {lead.dateContact && (
            <span className="ml-3">• Contato: {formatDate(lead.dateContact)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

