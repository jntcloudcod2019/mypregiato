import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { FileUp, FileDown, AlertTriangle, CheckCircle, XCircle, Download, X, Users, Edit3, Save, X as XIcon, Plus, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import Papa from 'papaparse';
import api from '@/services/whatsapp-api';
import { useNavigate } from 'react-router-dom';

// Tipos simplificados
type CellValue = string | number | boolean | null | undefined;
interface ImportedRow { [key: string]: CellValue; }

// Interface para resultado de importação
interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
  errorSamples: string[];
  timestamp?: string;
}

// Interface para erros da API
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[] | string>;
    };
  };
  message?: string;
}

export default function ImportarDadosPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('import');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [importTarget, setImportTarget] = useState<string>('leads');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importHistory, setImportHistory] = useState<ImportResult[]>([]);
  
  // Estados para edição
  const [editingHeaders, setEditingHeaders] = useState<boolean>(false);
  const [editingCells, setEditingCells] = useState<boolean>(false);
  const [editableHeaders, setEditableHeaders] = useState<string[]>([]);
  const [editableRows, setEditableRows] = useState<ImportedRow[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; header: string } | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [showMappingModal, setShowMappingModal] = useState<boolean>(false);

  // Campos disponíveis para mapeamento por tipo de importação
  const getAvailableFields = () => {
    if (importTarget === 'leads') {
      return [
        { value: 'name', label: 'Nome', description: 'Nome completo do lead' },
        { value: 'email', label: 'E-mail', description: 'Endereço de e-mail' },
        { value: 'phone', label: 'Telefone', description: 'Número de telefone' },
        { value: 'company', label: 'Empresa', description: 'Nome da empresa' },
        { value: 'description', label: 'Descrição', description: 'Observações ou descrição' },
        { value: 'source', label: 'Fonte', description: 'Origem do lead' },
        { value: 'status', label: 'Status', description: 'Status atual do lead' }
      ];
    } else if (importTarget === 'talents') {
      return [
        { value: 'fullName', label: 'Nome Completo', description: 'Nome completo do talento' },
        { value: 'email', label: 'E-mail', description: 'Endereço de e-mail' },
        { value: 'phone', label: 'Telefone', description: 'Número de telefone' },
        { value: 'city', label: 'Cidade', description: 'Cidade de residência' },
        { value: 'birthDate', label: 'Data de Nascimento', description: 'Data de nascimento' },
        { value: 'height', label: 'Altura', description: 'Altura em centímetros' }
      ];
    } else {
      return [
        { value: 'custom', label: 'Personalizado', description: 'Manter nome original da coluna' }
      ];
    }
  };

  // Função para mapear coluna
  const mapColumn = (columnName: string, fieldType: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [columnName]: fieldType
    }));
  };

  // Função para obter o campo mapeado de uma coluna
  const getMappedField = (columnName: string): string => {
    return columnMappings[columnName] || 'custom';
  };

  // Função para detectar automaticamente o tipo de coluna
  const detectColumnType = (columnName: string): string => {
    const lowerColumnName = columnName.toLowerCase();
    
    if (importTarget === 'leads') {
      if (lowerColumnName.includes('nome') || lowerColumnName.includes('name')) return 'name';
      if (lowerColumnName.includes('email') || lowerColumnName.includes('e-mail')) return 'email';
      if (lowerColumnName.includes('tel') || lowerColumnName.includes('fone') || lowerColumnName.includes('phone') || lowerColumnName.includes('celular')) return 'phone';
      if (lowerColumnName.includes('empresa') || lowerColumnName.includes('company') || lowerColumnName.includes('organizacao')) return 'company';
      if (lowerColumnName.includes('obs') || lowerColumnName.includes('desc') || lowerColumnName.includes('observacao') || lowerColumnName.includes('description')) return 'description';
      if (lowerColumnName.includes('fonte') || lowerColumnName.includes('source') || lowerColumnName.includes('origem')) return 'source';
      if (lowerColumnName.includes('status') || lowerColumnName.includes('etapa') || lowerColumnName.includes('situacao')) return 'status';
    } else if (importTarget === 'talents') {
      if (lowerColumnName.includes('nome') || lowerColumnName.includes('name') || lowerColumnName.includes('fullname')) return 'fullName';
      if (lowerColumnName.includes('email') || lowerColumnName.includes('e-mail')) return 'email';
      if (lowerColumnName.includes('tel') || lowerColumnName.includes('fone') || lowerColumnName.includes('phone') || lowerColumnName.includes('celular')) return 'phone';
      if (lowerColumnName.includes('cidade') || lowerColumnName.includes('city')) return 'city';
      if (lowerColumnName.includes('nascimento') || lowerColumnName.includes('birth') || lowerColumnName.includes('data')) return 'birthDate';
      if (lowerColumnName.includes('altura') || lowerColumnName.includes('height')) return 'height';
    }
    
    return 'custom'; // Coluna não reconhecida, manter como personalizada
  };

  // Função para aplicar mapeamento automático quando arquivo é carregado
  const applyAutoMapping = (headers: string[]) => {
    const newMappings: Record<string, string> = {};
    
    headers.forEach(header => {
      newMappings[header] = detectColumnType(header);
    });
    
    setColumnMappings(newMappings);
  };

  // Função para obter o label do campo mapeado
  const getMappedFieldLabel = (columnName: string): string => {
    const fieldType = getMappedField(columnName);
    if (fieldType === 'custom') return columnName;
    
    const availableFields = getAvailableFields();
    const field = availableFields.find(f => f.value === fieldType);
    return field ? field.label : columnName;
  };

  // Função para obter a descrição do campo mapeado
  const getMappedFieldDescription = (columnName: string): string => {
    const fieldType = getMappedField(columnName);
    if (fieldType === 'custom') return 'Coluna personalizada';
    
    const availableFields = getAvailableFields();
    const field = availableFields.find(f => f.value === fieldType);
    return field ? field.description : 'Coluna personalizada';
  };

  // Função para aplicar mapeamento aos dados
  const applyMappings = () => {
    console.log('Aplicando mapeamento...');
    console.log('Headers originais:', editableHeaders);
    console.log('Mapeamentos:', columnMappings);
    console.log('Dados originais:', editableRows);
    
    // NÃO alterar os dados originais, apenas reorganizar para a importação
    // Os dados originais devem permanecer intactos para edição
    console.log('Mapeamento aplicado com sucesso!');
    setShowMappingModal(false);
    
    // Mostrar mensagem de sucesso
    alert('Mapeamento aplicado com sucesso! Os dados originais foram preservados.');
  };

  // Função para mostrar prévia do mapeamento
  const showMappingPreview = () => {
    const previewData = editableRows.slice(0, 3).map(row => {
      const mappedRow: Record<string, CellValue> = {};
      
      editableHeaders.forEach(header => {
        const fieldType = getMappedField(header);
        if (fieldType === 'custom') {
          mappedRow[header] = row[header];
        } else {
          mappedRow[fieldType] = row[header];
        }
      });
      
      return mappedRow;
    });
    
    console.log('Prévia do mapeamento:', previewData);
    
    const previewText = `Prévia do mapeamento (3 primeiras linhas):\n\n${JSON.stringify(previewData, null, 2)}`;
    alert(previewText);
  };

  // Inicializar dados editáveis quando headers ou rows mudarem
  useEffect(() => {
    if (headers.length > 0) {
      setEditableHeaders([...headers]);
    }
    if (rows.length > 0) {
      setEditableRows([...rows]);
    }
  }, [headers, rows]);

  // Monitorar mudanças no estado editableRows para debug
  useEffect(() => {
    console.log('editableRows atualizado:', editableRows.length, editableRows);
  }, [editableRows]);

  // Monitorar mudanças no estado editableHeaders para debug
  useEffect(() => {
    console.log('editableHeaders atualizado:', editableHeaders.length, editableHeaders);
  }, [editableHeaders]);

  // Função para salvar alterações nos cabeçalhos
  const saveHeaderChanges = () => {
    setHeaders([...editableHeaders]);
    setEditingHeaders(false);
  };

  // Função para cancelar alterações nos cabeçalhos
  const cancelHeaderChanges = () => {
    setEditableHeaders([...headers]);
    setEditingHeaders(false);
  };

  // Função para salvar alterações nas células
  const saveCellChanges = () => {
    setRows([...editableRows]);
    setEditingCells(false);
    setEditingCell(null);
  };

  // Função para cancelar alterações nas células
  const cancelCellChanges = () => {
    setEditableRows([...rows]);
    setEditingCells(false);
    setEditingCell(null);
  };

  // Função para editar cabeçalho
  const startEditingHeader = (index: number, value: string) => {
    // Abrir modal de mapeamento para editar o mapeamento da coluna
    setShowMappingModal(true);
  };

  // Função para editar nome da coluna (renomear)
  const startRenamingColumn = (index: number, currentName: string) => {
    console.log('Renomeando coluna:', index, currentName);
    const newName = prompt('Digite o novo nome da coluna:', currentName);
    if (newName && newName.trim() && newName !== currentName) {
      const newHeaders = [...editableHeaders];
      const oldHeader = newHeaders[index];
      newHeaders[index] = newName.trim();
      setEditableHeaders(newHeaders);
      
      // Atualizar também as chaves das linhas
      const newRows = editableRows.map(row => {
        const newRow: ImportedRow = {};
        Object.keys(row).forEach(key => {
          if (key === oldHeader) {
            newRow[newName.trim()] = row[key];
          } else {
            newRow[key] = row[key];
          }
        });
        return newRow;
      });
      setEditableRows(newRows);
      
      // Atualizar mapeamento se existir
      if (columnMappings[oldHeader]) {
        setColumnMappings(prev => {
          const newMappings = { ...prev };
          newMappings[newName.trim()] = newMappings[oldHeader];
          delete newMappings[oldHeader];
          return newMappings;
        });
      }
    }
  };

  // Função para salvar cabeçalho editado
  const saveHeader = (index: number, newValue: string) => {
    if (newValue.trim()) {
      const newHeaders = [...editableHeaders];
      newHeaders[index] = newValue.trim();
      setEditableHeaders(newHeaders);
      
      // Atualizar também as chaves das linhas
      const oldHeader = headers[index];
      const newRows = editableRows.map(row => {
        const newRow: ImportedRow = {};
        Object.keys(row).forEach(key => {
          if (key === oldHeader) {
            newRow[newValue.trim()] = row[key];
          } else {
            newRow[key] = row[key];
          }
        });
        return newRow;
      });
      setEditableRows(newRows);
    }
  };

  // Função para editar célula
  const startEditingCell = (rowIndex: number, header: string) => {
    setEditingCell({ rowIndex, header });
  };

  // Função para salvar célula editada
  const saveCell = (rowIndex: number, header: string, newValue: CellValue) => {
    const newRows = [...editableRows];
    newRows[rowIndex] = { ...newRows[rowIndex], [header]: newValue };
    setEditableRows(newRows);
    setEditingCell(null);
  };

  // Função para remover coluna
  const removeColumn = (headerIndex: number) => {
    console.log('Removendo coluna:', headerIndex, editableHeaders[headerIndex]);
    const headerToRemove = editableHeaders[headerIndex];
    const newHeaders = editableHeaders.filter((_, index) => index !== headerIndex);
    const newRows = editableRows.map(row => {
      const newRow: ImportedRow = {};
      Object.keys(row).forEach(key => {
        if (key !== headerToRemove) {
          newRow[key] = row[key];
        }
      });
      return newRow;
    });
    
    console.log('Novos headers:', newHeaders);
    console.log('Novas rows:', newRows);
    
    setEditableHeaders(newHeaders);
    setEditableRows(newRows);
  };

  // Função para adicionar nova coluna
  const addNewColumn = () => {
    const newColumnName = `Nova_Coluna_${editableHeaders.length + 1}`;
    setEditableHeaders([...editableHeaders, newColumnName]);
    
    const newRows = editableRows.map(row => ({
      ...row,
      [newColumnName]: ''
    }));
    setEditableRows(newRows);
  };

  // Função para remover linha
  const removeRow = (rowIndex: number) => {
    const newRows = editableRows.filter((_, index) => index !== rowIndex);
    setEditableRows(newRows);
  };

  // Função para adicionar nova linha
  const addNewRow = () => {
    const newRow: ImportedRow = {};
    editableHeaders.forEach(header => {
      newRow[header] = '';
    });
    setEditableRows([...editableRows, newRow]);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    try {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'csv' || fileExt === 'txt') {
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            const data = results.data as ImportedRow[];
            console.log('CSV carregado:', headers.length, 'colunas,', data.length, 'linhas');
            
            setHeaders(headers);
            setRows(data);
            
            // Atualizar diretamente os estados editáveis
            setEditableHeaders([...headers]);
            setEditableRows([...data]);
            
            // Aplicar mapeamento automático
            applyAutoMapping(headers);
            
            console.log('Estados atualizados após carregamento CSV');
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            alert('Erro ao processar o arquivo CSV: ' + error.message);
          }
        });
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        try {
          const XLSX = await import('xlsx');
          const data = await selectedFile.arrayBuffer();
          const workbook = XLSX.read(data);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(worksheet);
          
          if (jsonData.length > 0) {
            const headers = Object.keys(jsonData[0]);
            console.log('Excel carregado:', headers.length, 'colunas,', jsonData.length, 'linhas');
            
            setHeaders(headers);
            setRows(jsonData);
            
            // Atualizar diretamente os estados editáveis
            setEditableHeaders([...headers]);
            setEditableRows([...jsonData]);
            
            // Aplicar mapeamento automático
            applyAutoMapping(headers);
            
            console.log('Estados atualizados após carregamento Excel');
          } else {
            alert('O arquivo Excel não contém dados.');
          }
        } catch (excelError) {
          console.error('Error processing Excel file:', excelError);
          alert('Erro ao processar o arquivo Excel. Verifique se o formato está correto.');
        }
      } else {
        alert('Formato de arquivo não suportado. Por favor, use CSV ou Excel (.xlsx, .xls).');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Erro ao processar o arquivo: ' + (error as Error).message);
    }
  };
  
  // Função para traduzir mensagens de erro da API
  const translateApiError = (error: ApiError): string => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const message = error?.message;

    const statusMessages: Record<number, string> = {
      400: 'Dados inválidos enviados. Verifique as informações e tente novamente.',
      401: 'Acesso não autorizado. Faça login novamente.',
      403: 'Acesso negado. Você não tem permissão para esta ação.',
      404: 'Recurso não encontrado.',
      409: 'Conflito de dados. O registro já existe.',
      422: 'Dados inválidos. Verifique os campos obrigatórios.',
      500: 'Erro interno do servidor. Tente novamente mais tarde.',
      502: 'Servidor temporariamente indisponível.',
      503: 'Serviço temporariamente indisponível.',
      504: 'Tempo limite excedido. Tente novamente.'
    };

    if (data?.errors) {
      const validationErrors = data.errors;
      
      if (validationErrors.items) {
        return 'Lista de itens é obrigatória. Verifique se o arquivo contém dados válidos.';
      }
      
      if (validationErrors['$[0].phone']) {
        return 'Formato de telefone inválido. Use apenas números e caracteres especiais como parênteses, hífens ou espaços.';
      }
      
      if (validationErrors['$[0].email']) {
        return 'Formato de e-mail inválido. Verifique se o e-mail está correto.';
      }
      
      if (validationErrors['$[0].name']) {
        return 'Nome é obrigatório. Verifique se todos os registros possuem nome.';
      }
      
      const firstError = Object.values(validationErrors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return String(firstError[0]);
      }
    }

    if (data?.message) {
      return data.message;
    }

    if (status && statusMessages[status]) {
      return statusMessages[status];
    }

    if (message?.includes('Network Error')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }

    return 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.';
  };

  // Função para extrair detalhes de erros de importação
  const extractImportErrors = (error: ApiError): string[] => {
    const errors: string[] = [];
    
    if (error?.response?.data?.errors) {
      const validationErrors = error.response.data.errors;
      
      Object.entries(validationErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach((msg: string) => {
            errors.push(`${field}: ${msg}`);
          });
        } else if (typeof messages === 'string') {
          errors.push(`${field}: ${messages}`);
        }
      });
    }
    
    if (error?.response?.data?.message) {
      errors.push(error.response.data.message);
    }
    
    if (errors.length === 0) {
      errors.push(translateApiError(error));
    }
    
    return errors;
  };

  // Processa os dados para importação - USANDO MAPEAMENTO CORRETO
  const processData = async () => {
    if (editableRows.length === 0) {
      alert('Não há dados para processar.');
      return;
    }
    
    setProcessing(true);
    try {
      // Mapeamento baseado no sistema de mapeamento implementado
      const mappedData = editableRows.map(row => {
        const mappedRow: Record<string, CellValue> = {};
        
        editableHeaders.forEach(header => {
          const fieldType = getMappedField(header);
          if (fieldType === 'custom') {
            // Para colunas personalizadas, manter o nome original
            mappedRow[header] = row[header];
              } else {
            // Para colunas mapeadas, usar o campo do sistema
            mappedRow[fieldType] = row[header];
          }
        });
        
        return mappedRow;
      });
      
      // Determina o endpoint com base no tipo de importação
      let endpoint = '/leads/import';
      if (importTarget === 'talents') {
        endpoint = '/talents/import';
      }
      
      // Envia para API
      const response = await api.post(endpoint, mappedData);
      
      // Processa resultado
      const newResult: ImportResult = {
        created: response.data?.created || mappedData.length,
        skipped: response.data?.skipped || 0,
        errors: response.data?.errors || 0,
        errorSamples: response.data?.errorSamples || [],
        timestamp: new Date().toISOString()
      };
      
      setResult(newResult);
      setImportHistory(prev => [newResult, ...prev]);
      
    } catch (error) {
      console.error('Error processing data:', error);
      
      const errorDetails = extractImportErrors(error as unknown);
      
      setResult({
        created: 0,
        skipped: 0,
        errors: editableRows.length,
        errorSamples: errorDetails,
        timestamp: new Date().toISOString()
      });
    } finally {
      setProcessing(false);
    }
  };

  // Função para navegar para a página de alocação de leads
  const handleNavigateToAllocation = () => {
    console.log('=== DEBUG NAVEGAÇÃO ===');
    console.log('handleNavigateToAllocation chamada');
    console.log('editableRows.length:', editableRows.length);
    console.log('editableRows (primeiras 2 linhas):', editableRows.slice(0, 2));
    console.log('editableHeaders:', editableHeaders);
    console.log('importTarget:', importTarget);
    console.log('navigate function:', typeof navigate);
    console.log('Current URL:', window.location.href);
    
    if (editableRows.length === 0) {
      alert('Não há dados para alocar. Importe um arquivo primeiro.');
      return;
    }

    const targetPath = '/crm/importar/alocacao-leads';
    const navigationState = {
      rows: editableRows,
      headers: editableHeaders,
        importTarget: importTarget,
      // Adicionar campos que a página alocacao-leads espera
      mappings: editableHeaders.map(header => ({
        sourceColumn: header,
        targetField: getMappedField(header),
        required: false,
        type: 'string' as const
      })),
      targetFields: getAvailableFields().map(field => ({
        fieldId: field.value,
        name: field.label,
        type: 'string' as const,
        required: false
      }))
    };
    
    console.log('Navegando para:', targetPath);
    console.log('State sendo enviado:', navigationState);
    
    // Teste simples: navegação direta sem state primeiro
    try {
      console.log('Tentando navegação com state...');
      navigate(targetPath, {
        state: navigationState
      });
      
      // Verificar se funcionou
      setTimeout(() => {
        console.log('URL após navegação com state:', window.location.href);
        if (window.location.href.includes('alocacao-leads')) {
          console.log('✅ Navegação com state funcionou!');
        } else {
          console.log('❌ Navegação com state falhou');
          // Tentar navegação direta
          console.log('Tentando navegação direta...');
          window.location.href = targetPath;
        }
      }, 500);
      
    } catch (error) {
      console.error('Erro na navegação:', error);
      alert('Erro ao navegar para a página de alocação: ' + error);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    
    const reportData = [
      ['Status', 'Valor'],
      ['Criados', result.created],
      ['Ignorados', result.skipped],
      ['Erros', result.errors],
      [''],
      ['Exemplos de erros'],
      ...result.errorSamples.map(error => [error])
    ];
    
    const csv = Papa.unparse(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_importacao_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar Dados</h1>
        <p className="text-muted-foreground mt-1">Importe dados de arquivos CSV ou Excel para qualquer formato</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import">Importar</TabsTrigger>
          <TabsTrigger value="history">Histórico de Importações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar arquivo</CardTitle>
              <CardDescription>Selecione um arquivo CSV ou Excel para importar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="import-type">Tipo de importação</Label>
                    <Select value={importTarget} onValueChange={setImportTarget}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leads">Leads</SelectItem>
                        <SelectItem value="talents">Talentos</SelectItem>
                        <SelectItem value="generic">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".csv,.txt,.xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                    <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                      <FileUp className="mr-2 h-4 w-4" />
                      Importar CSV/Excel
                    </Button>
                    
                    {editableRows.length > 0 && (
                      <>
                        <Button variant="outline" onClick={processData} disabled={processing}>
                          {processing ? 'Processando...' : `Importar ${editableRows.length} linhas`}
                        </Button>

                        <Button
                          variant="default"
                          onClick={handleNavigateToAllocation}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Alocar Leads
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {editableRows.length > 0 && (
                  <div className="border rounded-md p-3 bg-muted/50">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Dados detectados</h3>
                      <Badge variant="outline">{editableRows.length} linhas</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Foram encontradas {editableHeaders.length} colunas. O mapeamento automático foi aplicado.</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowMappingModal(true)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Editar Mapeamento
                        </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                          onClick={showMappingPreview}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Prévia
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={applyMappings}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Aplicar Mapeamento
                          </Button>
                        </div>
                    </div>
                  </div>
                )}
                    
                {editableRows.length > 0 && (
                  <div className="space-y-6">
                    {/* Visualização dos dados */}
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-lg">Pré-visualização</CardTitle>
                        <CardDescription>
                          Os dados serão importados como mostrado abaixo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-md">
                          <ScrollArea className="h-[300px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {editableHeaders.map((header, headerIndex) => (
                                    <TableHead key={headerIndex}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{header}</span>
                                        <div className="flex items-center gap-1 mt-1">
                                          <Badge 
                                            variant={getMappedField(header) === 'custom' ? 'outline' : 'default'}
                                            className="text-xs"
                                          >
                                            {getMappedFieldLabel(header)}
                                          </Badge>
                                          <Edit3 
                                            className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-primary" 
                                            onClick={() => startEditingHeader(headerIndex, header)} 
                                            aria-label="Editar mapeamento"
                                          />
                                          <Edit3 
                                            className="h-3 w-3 text-blue-500 cursor-pointer hover:text-blue-700" 
                                            onClick={() => startRenamingColumn(headerIndex, header)} 
                                            aria-label="Renomear coluna"
                                          />
                                          <XIcon 
                                            className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-destructive" 
                                            onClick={() => removeColumn(headerIndex)} 
                                            aria-label="Remover coluna"
                                          />
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1">
                                          {getMappedFieldDescription(header)}
                                        </span>
                                      </div>
                                    </TableHead>
                                  ))}
                                  <TableHead>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="sm" onClick={addNewColumn}>
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {editableRows.map((row, rowIndex) => (
                                  <TableRow key={rowIndex}>
                                    {editableHeaders.map((header, headerIndex) => (
                                      <TableCell key={`${rowIndex}-${headerIndex}`}>
                                        {editingCell?.rowIndex === rowIndex && editingCell?.header === header ? (
                                          <Input
                                            autoFocus
                                            value={String(row[header] || '')}
                                            onChange={(e) => saveCell(rowIndex, header, e.target.value)}
                                            onBlur={() => saveCell(rowIndex, header, row[header])}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') saveCell(rowIndex, header, row[header]);
                                              if (e.key === 'Escape') cancelCellChanges();
                                            }}
                                          />
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <span>{String(row[header] || '')}</span>
                                            <Edit3 className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => startEditingCell(rowIndex, header)} />
                                          </div>
                                        )}
                                      </TableCell>
                                    ))}
                                    <TableCell>
                                      <Button variant="ghost" size="sm" onClick={() => removeRow(rowIndex)}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell colSpan={editableHeaders.length + 1} className="text-center">
                                    <Button variant="ghost" size="sm" onClick={addNewRow}>
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </div>
                        
                        {editableRows.length > 10 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Mostrando 10 de {editableRows.length} linhas
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {result && (
                  <div className="space-y-4">
                    {result.errors > 0 ? (
                      <Alert variant="destructive" className="relative">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-4 w-4 mt-0.5" />
                          <div className="flex-1">
                            <AlertTitle>Erro na importação</AlertTitle>
                            <AlertDescription className="mt-1">
                              <div className="space-y-2">
                                <p>Não foi possível importar {result.errors} registros. Verifique os detalhes abaixo:</p>
                                {result.errorSamples.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {result.errorSamples.map((error, index) => (
                                      <div key={index} className="text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded border-l-2 border-red-500">
                                        {error}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </AlertDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => setResult(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertTitle>Importação concluída com sucesso</AlertTitle>
                        <AlertDescription>
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{result.created} registros criados com sucesso</span>
                            </div>
                            
                            {result.skipped > 0 && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span>{result.skipped} registros ignorados (já existem)</span>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <Button variant="outline" onClick={downloadReport}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Baixar relatório
                      </Button>
                      
                      <Button onClick={() => navigate(`/crm/${importTarget}`)}>
                        Ver {importTarget === 'leads' ? 'Leads' : importTarget === 'talents' ? 'Talentos' : 'Registros'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de importações</CardTitle>
              <CardDescription>Veja os arquivos importados anteriormente</CardDescription>
            </CardHeader>
            <CardContent>
              {importHistory.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Registros</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importHistory.map((hist, index) => {
                        const date = hist.timestamp ? new Date(hist.timestamp) : new Date();
                        const formattedDate = date.toLocaleDateString('pt-BR', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        
                        const total = hist.created + hist.skipped + hist.errors;
                        const successRate = total > 0 ? Math.round((hist.created / total) * 100) : 0;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{formattedDate}</TableCell>
                            <TableCell>{importTarget === 'leads' ? 'Leads' : importTarget === 'talents' ? 'Talentos' : 'Dados'}</TableCell>
                            <TableCell>{total}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${successRate > 90 ? 'bg-green-500' : successRate > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${successRate}%` }}
                                  />
                                </div>
                                <span className="text-xs">{successRate}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setResult(hist)}>
                                Ver detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma importação realizada nesta sessão.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal de Edição de Mapeamento */}
      {showMappingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Editar Mapeamento de Colunas</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMappingModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure como cada coluna deve ser mapeada para o sistema:
              </p>
              
              <div className="space-y-3">
                {editableHeaders.map((header, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{header}</p>
                      <p className="text-xs text-muted-foreground">
                        Mapeado para: {getMappedFieldLabel(header)}
                      </p>
                    </div>
                    
                    <Select
                      value={getMappedField(header)}
                      onValueChange={(value) => mapColumn(header, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableFields().map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowMappingModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={applyMappings}
                >
                  Aplicar Mapeamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
