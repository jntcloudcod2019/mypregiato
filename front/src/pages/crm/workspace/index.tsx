import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Kanban,
  ListTodo,
  FileUp
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

export default function CRMWorkspace() {
  const location = useLocation();
  const [activeItem, setActiveItem] = useState<string>('');
  
  // Recuperar o item ativo do localStorage ao iniciar
  useEffect(() => {
    const savedItem = localStorage.getItem('crm.activeItem');
    if (savedItem) {
      setActiveItem(savedItem);
    } else {
      // Definir com base na URL atual
      const path = location.pathname.split('/').pop() || '';
      setActiveItem(path || 'dashboard');
    }
  }, [location]);
  
  // Salvar o item ativo no localStorage quando mudar
  useEffect(() => {
    if (activeItem) {
      localStorage.setItem('crm.activeItem', activeItem);
    }
  }, [activeItem]);
  
  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/crm' },
    { label: 'Tarefas', icon: <ListTodo className="h-5 w-5" />, path: '/crm/tarefas' },
    { label: 'Leads (lista)', icon: <Users className="h-5 w-5" />, path: '/crm/leads' },
    { label: 'Leads (Kanban)', icon: <Kanban className="h-5 w-5" />, path: '/crm/leads/kanban' },
    { label: 'Eventos/Seletivas', icon: <Calendar className="h-5 w-5" />, path: '/crm/eventos' },
    { label: 'Contratos', icon: <FileText className="h-5 w-5" />, path: '/crm/contratos' },
    { label: 'Relatórios', icon: <BarChart3 className="h-5 w-5" />, path: '/crm/relatorios' },
    { label: 'Importar Dados', icon: <FileUp className="h-5 w-5" />, path: '/crm/importar' },
    { label: 'Configurações', icon: <Settings className="h-5 w-5" />, path: '/crm/configuracoes' }
  ];
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card/50 p-4 hidden md:block">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => setActiveItem(item.path.split('/').pop() || '')}
            >
              <Button
                variant={location.pathname === item.path ? "default" : "ghost"}
                className="w-full justify-start gap-2"
              >
                {item.icon}
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden p-2 border-b w-full">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => setActiveItem(item.path.split('/').pop() || '')}
            >
              <Button
                variant={location.pathname === item.path ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
