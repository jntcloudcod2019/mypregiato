import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ListChecks, KanbanSquare, CalendarDays, Users, ClipboardList, FileText, Settings } from 'lucide-react';
import LeadsPage from '@/pages/crm/leads';
import LeadsKanban from '@/pages/crm/leads/kanban';
import TarefasPage from '@/pages/crm/tarefas';
import EventosPage from '@/pages/crm/eventos';

type ViewKey = 'tarefas' | 'leads-lista' | 'leads-kanban' | 'eventos';

export default function CRMWorkspace() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<ViewKey>(() => {
    try { return (localStorage.getItem('crm.active') as ViewKey) || 'tarefas'; } catch { return 'tarefas'; }
  });

  useEffect(() => { try { localStorage.setItem('crm.active', active); } catch {} }, [active]);

  const SideLink = ({ k, icon, label }: { k: ViewKey; icon: React.ReactNode; label: string }) => (
    <button
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${active===k? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
      onClick={() => setActive(k)}
    >
      <span className="h-4 w-4">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="p-4 md:p-6 grid grid-cols-12 gap-4">
      {/* Sidebar */}
      <div className="col-span-12 md:col-span-3 lg:col-span-2">
        <div className="sticky top-4 space-y-3">
          <div className="text-xl font-semibold">Central CRM</div>
          <SideLink k="tarefas" icon={<ClipboardList className="h-4 w-4" />} label="Tarefas" />
          <SideLink k="leads-lista" icon={<Users className="h-4 w-4" />} label="Leads (lista)" />
          <SideLink k="leads-kanban" icon={<KanbanSquare className="h-4 w-4" />} label="Leads (Kanban)" />
          <SideLink k="eventos" icon={<CalendarDays className="h-4 w-4" />} label="Eventos/Seletivas" />
          <Separator className="my-2" />
          <Link to="/contratos" className="block text-sm text-muted-foreground hover:text-foreground">Contratos</Link>
          <Link to="/crm/relatorios" className="block text-sm text-muted-foreground hover:text-foreground">Relatórios</Link>
          <Link to="/crm/configuracoes" className="block text-sm text-muted-foreground hover:text-foreground">Configurações</Link>
        </div>
      </div>

      {/* Main */}
      <div className="col-span-12 md:col-span-9 lg:col-span-10 space-y-3">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-between">
          <div />
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-[340px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar em CRM..." value={query} onChange={(e)=>setQuery(e.target.value)} />
            </div>
            <Button className="gap-2" onClick={() => {
              if (active==='tarefas') navigate('/crm/tarefas/nova');
              if (active==='leads-lista' || active==='leads-kanban') navigate('/crm/leads/novo');
            }}>
              <Plus className="h-4 w-4" /> Novo
            </Button>
          </div>
        </div>

        {/* Content views */}
        <div className="mt-2">
          {active==='tarefas' && <TarefasPage />}
          {active==='leads-lista' && <LeadsPage />}
          {active==='leads-kanban' && <LeadsKanban />}
          {active==='eventos' && <EventosPage />}
        </div>
      </div>
    </div>
  );
}


