import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Eye, Trash2 } from 'lucide-react';

interface RecordsTableProps {
  moduleSlug: string;
  title?: string;
  description?: string;
}

interface Record {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

const RecordsTable: React.FC<RecordsTableProps> = ({
  moduleSlug,
  title = 'Registros',
  description = 'Gerencie seus registros'
}) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Simulação de carregamento de dados
    const loadData = async () => {
      setLoading(true);
      try {
        // Em uma implementação real, faria uma chamada API aqui
        // const response = await api.get(`/modules/${moduleSlug}/records`);
        // setRecords(response.data);
        
        // Dados de exemplo para demonstração
        setTimeout(() => {
          const mockData: Record[] = Array.from({ length: 5 }, (_, i) => ({
            id: `${moduleSlug}-${i + 1}`,
            name: `Registro ${i + 1} de ${moduleSlug}`,
            createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
            status: ['ativo', 'pendente', 'concluído'][Math.floor(Math.random() * 3)],
            value: Math.floor(Math.random() * 10000) / 100
          }));
          
          setRecords(mockData);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error(`Erro ao carregar registros do módulo ${moduleSlug}:`, error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [moduleSlug]);
  
  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Atualizado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Carregando registros...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>{record.status}</TableCell>
                      <TableCell>R$ {record.value?.toFixed(2)}</TableCell>
                      <TableCell>{new Date(record.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{new Date(record.updatedAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecordsTable;
