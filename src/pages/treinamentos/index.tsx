import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Play, Users, Clock, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

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

interface Aula {
  id: string;
  nome: string;
  descricao: string;
  linkVideo: string;
  assistida: boolean;
  duracao?: string;
}

const TreinamentosPage = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'andamento' | 'concluidos'>('todos');

  // Carregar cursos do localStorage na inicialização
  useEffect(() => {
    const cursosStorage = localStorage.getItem('treinamentos_cursos');
    if (cursosStorage) {
      setCursos(JSON.parse(cursosStorage));
    } else {
      // Dados mockados para demonstração
      const cursosMock: Curso[] = [
        {
          id: '1',
          nome: 'Fundamentos de Fotografia para Modelos',
          descricao: 'Aprenda os conceitos básicos de fotografia focados em modelagem e poses.',
          quantidadeAulas: 8,
          aulas: [
            {
              id: '1-1',
              nome: 'Introdução à Fotografia',
              descricao: 'Conceitos básicos de fotografia e equipamentos',
              linkVideo: 'https://drive.google.com/file/d/exemplo1',
              assistida: true,
              duracao: '15:30'
            },
            {
              id: '1-2',
              nome: 'Poses Básicas',
              descricao: 'Como fazer poses naturais e expressivas',
              linkVideo: 'https://drive.google.com/file/d/exemplo2',
              assistida: true,
              duracao: '22:15'
            },
            {
              id: '1-3',
              nome: 'Iluminação Natural',
              descricao: 'Aproveitando a luz natural para melhores fotos',
              linkVideo: 'https://drive.google.com/file/d/exemplo3',
              assistida: false,
              duracao: '18:45'
            }
          ],
          progresso: 25,
          concluido: false,
          avaliacoes: { likes: 124, dislikes: 3 },
          criadoEm: '2024-01-15'
        },
        {
          id: '2',
          nome: 'Marketing Digital para Modelos',
          descricao: 'Como construir sua marca pessoal e presença digital.',
          quantidadeAulas: 12,
          aulas: [],
          progresso: 100,
          concluido: true,
          avaliacoes: { likes: 89, dislikes: 1 },
          criadoEm: '2024-01-10'
        }
      ];
      setCursos(cursosMock);
      localStorage.setItem('treinamentos_cursos', JSON.stringify(cursosMock));
    }
  }, []);

  const cursosFiltrados = cursos.filter(curso => {
    const matchBusca = curso.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       curso.descricao.toLowerCase().includes(busca.toLowerCase());
    
    const matchFiltro = filtro === 'todos' || 
                       (filtro === 'andamento' && !curso.concluido) ||
                       (filtro === 'concluidos' && curso.concluido);
    
    return matchBusca && matchFiltro;
  });

  const estatisticas = {
    totalCursos: cursos.length,
    cursosAndamento: cursos.filter(c => !c.concluido).length,
    cursosConcluidos: cursos.filter(c => c.concluido).length,
    horasEstudo: cursos.reduce((acc, curso) => {
      const horasCurso = curso.aulas.reduce((accAulas, aula) => {
        if (aula.duracao) {
          const [min, seg] = aula.duracao.split(':').map(Number);
          return accAulas + (min + seg/60);
        }
        return accAulas;
      }, 0);
      return acc + horasCurso;
    }, 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-variant))] bg-clip-text text-transparent">
            Treinamentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e participe de cursos online para desenvolvimento profissional
          </p>
        </div>
        <Link to="/treinamentos/criar">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Treinamento
          </Button>
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalCursos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.cursosAndamento}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.cursosConcluidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas de Estudo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(estatisticas.horasEstudo)}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar treinamentos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filtro === 'todos' ? 'default' : 'outline'}
            onClick={() => setFiltro('todos')}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filtro === 'andamento' ? 'default' : 'outline'}
            onClick={() => setFiltro('andamento')}
            size="sm"
          >
            Em Andamento
          </Button>
          <Button
            variant={filtro === 'concluidos' ? 'default' : 'outline'}
            onClick={() => setFiltro('concluidos')}
            size="sm"
          >
            Concluídos
          </Button>
        </div>
      </div>

      {/* Lista de Cursos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {cursosFiltrados.map((curso) => (
          <Card key={curso.id} className="hover:shadow-md transition-shadow group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {curso.nome}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                    {curso.descricao}
                  </p>
                </div>
                {curso.concluido && (
                  <Badge variant="secondary" className="ml-2">
                    Concluído
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progresso */}
              {!curso.concluido && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{curso.progresso}%</span>
                  </div>
                  <Progress value={curso.progresso} className="h-2" />
                </div>
              )}

              {/* Informações do Curso */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{curso.quantidadeAulas} aulas</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    👍 {curso.avaliacoes.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    👎 {curso.avaliacoes.dislikes}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 pt-2">
                <Link to={`/treinamentos/curso/${curso.id}`} className="flex-1">
                  <Button className="w-full" variant={curso.concluido ? "outline" : "default"}>
                    <Play className="h-4 w-4 mr-2" />
                    {curso.concluido ? 'Revisar' : 'Continuar'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {cursosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum curso encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {busca ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro treinamento.'}
          </p>
          {!busca && (
            <Link to="/treinamentos/criar">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Treinamento
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default TreinamentosPage;