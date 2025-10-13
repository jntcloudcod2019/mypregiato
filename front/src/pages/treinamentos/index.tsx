import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Play, Users, Clock, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthPermissions } from '@/contexts/AuthPermissionsContext';
import { Permission } from '@/config/permissions';
import ProtectedFeature from '@/components/auth/protected-feature';

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
  const { user, isModel, isLoading: userLoading } = useAuthPermissions();

  useEffect(() => {
    // Carregar cursos da API quando disponível
    // Por enquanto, manter lista vazia
    setCursos([]);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Treinamentos
          </h1>
        </div>
        <div className="flex gap-2">
          <ProtectedFeature permission={Permission.CREATE_TRAINING} hideWhenDenied>
            <Link to="/treinamentos/criar">
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Treinamento
              </Button>
            </Link>
          </ProtectedFeature>
          
          <ProtectedFeature permission={Permission.MANAGE_TRAININGS} hideWhenDenied>
            <Link to="/treinamentos/gerenciar">
              <Button size="lg" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Gerenciar Treinamentos
              </Button>
            </Link>
          </ProtectedFeature>
        </div>
      </div>

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
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      <strong>ID do Curso:</strong> {curso.id}
                    </p>
                  </div>
                </div>
                {curso.concluido && (
                  <Badge variant="secondary" className="ml-2">
                    Concluído
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {!curso.concluido && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{curso.progresso}%</span>
                  </div>
                  <Progress value={curso.progresso} className="h-2" />
                </div>
              )}

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