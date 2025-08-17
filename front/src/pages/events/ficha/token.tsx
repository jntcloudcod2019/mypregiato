import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  idade: string;
  altura: string;
  cidade: string;
  experiencia: string;
  comoSoube: string;
  observacoes: string;
  aceitaTermos: boolean;
}

export default function FichaDigitalPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventInfo, setEventInfo] = useState<{ nome: string; data: string; local: string } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
    idade: '',
    altura: '',
    cidade: '',
    experiencia: '',
    comoSoube: '',
    observacoes: '',
    aceitaTermos: false
  });
  
  useEffect(() => {
    const fetchEventInfo = async () => {
      setLoading(true);
      try {
        // Em uma implementação real, faria uma chamada API aqui
        // const response = await api.get(`/events/ficha/${token}`);
        // setEventInfo(response.data);
        
        // Simulação de dados para demonstração
        setTimeout(() => {
          setEventInfo({
            nome: 'Seletiva Verão 2024',
            data: '15/01/2024',
            local: 'Studio Central - Av. Paulista, 1000'
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar informações do evento:', error);
        setError('Não foi possível carregar as informações do evento. Verifique o link ou tente novamente mais tarde.');
        setLoading(false);
      }
    };
    
    if (token) {
      fetchEventInfo();
    } else {
      setError('Token de evento inválido');
      setLoading(false);
    }
  }, [token]);
  
  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Em uma implementação real, faria uma chamada API aqui
      // await api.post(`/events/ficha/${token}/submit`, formData);
      
      // Simulação de envio para demonstração
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setError('Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2">Carregando informações do evento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()} className="w-full">
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Inscrição Confirmada!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg mb-4">Obrigado por se inscrever no evento:</p>
            <p className="font-bold text-xl">{eventInfo?.nome}</p>
            <div className="mt-4 space-y-2">
              <p><strong>Data:</strong> {eventInfo?.data}</p>
              <p><strong>Local:</strong> {eventInfo?.local}</p>
            </div>
            <p className="mt-6 text-muted-foreground">
              Você receberá um e-mail com a confirmação da sua inscrição e mais detalhes sobre o evento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">{eventInfo?.nome}</CardTitle>
          <CardDescription className="text-center">
            <div>Data: {eventInfo?.data}</div>
            <div>Local: {eventInfo?.local}</div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idade">Idade</Label>
                <Input
                  id="idade"
                  name="idade"
                  value={formData.idade}
                  onChange={(e) => handleChange('idade', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  id="altura"
                  name="altura"
                  value={formData.altura}
                  onChange={(e) => handleChange('altura', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experiencia">Experiência prévia</Label>
              <Select
                value={formData.experiencia}
                onValueChange={(value) => handleChange('experiencia', value)}
              >
                <SelectTrigger id="experiencia">
                  <SelectValue placeholder="Selecione sua experiência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Nenhuma experiência</SelectItem>
                  <SelectItem value="iniciante">Iniciante (menos de 1 ano)</SelectItem>
                  <SelectItem value="intermediario">Intermediário (1-3 anos)</SelectItem>
                  <SelectItem value="avancado">Avançado (mais de 3 anos)</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comoSoube">Como soube do evento?</Label>
              <Select
                value={formData.comoSoube}
                onValueChange={(value) => handleChange('comoSoube', value)}
              >
                <SelectTrigger id="comoSoube">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="amigos">Indicação de amigos</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações adicionais</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="aceitaTermos"
                checked={formData.aceitaTermos}
                onCheckedChange={(checked) => handleChange('aceitaTermos', Boolean(checked))}
                required
              />
              <Label htmlFor="aceitaTermos" className="text-sm">
                Li e aceito os termos de participação e política de privacidade
              </Label>
            </div>
            
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Confirmar inscrição'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
