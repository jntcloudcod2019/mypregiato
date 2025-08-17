import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileUp, FileDown, AlertTriangle, CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Papa from 'papaparse';
import api from '@/services/whatsapp-api';
import { useNavigate } from 'react-router-dom';

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
  // O campo extras armazena colunas que não foram explicitamente mapeadas
  extras?: Record<string, CellValue>;
}

// Interface para resultado de importação
interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
  errorSamples: string[];
  timestamp?: string;
}

// Interface para metadados detectados da planilha
interface SheetMetadata {
  rowCount: number;
  columnTypes: Record<string, string>;
  sampleValues: Record<string, CellValue[]>;
}

// Interface para destinos de mapeamento pré-definidos
interface MappingTarget {
  fieldId: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
}

// Detectores de tipo de dados
const dataTypeDetectors = {
  isDate: (value: CellValue): boolean => {
    if (typeof value !== 'string') return false;
    // Verifica formatos comuns de data
    return /^\d{2}[/-]\d{2}[/-]\d{4}$/.test(value) || 
           /^\d{4}[/-]\d{2}[/-]\d{2}$/.test(value) ||
           !isNaN(Date.parse(value));
  },
  
  isNumber: (value: CellValue): boolean => {
    if (typeof value === 'number') return true;
    if (typeof value !== 'string') return false;
    return !isNaN(Number(value.replace(',', '.'))) && value.trim() !== '';
  },
  
  isBoolean: (value: CellValue): boolean => {
    if (typeof value === 'boolean') return true;
    if (typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    return ['true', 'false', 'sim', 'não', 'nao', 'yes', 'no', 's', 'n', '1', '0'].includes(normalized);
  },
  
  detectType: (value: CellValue): 'string' | 'number' | 'boolean' | 'date' => {
    if (dataTypeDetectors.isDate(value)) return 'date';
    if (dataTypeDetectors.isNumber(value)) return 'number';
    if (dataTypeDetectors.isBoolean(value)) return 'boolean';
    return 'string';
  }
}

export default function ImportarDadosPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('import');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [sheetMetadata, setSheetMetadata] = useState<SheetMetadata | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importTarget, setImportTarget] = useState<string>('leads'); // Pode ser 'leads', 'talents', etc
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importHistory, setImportHistory] = useState<ImportResult[]>([]);
  const [targetFields, setTargetFields] = useState<MappingTarget[]>([]);
  
  // Predefinições para diferentes tipos de importação
  useEffect(() => {
    // Define campos de destino com base no tipo de importação selecionado
    if (importTarget === 'leads') {
      setTargetFields([
        { fieldId: 'name', name: 'Nome', description: 'Nome do lead', type: 'string', required: true },
        { fieldId: 'email', name: 'E-mail', description: 'Endereço de e-mail', type: 'string' },
        { fieldId: 'phone', name: 'Telefone', description: 'Número de telefone', type: 'string' },
        { fieldId: 'company', name: 'Empresa', description: 'Nome da empresa', type: 'string' },
        { fieldId: 'description', name: 'Descrição', description: 'Observações sobre o lead', type: 'string' },
        { fieldId: 'source', name: 'Fonte', description: 'Origem do lead', type: 'string' },
        { fieldId: 'status', name: 'Status', description: 'Status ou etapa atual', type: 'string' }
      ]);
    } else if (importTarget === 'talents') {
      setTargetFields([
        { fieldId: 'fullName', name: 'Nome completo', description: 'Nome completo do talento', type: 'string', required: true },
        { fieldId: 'email', name: 'E-mail', description: 'Endereço de e-mail', type: 'string' },
        { fieldId: 'phone', name: 'Telefone', description: 'Número de telefone', type: 'string' },
        { fieldId: 'city', name: 'Cidade', description: 'Cidade de residência', type: 'string' },
        { fieldId: 'birthDate', name: 'Data de nascimento', description: 'Data de nascimento', type: 'date' },
        { fieldId: 'height', name: 'Altura', description: 'Altura em cm', type: 'number' }
      ]);
    } else {
      // Importação genérica
      setTargetFields([
        { fieldId: 'name', name: 'Nome', description: 'Campo de nome', type: 'string', required: true },
        { fieldId: 'description', name: 'Descrição', description: 'Campo de descrição', type: 'string' },
        { fieldId: 'value', name: 'Valor', description: 'Campo de valor', type: 'number' },
        { fieldId: 'date', name: 'Data', description: 'Campo de data', type: 'date' },
        { fieldId: 'status', name: 'Status', description: 'Campo de status', type: 'string' }
      ]);
    }
  }, [importTarget]);
  
  // Função para analisar os dados da planilha e determinar os metadados
  const analyzeSheetData = (headers: string[], data: ImportedRow[]): SheetMetadata => {
    const sampleSize = Math.min(50, data.length); // Analisa até 50 linhas para determinar tipos
    const samples: Record<string, CellValue[]> = {};
    const types: Record<string, string> = {};
    
    // Inicializa arrays de amostras
    headers.forEach(header => {
      samples[header] = [];
    });
    
    // Coleta amostras de valores
    for (let i = 0; i < sampleSize; i++) {
      const row = data[i];
      headers.forEach(header => {
        if (row[header] !== undefined && row[header] !== null && row[header] !== '') {
          samples[header].push(row[header]);
        }
      });
    }
    
    // Determina o tipo predominante para cada coluna
    headers.forEach(header => {
      const columnSamples = samples[header];
      if (columnSamples.length === 0) {
        types[header] = 'string'; // Default para colunas vazias
        return;
      }
      
      // Conta ocorrências de cada tipo
      const typeCounts = {
        string: 0,
        number: 0,
        boolean: 0,
        date: 0
      };
      
      columnSamples.forEach(value => {
        const type = dataTypeDetectors.detectType(value);
        typeCounts[type]++;
      });
      
      // Determina o tipo predominante
      let maxCount = 0;
      let predominantType = 'string';
      
      Object.entries(typeCounts).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          predominantType = type;
        }
      });
      
      types[header] = predominantType;
    });
    
    return {
      rowCount: data.length,
      columnTypes: types,
      sampleValues: samples
    };
  };
  
  // Função para mapear automaticamente as colunas com base nos metadados
  const autoMapColumns = (headers: string[], metadata: SheetMetadata): ColumnMapping[] => {
    const mappings: ColumnMapping[] = [];
    const mappedFields = new Set<string>();
    
    // Primeiro, tenta mapear por nome exato ou similar
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      let mapped = false;
      
      // Tenta encontrar correspondência para cada campo alvo
      for (const field of targetFields) {
        if (mappedFields.has(field.fieldId)) continue;
        
        // Verifica correspondências diretas ou por palavras-chave
        if (
          lowerHeader === field.fieldId.toLowerCase() ||
          lowerHeader === field.name.toLowerCase() ||
          (field.fieldId === 'name' && (lowerHeader.includes('nome') || lowerHeader.includes('name'))) ||
          (field.fieldId === 'email' && lowerHeader.includes('email')) ||
          (field.fieldId === 'phone' && (lowerHeader.includes('tel') || lowerHeader.includes('fone') || lowerHeader.includes('phone'))) ||
          (field.fieldId === 'company' && (lowerHeader.includes('empresa') || lowerHeader.includes('company'))) ||
          (field.fieldId === 'description' && (lowerHeader.includes('obs') || lowerHeader.includes('desc'))) ||
          (field.fieldId === 'source' && (lowerHeader.includes('fonte') || lowerHeader.includes('source'))) ||
          (field.fieldId === 'status' && (lowerHeader.includes('status') || lowerHeader.includes('etapa')))
        ) {
          mappings.push({
            sourceColumn: header,
            targetField: field.fieldId,
            required: field.required || false,
            type: metadata.columnTypes[header] as 'string' | 'number' | 'boolean' | 'date'
          });
          mappedFields.add(field.fieldId);
          mapped = true;
          break;
        }
      }
      
      // Se não encontrou correspondência, mas é um campo obrigatório, tenta mapear por tipo
      if (!mapped) {
        for (const field of targetFields) {
          if (mappedFields.has(field.fieldId) || !field.required) continue;
          
          // Tenta mapear por tipo de dados
          if (field.type === metadata.columnTypes[header]) {
            mappings.push({
              sourceColumn: header,
              targetField: field.fieldId,
              required: field.required,
              type: metadata.columnTypes[header] as 'string' | 'number' | 'boolean' | 'date'
            });
            mappedFields.add(field.fieldId);
            mapped = true;
            break;
          }
        }
      }
      
      // Se ainda não foi mapeada, adiciona como "extra"
      if (!mapped) {
        mappings.push({
          sourceColumn: header,
          targetField: 'extra_' + header.replace(/\s+/g, '_').toLowerCase(),
          required: false,
          type: (metadata.columnTypes[header] as 'string' | 'number' | 'boolean' | 'date') || 'string'
        });
      }
    });
    
    return mappings;
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
            setHeaders(headers);
            setRows(data);
            
            // Analisar metadados da planilha
            const metadata = analyzeSheetData(headers, data);
            setSheetMetadata(metadata);
            
            // Mapeia automaticamente as colunas
            const mappings = autoMapColumns(headers, metadata);
            setMappings(mappings);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            alert('Erro ao processar o arquivo CSV: ' + error.message);
          }
        });
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        try {
          // Lazy load XLSX para evitar bundle grande
          const XLSX = await import('xlsx');
          const data = await selectedFile.arrayBuffer();
          const workbook = XLSX.read(data);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(worksheet);
          
          if (jsonData.length > 0) {
            const headers = Object.keys(jsonData[0]);
            setHeaders(headers);
            setRows(jsonData);
            
            // Analisar metadados da planilha
            const metadata = analyzeSheetData(headers, jsonData);
            setSheetMetadata(metadata);
            
            // Mapeia automaticamente as colunas
            const mappings = autoMapColumns(headers, metadata);
            setMappings(mappings);
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
  
  // Atualiza um mapeamento específico
  const updateMapping = (index: number, field: Partial<ColumnMapping>) => {
    setMappings(current => {
      const updated = [...current];
      updated[index] = { ...updated[index], ...field };
      return updated;
    });
  };
  
  // Processa os dados para importação
  const processData = async () => {
    if (rows.length === 0 || mappings.length === 0) {
      alert('Não há dados para processar.');
      return;
    }
    
    // Verifica campos obrigatórios
    const requiredFields = targetFields.filter(f => f.required).map(f => f.fieldId);
    const mappedRequiredFields = new Set(mappings
      .filter(m => requiredFields.includes(m.targetField))
      .map(m => m.targetField));
      
    if (mappedRequiredFields.size < requiredFields.length) {
      const missingFields = requiredFields.filter(f => !mappedRequiredFields.has(f));
      alert(`Campos obrigatórios não mapeados: ${missingFields.join(', ')}`);
      return;
    }
    
    setProcessing(true);
    try {
      // Mapeia as linhas conforme os mapeamentos definidos
      const mappedData = rows.map(row => {
        const mappedRow: GenericMappedRow = {};
        const extras: Record<string, CellValue> = {};
        
        // Aplica mapeamentos de colunas
        mappings.forEach(mapping => {
          const { sourceColumn, targetField, type } = mapping;
          let value = row[sourceColumn];
          
          // Converte o valor conforme o tipo esperado
          if (value !== undefined && value !== null) {
            if (type === 'string') {
              value = String(value);
            } else if (type === 'number') {
              const numValue = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
              value = isNaN(numValue) ? 0 : numValue;
            } else if (type === 'boolean') {
              if (typeof value === 'string') {
                const normalized = value.trim().toLowerCase();
                value = ['true', 'sim', 'yes', 's', '1'].includes(normalized);
              } else {
                value = Boolean(value);
              }
            } else if (type === 'date' && value) {
              try {
                // Tenta converter para data ISO
                const dateValue = typeof value === 'string' ? new Date(value) : new Date(Number(value));
                value = dateValue.toISOString();
              } catch {
                value = null; // Data inválida
              }
            }
          }
          
          // Armazena no campo apropriado ou nos extras
          if (targetField.startsWith('extra_')) {
            extras[targetField.substring(6)] = value;
          } else {
            mappedRow[targetField] = value;
          }
        });
        
        // Adiciona campos extras se houver
        if (Object.keys(extras).length > 0) {
          mappedRow.extras = extras;
        }
        
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
      setResult({
        created: 0,
        skipped: 0,
        errors: rows.length,
        errorSamples: ['Erro ao processar os dados: ' + (error as Error).message],
        timestamp: new Date().toISOString()
      });
    } finally {
      setProcessing(false);
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
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
                    <Button onClick={() => document.getElementById('file-upload')?.click()}>
                      <FileUp className="mr-2 h-4 w-4" />
                      Importar CSV/Excel
                    </Button>
                    
                    {file && (
                      <span className="text-sm">
                        Arquivo selecionado: <strong>{file.name}</strong>
                      </span>
                    )}
                  </div>
                </div>
                
                {sheetMetadata && (
                  <div className="border rounded-md p-3 bg-muted/50">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Dados detectados</h3>
                      <Badge variant="outline">{rows.length} linhas</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Foram encontradas {headers.length} colunas. Os tipos de dados foram analisados automaticamente.</p>
                    </div>
                  </div>
                )}
                
                {rows.length > 0 && (
                  <div className="space-y-6">
                    {/* Mapeamento de colunas */}
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-lg">Mapeamento de colunas</CardTitle>
                        <CardDescription>
                          Configure como os campos da planilha serão importados
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {mappings.map((mapping, index) => (
                              <div key={index} className="border rounded-md p-3 space-y-2">
                                <div className="flex justify-between items-center">
                                  <Badge variant={mapping.required ? "destructive" : "outline"} className="text-xs">
                                    {mapping.sourceColumn}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {sheetMetadata?.columnTypes[mapping.sourceColumn] || 'texto'}
                                  </Badge>
                                </div>
                                
                                <div>
                                  <Label htmlFor={`map-${index}`} className="text-xs">Mapear para</Label>
                                  <Select 
                                    value={mapping.targetField} 
                                    onValueChange={(value) => updateMapping(index, { targetField: value })}
                                  >
                                    <SelectTrigger id={`map-${index}`} className="mt-1">
                                      <SelectValue placeholder="Selecione o campo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {/* Campos predefinidos do tipo selecionado */}
                                      <SelectGroup>
                                        <SelectItem value={`extra_${mapping.sourceColumn.replace(/\s+/g, '_').toLowerCase()}`}>
                                          {mapping.sourceColumn} (Manter original)
                                        </SelectItem>
                                        {targetFields.map(field => (
                                          <SelectItem key={field.fieldId} value={field.fieldId}>
                                            {field.name} {field.required && '*'}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Amostra de valores */}
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">Exemplos:</p>
                                  <div className="text-xs max-h-10 overflow-y-auto">
                                    {sheetMetadata?.sampleValues[mapping.sourceColumn]?.slice(0, 3).map((value, i) => (
                                      <div key={i} className="truncate">
                                        {String(value)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              if (!sheetMetadata) return;
                              const newMappings = autoMapColumns(headers, sheetMetadata);
                              setMappings(newMappings);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Remapear automaticamente
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
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
                                {rows.slice(0, 10).map((row, rowIndex) => (
                                  <TableRow key={rowIndex}>
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
                        
                        {rows.length > 10 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Mostrando 10 de {rows.length} linhas
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    
                    <div className="flex items-center gap-4 justify-end">
                      <Button onClick={processData} disabled={processing}>
                        {processing ? 'Processando...' : `Importar ${rows.length} linhas`}
                      </Button>
                    </div>
                  </div>
                )}
                
                {result && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertTitle>Importação concluída</AlertTitle>
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
                          
                          {result.errors > 0 && (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span>{result.errors} erros encontrados</span>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                    {result.errorSamples.length > 0 && (
                      <div className="border rounded-md p-4 space-y-2">
                        <h3 className="font-medium">Exemplos de erros:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {result.errorSamples.map((error, index) => (
                            <li key={index} className="text-sm text-red-500">{error}</li>
                          ))}
                        </ul>
                      </div>
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
    </div>
  );
}
