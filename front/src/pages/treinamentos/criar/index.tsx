import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Play, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Aula {
  id: string;
  nome: string;
  descricao: string;
  linkVideo: string;
}

const CriarTreinamentoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    quantidadeAulas: 0
  });
  
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaAtual, setAulaAtual] = useState({
    nome: '',
    descricao: '',
    linkVideo: ''
  });
  
  const [showPreview, setShowPreview] = useState(false);

  const adicionarAula = () => {
    if (!aulaAtual.nome || !aulaAtual.linkVideo) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome da aula e link do vídeo são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const novaAula: Aula = {
      id: Date.now().toString(),
      ...aulaAtual
    };

    setAulas([...aulas, novaAula]);
    setAulaAtual({ nome: '', descricao: '', linkVideo: '' });
    
    toast({
      title: "Aula adicionada",
      description: `"${novaAula.nome}" foi adicionada ao curso.`
    });
  };

  const removerAula = (id: string) => {
    setAulas(aulas.filter(aula => aula.id !== id));
    toast({
      title: "Aula removida",
      description: "A aula foi removida do curso."
    });
  };

  const salvarCurso = () => {
    if (!formData.nome || !formData.descricao || aulas.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e adicione pelo menos uma aula.",
        variant: "destructive"
      });
      return;
    }

    const novoCurso = {
      id: Date.now().toString(),
      nome: formData.nome,
      descricao: formData.descricao,
      quantidadeAulas: aulas.length,
      aulas: aulas.map(aula => ({
        ...aula,
        assistida: false
      })),
      progresso: 0,
      concluido: false,
      avaliacoes: { likes: 0, dislikes: 0 },
      criadoEm: new Date().toISOString().split('T')[0]
    };

    // Salvar no localStorage
    const cursosStorage = localStorage.getItem('treinamentos_cursos');
    const cursosExistentes = cursosStorage ? JSON.parse(cursosStorage) : [];
    cursosExistentes.push(novoCurso);
    localStorage.setItem('treinamentos_cursos', JSON.stringify(cursosExistentes));

    toast({
      title: "Curso criado com sucesso!",
      description: `"${formData.nome}" foi criado e está disponível.`
    });

    navigate('/treinamentos');
  };

  const formatarLinkGoogleDrive = (link: string) => {
    // Converter link do Google Drive para formato de embed
    if (link.includes('drive.google.com')) {
      const fileId = link.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return link;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/treinamentos')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-variant))] bg-clip-text text-transparent">
            Criar Novo Treinamento
          </h1>
          <p className="text-muted-foreground">
            Crie um curso online completo com vídeos e materiais
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Curso */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Treinamento *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Fundamentos de Fotografia"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição do Treinamento *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o que os alunos aprenderão neste curso..."
                  rows={4}
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Adicionar Aula */}
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Aula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nomeAula">Nome da Aula *</Label>
                <Input
                  id="nomeAula"
                  placeholder="Ex: Introdução à Iluminação"
                  value={aulaAtual.nome}
                  onChange={(e) => setAulaAtual({...aulaAtual, nome: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="descricaoAula">Descrição da Aula</Label>
                <Textarea
                  id="descricaoAula"
                  placeholder="Descreva o conteúdo desta aula..."
                  rows={3}
                  value={aulaAtual.descricao}
                  onChange={(e) => setAulaAtual({...aulaAtual, descricao: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="linkVideo">Link do Vídeo (Google Drive) *</Label>
                <Input
                  id="linkVideo"
                  placeholder="https://drive.google.com/file/d/..."
                  value={aulaAtual.linkVideo}
                  onChange={(e) => setAulaAtual({...aulaAtual, linkVideo: e.target.value})}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Cole o link completo do arquivo no Google Drive
                </p>
              </div>

              <Button onClick={adicionarAula} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Aula
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Playlist Lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Playlist do Curso
                <Badge variant="outline">{aulas.length} aulas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aulas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma aula adicionada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aulas.map((aula, index) => (
                    <div key={aula.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {aula.nome}
                        </h4>
                        {aula.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {aula.descricao}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removerAula(aula.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview do Curso */}
          {formData.nome && (
            <Card>
              <CardHeader>
                <CardTitle>Preview do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-medium">{formData.nome}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {formData.descricao}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{aulas.length} aulas</span>
                  <Badge variant="secondary">Novo</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="space-y-3">
            <Button
              onClick={salvarCurso}
              className="w-full"
              disabled={!formData.nome || !formData.descricao || aulas.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Criar Curso
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriarTreinamentoPage;