import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, Users, CheckCircle, AlertTriangle, FileDown, Shield, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { ErrorBoundary } from '../../../components/common/error-boundary';
import { LoadingFallback } from '../../../components/ui/loading-fallback';
import { OperatorsList } from '../../../components/crm/operators-list';

// Tipos de valores possíveis na planilha
type CellValue = string | number | boolean | null | undefined;

// Interface genérica para linhas importadas
interface ImportedRow {
  [key: string]: CellValue;
}

// Interface para representar um mapeamento dinâmico de colunas
interface ColumnMapping {
  sourceColumn: string;   // Nome da coluna na planilha
  targetField: string;    // Campo no sistema
  required: boolean;      // Se é obrigatório
  type: 'string' | 'number' | 'boolean' | 'date'; // Tipo de dado
}

// Interface para uma linha mapeada genericamente
interface GenericMappedRow {
  [key: string]: CellValue | Record<string, CellValue>;
  extras?: Record<string, CellValue>;
}

// Interface para campos alvo
interface TargetField {
  fieldId: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
}

// Interface para estatísticas de alocação
interface AllocationStats {
  totalRows: number;
  allocatedRows: number;
  pendingRows: number;
  errorRows: number;
}

const AlocacaoLeadsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();

  // Estados para os dados recebidos da página de importação
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [targetFields, setTargetFields] = useState<TargetField[]>([]);
  const [importTarget, setImportTarget] = useState<string>('');

  // Estados para controle de alocação
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [allocationStats, setAllocationStats] = useState<AllocationStats>({
    totalRows: 0,
    allocatedRows: 0,
    pendingRows: 0,
    errorRows: 0
  });

  // Estado para controlar se os dados foram carregados
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [authError, setAuthError] = useState<boolean>(false);

  // Novos estados para alocação de leads
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [operatorLeads, setOperatorLeads] = useState<Record<string, ImportedRow[]>>({});
  const [allocatedLeads, setAllocatedLeads] = useState<ImportedRow[]>([]);

  useEffect(() => {
    // Verificar autenticação primeiro
    if (isLoaded && !isSignedIn) {
      console.log('Usuário não autenticado, redirecionando para login');
      setAuthError(true);
      return;
    }

    // Verificar se há dados passados via navegação
    const state = location.state as {
      rows?: ImportedRow[];
      headers?: string[];
      mappings?: ColumnMapping[];
      targetFields?: TargetField[];
      importTarget?: string;
      sheetMetadata?: Record<string, unknown>;
    } | null;
    console.log('Estado recebido na navegação:', state);

    if (state && state.rows && state.headers && state.mappings && state.targetFields) {
      console.log('Dados válidos recebidos, carregando página');
      console.log('Headers recebidos:', state.headers);
      console.log('Primeira linha de exemplo:', state.rows[0]);
      console.log('Mappings recebidos:', state.mappings);
      
      setRows(state.rows);
      setHeaders(state.headers);
      setMappings(state.mappings);
      setTargetFields(state.targetFields);
      setImportTarget(state.importTarget || 'leads');

      setAllocationStats({
        totalRows: state.rows.length,
        allocatedRows: 0,
        pendingRows: state.rows.length,
        errorRows: 0
      });

      setDataLoaded(true);
      setAuthError(false);
    } else {
      console.log('Dados inválidos ou ausentes, redirecionando para importação');
      // Se não há dados, redirecionar de volta para importação
      navigate('/crm/importar', { replace: true });
    }
  }, [location.state, navigate, isLoaded, isSignedIn]);

  const handleBackToImport = () => {
    navigate('/crm/importar');
  };

  const handleSelectRow = (rowIndex: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    setSelectedRows(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, index) => index)));
    }
  };

  const handleAllocateSelected = () => {
    // TODO: Implementar lógica de alocação
    console.log('Alocando leads selecionados:', Array.from(selectedRows));

    // Simulação de alocação bem-sucedida
    const newAllocated = selectedRows.size;
    setAllocationStats(prev => ({
      ...prev,
      allocatedRows: prev.allocatedRows + newAllocated,
      pendingRows: prev.pendingRows - newAllocated
    }));

    setSelectedRows(new Set());
  };

  // Função para alocar leads selecionados para um operador
  const allocateLeadsToOperator = (operatorId: string) => {
    if (selectedRows.size === 0) {
      alert('Selecione pelo menos um lead para alocar.');
      return;
    }

    const selectedLeads = Array.from(selectedRows).map(index => rows[index]);
    
    // Alocar leads para o operador selecionado
    setOperatorLeads(prev => ({
      ...prev,
      [operatorId]: [...(prev[operatorId] || []), ...selectedLeads]
    }));
    
    // Adicionar à lista de leads alocados
    setAllocatedLeads(prev => [...prev, ...selectedLeads]);
    
    // Remover leads selecionados da lista principal
    const remainingRows = rows.filter((_, index) => !selectedRows.has(index));
    setRows(remainingRows);
    
    // Limpar seleção
    setSelectedRows(new Set());
    
    // Atualizar estatísticas
    setAllocationStats(prev => ({
      ...prev,
      allocatedRows: prev.allocatedRows + selectedRows.size,
      totalRows: remainingRows.length
    }));
    
    alert(`Leads alocados com sucesso para o operador ${operatorId}!`);
  };

  // Função para alocar todos os leads automaticamente entre os operadores
  const allocateAllLeads = async () => {
    try {
      // Buscar operadores disponíveis
      const operatorsResponse = await fetch('/api/users/operators');
      if (!operatorsResponse.ok) {
        throw new Error('Erro ao buscar operadores');
      }
      
      const operators = await operatorsResponse.json();
      if (!operators || operators.length === 0) {
        alert('Nenhum operador encontrado para alocação automática.');
        return;
      }

      const totalLeads = rows.length;
      const totalOperators = operators.length;
      
      if (totalLeads === 0) {
        alert('Não há leads para alocar.');
        return;
      }

      // Calcular distribuição equilibrada
      const leadsPerOperator = Math.floor(totalLeads / totalOperators);
      const remainingLeads = totalLeads % totalOperators;
      
      let currentLeadIndex = 0;
      const newOperatorLeads: Record<string, ImportedRow[]> = {};
      
      // Distribuir leads entre operadores
      (operators as Array<{ id: string; firstName: string; lastName: string }>).forEach((operator, operatorIndex) => {
        const leadsToAllocate = leadsPerOperator + (operatorIndex < remainingLeads ? 1 : 0);
        const operatorLeads = rows.slice(currentLeadIndex, currentLeadIndex + leadsToAllocate);
        
        newOperatorLeads[operator.id] = operatorLeads;
        currentLeadIndex += leadsToAllocate;
      });
      
      // Atualizar estado
      setOperatorLeads(prev => ({
        ...prev,
        ...newOperatorLeads
      }));
      
      // Adicionar todos os leads à lista de alocados
      setAllocatedLeads(prev => [...prev, ...rows]);
      
      // Limpar lista principal
      setRows([]);
      
      // Limpar seleção
      setSelectedRows(new Set());
      
      // Atualizar estatísticas
      setAllocationStats(prev => ({
        ...prev,
        allocatedRows: prev.allocatedRows + totalLeads,
        totalRows: 0
      }));
      
      // Mostrar resumo da alocação
      const summary = (operators as Array<{ id: string; firstName: string; lastName: string }>).map((operator, index) => {
        const leadsCount = newOperatorLeads[operator.id]?.length || 0;
        return `${operator.firstName} ${operator.lastName}: ${leadsCount} leads`;
      }).join('\n');
      
      alert(`Alocação automática concluída!\n\nDistribuição:\n${summary}\n\n${remainingLeads > 0 ? `Nota: ${remainingLeads} lead(s) restante(s) foram distribuídos entre os primeiros operadores.` : ''}`);
      
    } catch (error) {
      console.error('Erro na alocação automática:', error);
      alert('Erro ao realizar alocação automática. Tente novamente.');
    }
  };

  // Função para salvar leads alocados no backend
  const saveAllocatedLeads = async () => {
    try {
      // Verificar se há leads alocados
      if (Object.keys(operatorLeads).length === 0) {
        alert('Não há leads alocados para salvar.');
        return;
      }

      // Buscar operadores para obter informações completas
      const operatorsResponse = await fetch('/api/users/operators');
      if (!operatorsResponse.ok) {
        throw new Error('Erro ao buscar operadores');
      }
      
      const operators: Array<{
        id: string;
        clerkId: string;
        email: string;
        firstName: string;
        lastName: string;
      }> = await operatorsResponse.json();

      // Agrupar leads por operador para evitar repetição
      const operatorsMap = new Map<string, {
        operatorId: string;
        emailOperator: string;
        leads: Array<{
          nameLead: string;
          phoneLead: string;
          // === NOVOS CAMPOS ADICIONADOS ===
          responsible?: string | null;
          age?: number | null;
          publicADS?: string | null;
        }>;
      }>();
      
      // Iterar sobre o estado operatorLeads para mapear os dados
      console.log('Estado operatorLeads:', operatorLeads);
      console.log('Operadores encontrados:', operators);
      
      Object.entries(operatorLeads).forEach(([operatorId, leads]) => {
        console.log(`Processando operador ${operatorId} com ${leads.length} leads:`, leads);
        
        if (!leads || leads.length === 0) return;
        
        // Encontrar o operador correspondente
        const operator = operators.find(op => op.id === operatorId);
        if (!operator) {
          console.warn(`Operador não encontrado para ID: ${operatorId}`);
          return;
        }
        
        console.log(`Operador encontrado:`, operator);
        
        // Mapear leads para o formato esperado pela API
        const mappedLeads = leads.map(lead => {
          // Extrair nome e telefone do lead baseado na estrutura ImportedRow
          const nameLead = String(lead['Nome'] || lead['Participante'] || lead['Cliente'] || 'Nome não informado');
          const phoneLead = String(lead['Telefone'] || lead['Celular'] || lead['Phone'] || 'Telefone não informado');
          
          // === NOVOS CAMPOS ADICIONADOS ===
          // Extrair responsável (pode vir de diferentes colunas)
          const responsible = String(lead['Responsável'] || lead['Responsavel'] || lead['Responsible'] || '');
          
          // Extrair idade (converter para número se possível)
          const ageStr = String(lead['Idade'] || lead['Age'] || '');
          const age = ageStr && !isNaN(Number(ageStr)) ? Number(ageStr) : null;
          
          // Extrair se veio de publicidade/anúncios (string)
          const publicADS = String(lead['PublicADS'] || lead['Publicidade'] || lead['Anuncio'] || '');
          
          console.log(`Lead mapeado:`, { 
            nameLead, 
            phoneLead, 
            responsible, 
            age, 
            publicADS, 
            originalLead: lead 
          });
          
          return {
            nameLead,
            phoneLead,
            // === NOVOS CAMPOS ADICIONADOS ===
            responsible: responsible || null,
            age: age,
            publicADS: publicADS
          };
        }).filter(lead => lead.nameLead !== 'Nome não informado' && lead.phoneLead !== 'Telefone não informado');
        
        console.log(`Leads válidos para operador ${operatorId}:`, mappedLeads);
        
        if (mappedLeads.length > 0) {
          operatorsMap.set(operatorId, {
            operatorId: operator.clerkId, // Usar ClerkId do operador
            emailOperator: operator.email,
            leads: mappedLeads
          });
        }
      });
      
      if (operatorsMap.size === 0) {
        alert('Nenhum lead válido encontrado para salvar.');
        return;
      }
      
      const payload = {
        operators: Array.from(operatorsMap.values())
      };
      
      console.log('Payload sendo enviado:', payload);
      console.log('Tamanho do payload:', payload.operators.length);
      console.log('Total de leads no payload:', payload.operators.reduce((total, op) => total + op.leads.length, 0));
      
      // Verificação final antes de enviar
      if (payload.operators.length === 0) {
        alert('Erro: Payload vazio. Verifique se há leads alocados.');
        return;
      }
      
      // Log da URL e headers
      const apiUrl = '/api/operator-leads/allocate';
      console.log('URL da API:', apiUrl);
      console.log('Headers:', { 'Content-Type': 'application/json' });
      console.log('Método: POST');
      
      const saveResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('Status da resposta:', saveResponse.status);
      console.log('Headers da resposta:', Object.fromEntries(saveResponse.headers.entries()));
      
      if (saveResponse.ok) {
        const result = await saveResponse.json();
        console.log('Leads salvos com sucesso:', result);
        
        // Limpar leads alocados após salvar com sucesso
        setAllocatedLeads([]);
        setOperatorLeads({});
        setAllocationStats({
          totalRows: 0,
          allocatedRows: 0,
          pendingRows: rows.length,
          errorRows: 0
        });
        
        // Mostrar mensagem de sucesso
        alert(`Leads salvos com sucesso! Total: ${result.totalLeads} leads para ${result.totalOperators} operadores.`);
      } else {
        const errorData = await saveResponse.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error('Erro ao salvar leads:', errorData);
        alert(`Erro ao salvar leads: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar leads:', error);
      alert('Erro ao salvar leads. Verifique o console para mais detalhes.');
    }
  };

  // Função para obter quantidade de leads de um operador
  const getOperatorLeadsCount = (operatorId: string): number => {
    return operatorLeads[operatorId]?.length || 0;
  };

  // Função para ver leads de um operador
  const viewOperatorLeads = (operatorId: string) => {
    const leads = operatorLeads[operatorId] || [];
    if (leads.length === 0) {
      alert('Este operador ainda não possui leads alocados.');
      return;
    }

    const leadsInfo = leads.map((lead, index) => {
      const leadData = Object.entries(lead)
        .filter(([key, value]) => value && String(value).trim() !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      return `${index + 1}. ${leadData}`;
    }).join('\n');

    alert(`Leads alocados para este operador:\n\n${leadsInfo}`);
  };

  const exportAllocatedData = () => {
    // TODO: Implementar exportação dos dados alocados
    console.log('Exportando dados alocados...');
  };

  // Verificar se o Clerk ainda está carregando
  if (!isLoaded) {
    console.log('Clerk ainda carregando...');
    return <LoadingFallback />;
  }

  // Verificar se há erro de autenticação
  if (authError) {
    console.log('Erro de autenticação detectado');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-4">
            Você precisa estar autenticado para acessar esta página.
          </p>
          <Button onClick={() => navigate('/login')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  // Verificar se os dados foram carregados
  if (!dataLoaded) {
    console.log('Dados ainda não carregados...');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Aguardando dados da página de importação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header com navegação */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackToImport}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Alocação de Leads</h1>
            <p className="text-muted-foreground">
              Organize e aloque os leads importados para operadores
            </p>
          </div>
          {user && (
            <div className="ml-auto flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                {user.firstName || user.emailAddresses[0]?.emailAddress || 'Usuário'}
              </span>
            </div>
          )}
        </div>

      {/* Estatísticas e Lista de Operadores - Layout horizontal lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Operadores - Lado esquerdo (2/3 do espaço) */}
        <div className="lg:col-span-2">
          <OperatorsList 
            onAllocateLeads={allocateLeadsToOperator}
            getOperatorLeadsCount={getOperatorLeadsCount}
            onViewOperatorLeads={viewOperatorLeads}
            selectedLeadsCount={selectedRows.size}
          />
        </div>

        {/* Estatísticas de alocação - Lado direito (1/3 do espaço) */}
        <div className="lg:col-span-1">
          <div className="flex justify-end">
            <Card className="w-80">
          <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                      <FileDown className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Total</span>
              </div>
                    <span className="text-lg font-bold">{allocationStats.totalRows}</span>
            </div>

                  <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Alocados</span>
              </div>
                    <span className="text-lg font-bold">{allocationStats.allocatedRows}</span>
            </div>

                  <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Pendentes</span>
              </div>
                    <span className="text-lg font-bold">{allocationStats.pendingRows}</span>
            </div>

                  <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Selecionados</span>
                    </div>
                    <span className="text-lg font-bold">{selectedRows.size}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
          </div>

      {/* Tabela de dados - Volta ao tamanho original (largura total) */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  if (selectedRows.size === 0) {
                    alert('Selecione pelo menos um lead para alocar.');
                    return;
                  }
                  
                  // Mostrar modal de seleção de operador
                  const operatorId = prompt(
                    `Você selecionou ${selectedRows.size} lead(s).\n\nDigite o ID do operador para alocar:\n\n` +
                    '1 - João Silva\n' +
                    '2 - Maria Santos\n' +
                    '3 - Ana Clara\n' +
                    '4 - Carlos Oliveira'
                  );
                  
                  if (operatorId && ['1', '2', '3', '4'].includes(operatorId)) {
                    const operatorMap: Record<string, string> = {
                      '1': 'op_1',
                      '2': 'op_2', 
                      '3': 'op_3',
                      '4': 'op_4'
                    };
                    
                    allocateLeadsToOperator(operatorMap[operatorId]);
                  } else if (operatorId) {
                    alert('ID de operador inválido. Use 1, 2, 3 ou 4.');
                  }
                }}
                disabled={selectedRows.size === 0}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Users className="h-4 w-4" />
                Alocar {selectedRows.size} Lead{selectedRows.size !== 1 ? 's' : ''}
              </Button>
              
              <Button
                onClick={allocateAllLeads}
                disabled={rows.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Users className="h-4 w-4" />
                Alocar Todos
              </Button>
              
              <Button
                onClick={saveAllocatedLeads}
                disabled={allocatedLeads.length === 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Shield className="h-4 w-4" />
                Salvar
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{rows.length} linhas</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedRows.size === rows.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === rows.length && rows.length > 0}
                        onChange={handleSelectAll}
                      />
                    </TableHead>
                    {headers.map(header => (
                      <TableHead key={header}>
                        <div className="flex flex-col">
                          <span>{header}</span>
                          <span className="text-xs text-muted-foreground">
                            {(() => {
                              const mapping = mappings.find(m => m.sourceColumn === header);
                              if (!mapping) return 'não mapeado';

                              const targetField = targetFields.find(f => f.fieldId === mapping.targetField);
                              if (targetField) return targetField.name;

                              return mapping.targetField.startsWith('extra_')
                                ? 'campo extra'
                                : mapping.targetField;
                            })()}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className={selectedRows.has(rowIndex) ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(rowIndex)}
                          onChange={() => handleSelectRow(rowIndex)}
                        />
                      </TableCell>
                      {headers.map(header => (
                        <TableCell key={`${rowIndex}-${header}`}>
                          {String(row[header] || '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Alert informativo */}
      {selectedRows.size > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {selectedRows.size} lead{selectedRows.size !== 1 ? 's selecionado' : 'selecionada'}.
            Clique em "Alocar Leads" para prosseguir com a alocação.
          </AlertDescription>
        </Alert>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default AlocacaoLeadsPage;
