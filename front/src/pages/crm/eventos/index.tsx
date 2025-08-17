import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Plus, Edit, Eye, Trash2, QrCode, Users } from 'lucide-react';

// Dados de exemplo
const eventos = [
  {
    id: '1',
    nome: 'Seletiva Verão 2024',
    data: '2024-01-15',
    local: 'Studio Central',
    status: 'agendado',
    vagas: 30,
    inscritos: 18
  },
  {
    id: '2',
    nome: 'Workshop de Fotografia',
    data: '2024-01-22',
    local: 'Estúdio Luz & Arte',
    status: 'agendado',
    vagas: 15,
    inscritos: 15
  },
  {
    id: '3',
    nome: 'Seletiva Inverno 2023',
    data: '2023-06-10',
    local: 'Studio Central',
    status: 'finalizado',
    vagas: 25,
    inscritos: 22
  }
];

export default function EventosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredEventos = eventos.filter(evento => 
    evento.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evento.local.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendado':
        return <Badge className="bg-blue-500">Agendado</Badge>;
      case 'em_andamento':
        return <Badge className="bg-green-500">Em Andamento</Badge>;
      case 'finalizado':
        return <Badge className="bg-gray-500">Finalizado</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-500">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Eventos e Seletivas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie eventos, seletivas e workshops
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos</CardTitle>
          <CardDescription>
            Total de {filteredEventos.length} eventos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inscritos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEventos.map((evento) => (
                  <TableRow key={evento.id}>
                    <TableCell className="font-medium">{evento.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(evento.data).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>{evento.local}</TableCell>
                    <TableCell>{getStatusBadge(evento.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {evento.inscritos}/{evento.vagas}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="QR Code de Inscrição">
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
