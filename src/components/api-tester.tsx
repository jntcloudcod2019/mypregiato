import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/services/api/api';
import { toast } from 'sonner';
import { Loader2, Send, Copy, CheckCircle, XCircle } from 'lucide-react';

interface ApiResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  duration: number;
}

export const ApiTester: React.FC = () => {
  const [method, setMethod] = useState<string>('GET');
  const [endpoint, setEndpoint] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const formatJSON = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const validateJSON = (jsonString: string): boolean => {
    if (!jsonString.trim()) return true; // Empty body is valid for GET, DELETE
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const makeRequest = async () => {
    if (!endpoint.trim()) {
      toast.error('Por favor, insira um endpoint');
      return;
    }

    if (requestBody && !validateJSON(requestBody)) {
      setError('JSON inválido no corpo da requisição');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    const startTime = Date.now();

    try {
      let data = null;
      if (requestBody.trim() && ['POST', 'PUT', 'PATCH'].includes(method)) {
        data = JSON.parse(requestBody);
      }

      let result;
      const config = {
        headers: {},
        validateStatus: () => true, // Aceitar todas as respostas para mostrar o status
      };

      switch (method) {
        case 'GET':
          result = await api.get(endpoint, config);
          break;
        case 'POST':
          result = await api.post(endpoint, data, config);
          break;
        case 'PUT':
          result = await api.put(endpoint, data, config);
          break;
        case 'PATCH':
          result = await api.patch(endpoint, data, config);
          break;
        case 'DELETE':
          result = await api.delete(endpoint, config);
          break;
        default:
          throw new Error('Método HTTP não suportado');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      setResponse({
        status: result.status,
        data: result.data,
        headers: result.headers,
        duration,
      });

      if (result.status >= 200 && result.status < 300) {
        toast.success(`Requisição realizada com sucesso! (${duration}ms)`);
      } else {
        toast.warning(`Requisição retornou status ${result.status}`);
      }
    } catch (err: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setError(err.message || 'Erro desconhecido');
      toast.error('Erro na requisição: ' + (err.message || 'Erro desconhecido'));
      
      if (err.response) {
        setResponse({
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
          duration,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-yellow-500';
    if (status >= 400 && status < 500) return 'bg-orange-500';
    if (status >= 500) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Testador de API REST
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Método e Endpoint */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="method">Método HTTP</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {httpMethods.map((m) => (
                    <SelectItem key={m} value={m}>
                      <Badge variant={m === 'GET' ? 'secondary' : m === 'POST' ? 'default' : 'outline'}>
                        {m}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                placeholder="/api/users"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              />
            </div>
          </div>

          {/* Corpo da Requisição */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div>
              <Label htmlFor="requestBody">Corpo da Requisição (JSON)</Label>
              <Textarea
                id="requestBody"
                placeholder={`{
  "name": "João Silva",
  "email": "joao@email.com",
  "role": "user"
}`}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              {requestBody && !validateJSON(requestBody) && (
                <p className="text-red-500 text-sm mt-1">JSON inválido</p>
              )}
            </div>
          )}

          {/* Botão de Envio */}
          <Button
            onClick={makeRequest}
            disabled={loading || (requestBody && !validateJSON(requestBody))}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Requisição
              </>
            )}
          </Button>

          {/* Erro */}
          {error && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resposta */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resposta da API</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(response.status)}
                <Badge className={`${getStatusColor(response.status)} text-white`}>
                  {response.status}
                </Badge>
                <Badge variant="outline">
                  {response.duration}ms
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Headers de Resposta</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(formatJSON(response.headers))}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {formatJSON(response.headers)}
                </pre>
              </div>
            </div>

            <Separator />

            {/* Dados */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Dados da Resposta</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(formatJSON(response.data))}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg max-h-96 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {formatJSON(response.data)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exemplos de uso */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Usuários</h4>
              <ul className="space-y-1 text-gray-600">
                <li>GET /api/users - Listar usuários</li>
                <li>POST /api/users - Criar usuário</li>
                <li>PUT /api/users/123 - Atualizar usuário</li>
                <li>DELETE /api/users/123 - Remover usuário</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Treinamentos</h4>
              <ul className="space-y-1 text-gray-600">
                <li>GET /api/trainings - Listar treinamentos</li>
                <li>POST /api/trainings - Criar treinamento</li>
                <li>GET /api/trainings/123 - Obter treinamento</li>
                <li>DELETE /api/trainings/123 - Remover treinamento</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};