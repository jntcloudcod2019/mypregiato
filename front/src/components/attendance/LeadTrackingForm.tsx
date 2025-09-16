import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

interface SeletivaInfo {
  dateSeletiva?: string;
  localSeletiva?: string;
  horarioAgendadoLead?: string;
  nomeLead?: string;
  codOperator?: string;
}

interface UpdateLeadTrackingDto {
  emailOperator: string;
  phoneLead: string;
  statusContact: boolean;
  dateContact?: string;
  statusSeletiva: boolean;
  seletivaInfo?: SeletivaInfo;
}

interface LeadTrackingFormProps {
  isVisible: boolean;
  phoneLead: string;
  onUpdateSuccess?: () => void;
}

export const LeadTrackingForm: React.FC<LeadTrackingFormProps> = ({ 
  isVisible, 
  phoneLead,
  onUpdateSuccess 
}) => {
  const { user } = useUser();
  
  // Estados dos switches
  const [statusContact, setStatusContact] = useState(false);
  const [statusSeletiva, setStatusSeletiva] = useState(false);
  
  // Estados das datas
  const [dateContact, setDateContact] = useState<Date | null>(null);
  const [dateSeletiva, setDateSeletiva] = useState<Date | null>(null);
  
  // Estados dos campos de texto
  const [nomeLead, setNomeLead] = useState('');
  const [codOperator, setCodOperator] = useState('');
  const [horarioAgendadoLead, setHorarioAgendadoLead] = useState('');
  
  // Estados do endereço
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  
  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Função para buscar CEP via ViaCEP
  const buscarCep = async (cepValue: string) => {
    if (cepValue.length !== 8) return;
    
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setRua(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || '');
      } else {
        toast({
          title: "CEP não encontrado",
          description: "O CEP informado não foi encontrado.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar as informações do CEP.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Função para formatar data para o backend
  const formatDateForBackend = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Função para montar o payload
  const montarPayload = (): UpdateLeadTrackingDto => {
    const emailOperator = user?.emailAddresses?.[0]?.emailAddress || '';
    
    const seletivaInfo: SeletivaInfo | undefined = statusSeletiva ? {
      dateSeletiva: formatDateForBackend(dateSeletiva),
      localSeletiva: `${rua}, ${bairro}, ${cidade}, ${estado}`.replace(/^,\s*|,\s*$/g, ''),
      horarioAgendadoLead,
      nomeLead,
      codOperator
    } : undefined;

    return {
      emailOperator,
      phoneLead,
      statusContact,
      dateContact: formatDateForBackend(dateContact),
      statusSeletiva,
      seletivaInfo
    };
  };

  // Função para atualizar o lead
  const handleUpdateLead = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast({
        title: "Erro",
        description: "Email do operador não encontrado.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = montarPayload();
      
      const response = await axios.put(
        `${API_BASE_URL}/api/operator-leads/update-tracking`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: response.data.message || "Lead atualizado com sucesso!",
          variant: "default"
        });
        
        // Limpar formulário
        setStatusContact(false);
        setStatusSeletiva(false);
        setDateContact(null);
        setDateSeletiva(null);
        setNomeLead('');
        setCodOperator('');
        setHorarioAgendadoLead('');
        setCep('');
        setRua('');
        setBairro('');
        setCidade('');
        setEstado('');
        
        onUpdateSuccess?.();
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar lead');
      }
    } catch (error: unknown) {
      console.error('Erro ao atualizar lead:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || "Erro ao atualizar lead";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para buscar CEP quando o valor mudar
  useEffect(() => {
    if (cep.length === 8) {
      buscarCep(cep);
    }
  }, [cep]);

  if (!isVisible) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Atualizar Progresso do Lead
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status de Contato */}
          <div className="flex items-center justify-between">
            <Label htmlFor="status-contact" className="text-sm font-medium">
              Contato Realizado
            </Label>
            <Switch
              id="status-contact"
              checked={statusContact}
              onCheckedChange={setStatusContact}
            />
          </div>

          {/* Data do Contato */}
          {statusContact && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data do Contato</Label>
              <DatePicker
                value={dateContact}
                onChange={setDateContact}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    placeholder: 'Selecione a data do contato'
                  }
                }}
              />
            </div>
          )}

          {/* Status da Seletiva */}
          <div className="flex items-center justify-between">
            <Label htmlFor="status-seletiva" className="text-sm font-medium">
              Seletiva Agendada
            </Label>
            <Switch
              id="status-seletiva"
              checked={statusSeletiva}
              onCheckedChange={setStatusSeletiva}
            />
          </div>

          {/* Campos da Seletiva */}
          {statusSeletiva && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm">Informações da Seletiva</h4>
              
              {/* Data da Seletiva */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data da Seletiva</Label>
                <DatePicker
                  value={dateSeletiva}
                  onChange={setDateSeletiva}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      placeholder: 'Selecione a data da seletiva'
                    }
                  }}
                />
              </div>

              {/* Nome do Lead */}
              <div className="space-y-2">
                <Label htmlFor="nome-lead" className="text-sm font-medium">
                  Nome do Lead
                </Label>
                <Input
                  id="nome-lead"
                  value={nomeLead}
                  onChange={(e) => setNomeLead(e.target.value)}
                  placeholder="Digite o nome do lead"
                />
              </div>

              {/* Código do Operador */}
              <div className="space-y-2">
                <Label htmlFor="cod-operator" className="text-sm font-medium">
                  Código do Operador
                </Label>
                <Input
                  id="cod-operator"
                  value={codOperator}
                  onChange={(e) => setCodOperator(e.target.value)}
                  placeholder="Digite o código do operador"
                />
              </div>

              {/* Horário Agendado */}
              <div className="space-y-2">
                <Label htmlFor="horario-agendado" className="text-sm font-medium">
                  Horário Agendado
                </Label>
                <Input
                  id="horario-agendado"
                  value={horarioAgendadoLead}
                  onChange={(e) => setHorarioAgendadoLead(e.target.value)}
                  placeholder="Ex: 14:30"
                />
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h5 className="font-medium text-sm">Local da Seletiva</h5>
                
                {/* CEP */}
                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-sm font-medium">
                    CEP
                  </Label>
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, ''))}
                    placeholder="00000-000"
                    maxLength={8}
                  />
                </div>

                {/* Rua */}
                <div className="space-y-2">
                  <Label htmlFor="rua" className="text-sm font-medium">
                    Rua
                  </Label>
                  <Input
                    id="rua"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    placeholder="Nome da rua"
                    disabled={isLoadingCep}
                  />
                </div>

                {/* Bairro */}
                <div className="space-y-2">
                  <Label htmlFor="bairro" className="text-sm font-medium">
                    Bairro
                  </Label>
                  <Input
                    id="bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Nome do bairro"
                    disabled={isLoadingCep}
                  />
                </div>

                {/* Cidade e Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="text-sm font-medium">
                      Cidade
                    </Label>
                    <Input
                      id="cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Nome da cidade"
                      disabled={isLoadingCep}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-sm font-medium">
                      Estado
                    </Label>
                    <Input
                      id="estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                      disabled={isLoadingCep}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Atualizar */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleUpdateLead}
              disabled={isLoading}
              className="min-w-[150px]"
            >
              {isLoading ? 'Atualizando...' : 'Atualizar Progresso'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};
