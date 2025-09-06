import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"

// Interfaces para tipagem
interface ImportRow {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  description?: string;
  source?: string;
  status?: string;
  [key: string]: string | undefined; // Para campos dinâmicos
}

interface RawRow {
  [key: string]: string | number | boolean | null | undefined;
}

interface LeadItem {
  id: string | number;
  nome: string;
  email: string;
  telefone: string;
  empresa?: string;
  etapa: string;
  responsavel?: string;
  dataUltimoContato?: string;
  valor?: string;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Trash2, 
  Mail, 
  Phone,
  Building,
  User
} from "lucide-react"
import { Link } from "react-router-dom"
import { talentsService, Talent } from '@/services/crm/talents-service'
import api from '@/services/whatsapp-api'
import { ErrorBoundary } from '../../../components/common/error-boundary'
import Papa from 'papaparse'
// Importação lazy do XLSX para evitar custo e possíveis conflitos de bundling
import FileTablePreview from '../../../components/crm/FileTablePreview'

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEtapa, setFilterEtapa] = useState("todas")
  const [filterResponsavel, setFilterResponsavel] = useState("todos")
  const [talents, setTalents] = useState<Talent[]>([])
  const [leadsApi, setLeadsApi] = useState<LeadItem[]>([])
  const [importing, setImporting] = useState(false)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [editRows, setEditRows] = useState<RawRow[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: '', email: '', phone: '', company: '', description: '', source: '', status: ''
  })

  const targetFields: Array<{ key: keyof typeof mapping; label: string }> = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'company', label: 'Empresa' },
    { key: 'source', label: 'Fonte' },
    { key: 'status', label: 'Status' },
    { key: 'description', label: 'Observações' },
  ]

  const guessMapping = (headers: string[]) => {
    const h = headers.map(x => x.toLowerCase())
    const find = (...cands: string[]) => {
      for (const c of cands) {
        const i = h.findIndex(x => x.includes(c))
        if (i >= 0) return headers[i]
      }
      return ''
    }
    return {
      name: find('nome', 'name', 'full'),
      email: find('mail', 'email'),
      phone: find('tel', 'fone', 'phone', 'contato'),
      company: find('empresa', 'company', 'cidade', 'city'),
      description: find('obs', 'observa', 'nota', 'notes', 'descri'),
      source: find('origem', 'fonte', 'source'),
      status: find('status', 'etapa')
    }
  }

  const applyMapping = (rows: RawRow[], _map: Record<string, string>) => {
    // Mantém os dados brutos para edição dinâmica; normalização acontece no confirmar
    setEditRows(rows)
  }

  // Dados de leads virão da API - sem dados mockados

  // Etapas e responsáveis virão da API - sem dados hardcoded

  const getEtapaBadge = (etapa: string) => {
    // Mapeamento básico de etapas - em produção virá da API
    const etapaMap: Record<string, { label: string; cor: string }> = {
      'novo': { label: 'Novo', cor: 'bg-blue-500' },
      'contato': { label: 'Contato', cor: 'bg-yellow-500' },
      'agendamento': { label: 'Agendamento', cor: 'bg-orange-500' },
      'seletiva': { label: 'Seletiva', cor: 'bg-indigo-500' },
      'contrato': { label: 'Contrato', cor: 'bg-green-500' },
      'finalizado': { label: 'Finalizado', cor: 'bg-emerald-600' },
      'perdido': { label: 'Perdido', cor: 'bg-red-500' }
    }
    
    return etapaMap[etapa] || { label: etapa, cor: "bg-gray-500" }
  }

  useEffect(() => { 
    (async() => { 
      try { 
        setTalents(await talentsService.list()) 
      } catch (error) { 
        console.error("Erro ao carregar talentos:", error);
      } 
    })() 
  }, [])

  useEffect(() => { 
    (async() => {
      try {
        const { data } = await api.get('/leads', { params: { page: 1, pageSize: 1000 } })
        
        interface ApiLeadData {
          id: string | number;
          name?: string;
          email?: string;
          phone?: string;
          company?: string;
          status?: string;
          assignedTo?: string;
          lastContactDate?: string;
          estimatedValue?: number | string;
        }
        
        const mapped = (Array.isArray(data) ? data : data?.items || []).map((l: ApiLeadData) => ({
          id: l.id,
          nome: l.name || 'Sem nome',
          email: l.email || '',
          telefone: l.phone || '',
          empresa: l.company || '',
          etapa: l.status || 'Novo',
          responsavel: l.assignedTo || '—',
          dataUltimoContato: l.lastContactDate ? new Date(l.lastContactDate).toLocaleDateString('pt-BR') : '',
          valor: l.estimatedValue ? String(l.estimatedValue) : ''
        }))
        setLeadsApi(mapped)
      } catch (error) {
        console.error("Erro ao carregar leads da API:", error);
      }
    })() 
  }, [])

  const dynamicLeads = talents.map(t => ({
    id: t.id,
    nome: t.fullName || 'Sem nome',
    email: t.email || '',
    telefone: t.phone || '',
    empresa: t.city || '',
    etapa: t.stage || (t.status === 'aprovado' ? 'contrato' : t.status === 'avaliacao' ? 'contato' : t.status === 'rejeitado' ? 'perdido' : 'novo'),
    responsavel: '—',
    dataUltimoContato: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('pt-BR') : '',
    valor: ''
  }))

  const dataset = leadsApi.length > 0 ? leadsApi : (dynamicLeads.length > 0 ? dynamicLeads : [])

  const filteredLeads = dataset.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.empresa.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEtapa = filterEtapa === "todas" || lead.etapa === filterEtapa
    const matchesResponsavel = filterResponsavel === "todos" || lead.responsavel === filterResponsavel

    return matchesSearch && matchesEtapa && matchesResponsavel
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Gestão de Leads
          </h1>
        </div>
        <Link to="/crm/leads/novo">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="leads-search"
                  name="leads-search"
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
                              <input id="lead-import" name="lead-import" type="file" accept=".csv,.txt,.xls,.xlsx" className="hidden" onChange={async (e)=>{
                const f = e.target.files?.[0]; if(!f) return;
                setImporting(true);
                const ext = f.name.split('.').pop()?.toLowerCase();
                const finalize = () => { 
                  setImporting(false); 
                  // Reset o input usando uma forma segura
                  const target = e.target as HTMLInputElement;
                  target.value = '';
                };
                
                if (ext === 'xls' || ext === 'xlsx') {
                  try {
                    // Importar biblioteca XLSX dinamicamente
                    interface XlsxUtils {
                      sheet_to_json<T>(sheet: unknown, opts?: { defval: string }): T[];
                    }
                    
                    interface XlsxModule {
                      read(data: ArrayBuffer): { 
                        Sheets: Record<string, unknown>;
                        SheetNames: string[];
                      };
                      utils: XlsxUtils;
                    }
                    
                    const { read, utils } = await import('xlsx') as unknown as XlsxModule;
                    const data = await f.arrayBuffer();
                    const wb = read(data);
                    const sheet = wb.Sheets[wb.SheetNames[0]];
                    const json = utils.sheet_to_json<RawRow>(sheet, { defval: '' });
                    const headers = json.length > 0 ? Object.keys(json[0]) : [];
                    setRawHeaders(headers);
                    setRawRows(json);
                    setEditRows(json);
                    const map = guessMapping(headers);
                    setMapping(map);
                    applyMapping(json, map);
                  } catch (error) {
                    console.error("Erro ao processar arquivo Excel:", error);
                  } finally { 
                    finalize(); 
                  }
                } else {
                  // Processar CSV com PapaParse
                  Papa.parse(f, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                      try {
                        // Determinar cabeçalhos do CSV
                        type PapaResults = {
                          data: RawRow[];
                          meta: {
                            fields?: string[];
                          };
                        };
                        
                        const papaResults = results as PapaResults;
                        const headers = papaResults.meta.fields || 
                          (papaResults.data.length > 0 ? Object.keys(papaResults.data[0]) : []);
                        
                        setRawHeaders(headers);
                        setRawRows(papaResults.data);
                        setEditRows(papaResults.data);
                        const map = guessMapping(headers);
                        setMapping(map);
                        applyMapping(papaResults.data, map);
                      } catch (error) {
                        console.error("Erro ao processar arquivo CSV:", error);
                      } finally { 
                        finalize(); 
                      }
                    },
                    error: (error) => {
                      console.error("Erro ao analisar CSV:", error);
                      finalize();
                    }
                  });
                }
              }} />
              <Button disabled={importing} onClick={()=>document.getElementById('lead-import')?.click()}>
                Importar CSV/Excel
              </Button>
              {/* Preview simples como fallback: o usuário pode pré-visualizar um arquivo independente */}
              <div className="mt-2">
                <FileTablePreview />
              </div>
            </div>
            <Select value={filterEtapa} onValueChange={setFilterEtapa}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as etapas</SelectItem>
                {etapas.map(etapa => (
                  <SelectItem key={etapa.value} value={etapa.value}>
                    {etapa.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos responsáveis</SelectItem>
                {responsaveis.map(responsavel => (
                  <SelectItem key={responsavel} value={responsavel}>
                    {responsavel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mapeamento de colunas com ErrorBoundary */}
      <ErrorBoundary>
        {rawHeaders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mapeamento de Colunas</CardTitle>
              <CardDescription>Selecione qual coluna da planilha alimenta cada campo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {targetFields.map(tf => (
                  <div key={tf.key} className="space-y-1">
                    <div className="text-xs text-muted-foreground">{tf.label}</div>
                    <Select value={mapping[tf.key] || ''} onValueChange={(v)=>{ const map = { ...mapping, [tf.key]: v }; setMapping(map); applyMapping(rawRows, map); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">(vazio)</SelectItem>
                        {rawHeaders.map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </ErrorBoundary>

      {/* Pré-visualização dinâmica da planilha */}
      <ErrorBoundary>
        {rawHeaders.length > 0 && editRows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização de Importação ({editRows.length})</CardTitle>
              <CardDescription>Edite os valores diretamente nas células</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex gap-2 mb-3">
              <Button variant="outline" onClick={()=>{ setRawHeaders([]); setRawRows([]); setEditRows([]); }}>Limpar</Button>
              <Button onClick={async ()=>{
                try {
                  // Constrói payload canônico + extras com TODAS as colunas
                  const mappedCols = Object.values(mapping).filter(Boolean)
                  
                  interface ImportPayload {
                    name: string;
                    email: string;
                    phone: string;
                    company: string;
                    description: string;
                    source: string;
                    status: string;
                    extras: Record<string, string | number | boolean | null | undefined>;
                  }
                  
                  const payload: ImportPayload[] = editRows.map(row => {
                    const canonical = {
                      name: String(mapping.name ? row[mapping.name] ?? '' : '').trim() || 'Sem nome',
                      email: String(mapping.email ? row[mapping.email] ?? '' : '').trim(),
                      phone: String(mapping.phone ? row[mapping.phone] ?? '' : '').trim(),
                      company: String(mapping.company ? row[mapping.company] ?? '' : '').trim(),
                      description: String(mapping.description ? row[mapping.description] ?? '' : '').trim(),
                      source: String(mapping.source ? row[mapping.source] ?? '' : 'Import').trim(),
                      status: String(mapping.status ? row[mapping.status] ?? '' : 'Novo').trim() || 'Novo',
                      extras: {} as Record<string, string | number | boolean | null | undefined>
                    }
                    
                    // Incluir campos extras que não foram mapeados
                    for (const h of rawHeaders) { 
                      if (!mappedCols.includes(h)) {
                        canonical.extras[h] = row[h];
                      }
                    }
                    
                    return canonical;
                  })
                  
                  try { 
                    await api.post('/leads/import', payload);
                  } catch (apiError) {
                    console.error("Falha ao importar via API principal:", apiError);
                    // Tentar método alternativo
                    await talentsService.bulkImport(payload);
                  }
                  
                  // Recarregar lista após importação
                  setTalents(await talentsService.list());
                  
                  // Limpar dados de importação
                  setRawHeaders([]); 
                  setRawRows([]);
                  setEditRows([]);
                } catch (error) {
                  console.error("Erro ao processar importação:", error);
                }
              }}>Confirmar Importação</Button>
            </div>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {rawHeaders.map(h => (<TableHead key={h}>{h}</TableHead>))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                     {editRows.slice(0, 100).map((row, idx) => (
                    <TableRow key={idx}>
                      {rawHeaders.map((h) => (
                        <TableCell key={h}>
                             <Input id={`cell-${idx}-${h}`} name={`cell-${h}`} value={String(row[h] ?? '')} onChange={e=>{
                            const v = e.target.value
                            setEditRows(prev => { const n=[...prev]; n[idx] = { ...n[idx], [h]: v }; return n; })
                          }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>
        )}
      </ErrorBoundary>

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            Todos os leads registrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Último Contato</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const etapaBadge = getEtapaBadge(lead.etapa)
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{lead.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.telefone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {lead.empresa}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <div className={`w-2 h-2 rounded-full ${etapaBadge.cor}`} />
                          {etapaBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.responsavel}</TableCell>
                      <TableCell>{lead.dataUltimoContato}</TableCell>
                      <TableCell className="font-medium">{lead.valor}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/crm/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/crm/leads/${lead.id}/editar`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}