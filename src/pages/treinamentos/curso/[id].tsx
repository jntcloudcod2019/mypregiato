import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Circle, 
  ThumbsUp, 
  ThumbsDown, 
  Download,
  Star,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Aula {
  id: string;
  nome: string;
  descricao: string;
  linkVideo: string;
  assistida: boolean;
  duracao?: string;
}

interface Curso {
  id: string;
  nome: string;
  descricao: string;
  quantidadeAulas: number;
  aulas: Aula[];
  progresso: number;
  concluido: boolean;
  avaliacoes: { likes: number; dislikes: number };
  criadoEm: string;
}

const CursoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [curso, setCurso] = useState<Curso | null>(null);
  const [aulaAtiva, setAulaAtiva] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [avaliacaoUsuario, setAvaliacaoUsuario] = useState<'like' | 'dislike' | null>(null);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);

  // Carregar curso do localStorage
  useEffect(() => {
    const cursosStorage = localStorage.getItem('treinamentos_cursos');
    if (cursosStorage) {
      const cursos = JSON.parse(cursosStorage);
      const cursoEncontrado = cursos.find((c: Curso) => c.id === id);
      if (cursoEncontrado) {
        setCurso(cursoEncontrado);
        // Definir primeira aula não assistida como ativa
        const primeiraAulaNaoAssistida = cursoEncontrado.aulas.find((aula: Aula) => !aula.assistida);
        if (primeiraAulaNaoAssistida) {
          setAulaAtiva(primeiraAulaNaoAssistida.id);
        } else if (cursoEncontrado.aulas.length > 0) {
          setAulaAtiva(cursoEncontrado.aulas[0].id);
        }
      }
    }
  }, [id]);

  // Carregar avaliação do usuário
  useEffect(() => {
    if (curso) {
      const avaliacaoStorage = localStorage.getItem(`curso_${curso.id}_avaliacao`);
      if (avaliacaoStorage) {
        setAvaliacaoUsuario(avaliacaoStorage as 'like' | 'dislike');
      }
    }
  }, [curso]);

  const marcarAulaComoAssistida = (aulaId: string) => {
    if (!curso) return;

    const cursosStorage = localStorage.getItem('treinamentos_cursos');
    if (cursosStorage) {
      const cursos = JSON.parse(cursosStorage);
      const cursoIndex = cursos.findIndex((c: Curso) => c.id === curso.id);
      
      if (cursoIndex !== -1) {
        const aulaIndex = cursos[cursoIndex].aulas.findIndex((a: Aula) => a.id === aulaId);
        if (aulaIndex !== -1 && !cursos[cursoIndex].aulas[aulaIndex].assistida) {
          cursos[cursoIndex].aulas[aulaIndex].assistida = true;
          
          // Recalcular progresso
          const aulasAssistidas = cursos[cursoIndex].aulas.filter((a: Aula) => a.assistida).length;
          const novoProgresso = Math.round((aulasAssistidas / cursos[cursoIndex].aulas.length) * 100);
          cursos[cursoIndex].progresso = novoProgresso;
          
          // Verificar se o curso foi concluído
          if (novoProgresso === 100) {
            cursos[cursoIndex].concluido = true;
            setMostrarFeedback(true);
          }
          
          localStorage.setItem('treinamentos_cursos', JSON.stringify(cursos));
          setCurso(cursos[cursoIndex]);
          
          toast({
            title: "Aula concluída!",
            description: `Progresso do curso: ${novoProgresso}%`
          });
        }
      }
    }
  };

  const avaliarCurso = (tipo: 'like' | 'dislike') => {
    if (!curso) return;

    const cursosStorage = localStorage.getItem('treinamentos_cursos');
    if (cursosStorage) {
      const cursos = JSON.parse(cursosStorage);
      const cursoIndex = cursos.findIndex((c: Curso) => c.id === curso.id);
      
      if (cursoIndex !== -1) {
        // Remover avaliação anterior se existir
        if (avaliacaoUsuario === 'like') {
          cursos[cursoIndex].avaliacoes.likes--;
        } else if (avaliacaoUsuario === 'dislike') {
          cursos[cursoIndex].avaliacoes.dislikes--;
        }
        
        // Adicionar nova avaliação
        if (tipo === 'like') {
          cursos[cursoIndex].avaliacoes.likes++;
        } else {
          cursos[cursoIndex].avaliacoes.dislikes++;
        }
        
        localStorage.setItem('treinamentos_cursos', JSON.stringify(cursos));
        localStorage.setItem(`curso_${curso.id}_avaliacao`, tipo);
        
        setCurso(cursos[cursoIndex]);
        setAvaliacaoUsuario(tipo);
        
        toast({
          title: "Avaliação registrada",
          description: `Obrigado pelo seu ${tipo === 'like' ? 'like' : 'dislike'}!`
        });
      }
    }
  };

  const enviarFeedback = () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback obrigatório",
        description: "Por favor, digite seu feedback sobre o curso.",
        variant: "destructive"
      });
      return;
    }

    // Salvar feedback (por enquanto apenas no localStorage)
    localStorage.setItem(`curso_${curso?.id}_feedback`, feedback);
    
    toast({
      title: "Feedback enviado!",
      description: "Obrigado pela sua opinião sobre o curso."
    });
    
    setFeedback('');
  };

  const gerarCertificado = () => {
    if (!curso) return;

    const certificadoHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificado de Participação</title>
          <style>
              body {
                  font-family: 'Times New Roman', serif;
                  margin: 0;
                  padding: 40px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  display: flex;
                  justify-content: center;
                  align-items: center;
              }
              .certificado {
                  background: white;
                  padding: 60px;
                  border-radius: 20px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 800px;
                  border: 8px solid #f0f0f0;
              }
              .header {
                  border-bottom: 3px solid #667eea;
                  padding-bottom: 20px;
                  margin-bottom: 40px;
              }
              .titulo {
                  font-size: 36px;
                  color: #667eea;
                  margin-bottom: 10px;
                  font-weight: bold;
              }
              .subtitulo {
                  font-size: 18px;
                  color: #666;
                  margin-bottom: 30px;
              }
              .nome-usuario {
                  font-size: 32px;
                  color: #333;
                  font-weight: bold;
                  margin: 30px 0;
                  border-bottom: 2px solid #667eea;
                  padding-bottom: 10px;
                  display: inline-block;
              }
              .texto-curso {
                  font-size: 20px;
                  color: #555;
                  margin: 20px 0;
                  line-height: 1.6;
              }
              .nome-curso {
                  font-weight: bold;
                  color: #667eea;
              }
              .data {
                  font-size: 16px;
                  color: #888;
                  margin-top: 40px;
              }
              .assinatura {
                  margin-top: 60px;
                  border-top: 2px solid #333;
                  width: 300px;
                  margin-left: auto;
                  margin-right: auto;
                  padding-top: 10px;
                  font-size: 14px;
                  color: #666;
              }
          </style>
      </head>
      <body>
          <div class="certificado">
              <div class="header">
                  <div class="titulo">CERTIFICADO DE PARTICIPAÇÃO</div>
                  <div class="subtitulo">Pregiato Management</div>
              </div>
              
              <div class="conteudo">
                  <p class="texto-curso">Certificamos que</p>
                  <div class="nome-usuario">[NOME DO USUÁRIO]</div>
                  <p class="texto-curso">
                      concluiu com êxito o curso<br>
                      <span class="nome-curso">${curso.nome}</span><br>
                      com carga horária equivalente e aproveitamento satisfatório.
                  </p>
                  
                  <div class="data">
                      São Paulo, ${new Date().toLocaleDateString('pt-BR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                  </div>
                  
                  <div class="assinatura">
                      Pregiato Management<br>
                      Coordenação de Treinamentos
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;

    const blob = new Blob([certificadoHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado-${curso.nome.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Certificado gerado!",
      description: "Seu certificado foi baixado com sucesso."
    });
  };

  const formatarLinkGoogleDrive = (link: string) => {
    if (link.includes('drive.google.com')) {
      const fileId = link.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return link;
  };

  if (!curso) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Curso não encontrado</h2>
          <Button onClick={() => navigate('/treinamentos')} className="mt-4">
            Voltar aos Treinamentos
          </Button>
        </div>
      </div>
    );
  }

  const aulaAtivaDados = curso.aulas.find(aula => aula.id === aulaAtiva);

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{curso.nome}</h1>
          <p className="text-muted-foreground">{curso.descricao}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={curso.concluido ? "default" : "secondary"}>
            {curso.concluido ? 'Concluído' : `${curso.progresso}% Completo`}
          </Badge>
        </div>
      </div>

      {/* Progresso */}
      {!curso.concluido && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso do Curso</span>
            <span>{curso.progresso}%</span>
          </div>
          <Progress value={curso.progresso} className="h-2" />
        </div>
      )}

      {/* Curso Concluído - Feedback */}
      {curso.concluido && mostrarFeedback && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <Star className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  🎉 Parabéns! Você concluiu o curso!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Deixe seu feedback sobre o curso e gere seu certificado de participação.
                </p>
              </div>
              
              <div className="space-y-3">
                <Textarea
                  placeholder="Deixe seu feedback sobre o curso..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={avaliacaoUsuario === 'like' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => avaliarCurso('like')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {curso.avaliacoes.likes}
                    </Button>
                    <Button
                      variant={avaliacaoUsuario === 'dislike' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => avaliarCurso('dislike')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      {curso.avaliacoes.dislikes}
                    </Button>
                  </div>
                  
                  <Button size="sm" onClick={enviarFeedback}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Enviar Feedback
                  </Button>
                  
                  <Button size="sm" onClick={gerarCertificado}>
                    <Download className="h-4 w-4 mr-1" />
                    Gerar Certificado
                  </Button>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Player de Vídeo */}
        <div className="lg:col-span-3 space-y-4">
          {aulaAtivaDados && (
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                  <iframe
                    src={formatarLinkGoogleDrive(aulaAtivaDados.linkVideo)}
                    className="w-full h-full"
                    allowFullScreen
                    title={aulaAtivaDados.nome}
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{aulaAtivaDados.nome}</h2>
                      <p className="text-muted-foreground mt-1">{aulaAtivaDados.descricao}</p>
                    </div>
                    {!aulaAtivaDados.assistida && (
                      <Button
                        onClick={() => marcarAulaComoAssistida(aulaAtivaDados.id)}
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar como Concluída
                      </Button>
                    )}
                  </div>
                  
                  {aulaAtivaDados.assistida && (
                    <Badge variant="secondary" className="mb-4">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aula Concluída
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Playlist Lateral */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Playlist do Curso</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {curso.aulas.map((aula, index) => (
                  <div
                    key={aula.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      aulaAtiva === aula.id ? 'bg-muted border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => setAulaAtiva(aula.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                        {aula.assistida ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">
                            {index + 1}.
                          </span>
                          <h4 className={`font-medium text-sm line-clamp-2 ${
                            aulaAtiva === aula.id ? 'text-primary' : ''
                          }`}>
                            {aula.nome}
                          </h4>
                        </div>
                        {aula.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {aula.descricao}
                          </p>
                        )}
                        {aula.duracao && (
                          <span className="text-xs text-muted-foreground">
                            {aula.duracao}
                          </span>
                        )}
                      </div>
                      {aulaAtiva === aula.id && (
                        <Play className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Avaliações do Curso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avaliações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Button
                  variant={avaliacaoUsuario === 'like' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => avaliarCurso('like')}
                  className="flex-1 mr-2"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {curso.avaliacoes.likes}
                </Button>
                <Button
                  variant={avaliacaoUsuario === 'dislike' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => avaliarCurso('dislike')}
                  className="flex-1"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {curso.avaliacoes.dislikes}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CursoPage;