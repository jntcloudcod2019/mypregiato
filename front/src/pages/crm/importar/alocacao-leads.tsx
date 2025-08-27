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
          <Button variant="outline" onClick={handleBackToImport}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Importação
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

      {/* Estatísticas de alocação */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{allocationStats.totalRows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Alocados</p>
                <p className="text-2xl font-bold">{allocationStats.allocatedRows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-2xl font-bold">{allocationStats.pendingRows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Selecionados</p>
                <p className="text-2xl font-bold">{selectedRows.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de ação */}
      <Card>
        <CardHeader>
          <CardTitle>Ações de Alocação</CardTitle>
          <CardDescription>
            Selecione os leads que deseja alocar e execute as ações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={handleAllocateSelected}
              disabled={selectedRows.size === 0}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Alocar {selectedRows.size} Lead{selectedRows.size !== 1 ? 's' : ''}
            </Button>

            <Button
              variant="outline"
              onClick={exportAllocatedData}
              disabled={allocationStats.allocatedRows === 0}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Exportar Dados Alocados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de dados - Replicando a pré-visualização */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Dados Importados</CardTitle>
              <CardDescription>
                Visualize os dados importados antes da alocação
              </CardDescription>
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
