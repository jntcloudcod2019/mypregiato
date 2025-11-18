import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Play, Users, Clock, BookOpen, Star, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthPermissions } from '@/hooks/use-auth-permissions';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { trainingService } from '@/services/training-service';
import { TrainingCourse, TrainingProgressSummaryDto } from '@/types/training';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TreinamentosPage = () => {
  const navigate = useNavigate();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { role } = useAuthPermissions();
  const { toast } = useToast();
  
  const [cursos, setCursos] = useState<TrainingCourse[]>([]);
  const [progressos, setProgressos] = useState<Map<string, TrainingProgressSummaryDto>>(new Map());
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'andamento' | 'concluidos'>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Verificação simples: MODEL não pode criar/gerenciar
  const isModelUser = role?.toUpperCase() === 'MODEL';

  // Carregar cursos e progresso do usuário
  useEffect(() => {
    const carregarDados = async () => {
      if (!isUserLoaded) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Buscar todos os cursos
        const cursosData = await trainingService.getCourses({ limit: 100 });
        setCursos(cursosData);
        
        // Se usuário autenticado, buscar progresso
        if (user) {
          try {
            const progressoData = await trainingService.getUserProgressSummary(user.id);
            const progressoMap = new Map<string, TrainingProgressSummaryDto>();
            progressoData.forEach(p => progressoMap.set(p.courseId, p));
            setProgressos(progressoMap);
          } catch (err) {
            console.log('Nenhum progresso encontrado ou erro ao buscar:', err);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar cursos:', err);
        setError('Erro ao carregar cursos. Tente novamente mais tarde.');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os cursos.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDados();
  }, [user, isUserLoaded, toast]);

  const cursosFiltrados = cursos.filter(curso => {
    const matchBusca = curso.title.toLowerCase().includes(busca.toLowerCase()) ||
                       curso.description.toLowerCase().includes(busca.toLowerCase());
    
    const progresso = progressos.get(curso.id);
    const concluido = progresso?.isCompleted || false;
    const emAndamento = progresso && !progresso.isCompleted;
    
    const matchFiltro = filtro === 'todos' || 
                       (filtro === 'andamento' && emAndamento) ||
                       (filtro === 'concluidos' && concluido);
    
    return matchBusca && matchFiltro;
  });

  const estatisticas = {
    totalCursos: cursos.length,
    cursosAndamento: Array.from(progressos.values()).filter(p => !p.isCompleted).length,
    cursosConcluidos: Array.from(progressos.values()).filter(p => p.isCompleted).length,
    horasEstudo: Math.round(Array.from(progressos.values()).reduce((acc, p) => acc + p.totalTimeWatchedMinutes, 0) / 60)
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Carregando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Treinamentos
          </h1>
        </div>
        {!isModelUser && (
          <div className="flex gap-2">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => {
                console.log('✅ Navegando para /treinamentos/criar');
                navigate('/treinamentos/criar');
              }}
            >
              <Plus className="h-4 w-4" />
              Criar Treinamento
            </Button>
            
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => {
                console.log('✅ Navegando para /treinamentos/gerenciar');
                navigate('/treinamentos/gerenciar');
              }}
            >
              <BookOpen className="h-4 w-4" />
              Gerenciar Treinamentos
            </Button>
          </div>
        )}
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
        {cursosFiltrados.map((curso) => {
          const progresso = progressos.get(curso.id);
          const porcentagemProgresso = progresso?.progressPercentage || 0;
          const concluido = progresso?.isCompleted || false;
          
          return (
            <Card key={curso.id} className="hover:shadow-md transition-shadow group">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Thumbnail do curso se existir */}
                    {curso.thumbnailUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden">
                        <img 
                          src={curso.thumbnailUrl} 
                          alt={curso.title}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {curso.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {curso.description}
                    </p>
                    {/* Categoria e Dificuldade */}
                    <div className="mt-2 flex gap-2">
                      {curso.category && (
                        <Badge variant="outline" className="text-xs">
                          {curso.category}
                        </Badge>
                      )}
                      {curso.difficulty && (
                        <Badge variant="outline" className="text-xs">
                          {curso.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {concluido && (
                    <Badge variant="default" className="ml-2">
                      ✓ Concluído
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progresso do curso */}
                {progresso && !concluido && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{Math.round(porcentagemProgresso)}%</span>
                    </div>
                    <Progress value={porcentagemProgresso} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {progresso.completedLessons} de {progresso.totalLessons} aulas concluídas
                    </p>
                  </div>
                )}

                {/* Estatísticas do curso */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{curso.totalLessons} aulas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.round(curso.totalDurationMinutes / 60)}h</span>
                  </div>
                </div>

                {/* Avaliações */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    👍 {curso.totalLikes}
                  </span>
                  <span className="flex items-center gap-1">
                    👎 {curso.totalDislikes}
                  </span>
                  {curso.averageRating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {curso.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Botão de ação */}
                <div className="flex gap-2 pt-2">
                  <Link to={`/treinamentos/curso/${curso.id}`} className="flex-1">
                    <Button className="w-full" variant={concluido ? "outline" : "default"}>
                      <Play className="h-4 w-4 mr-2" />
                      {concluido ? 'Revisar' : progresso ? 'Continuar' : 'Iniciar'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cursosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum curso encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {busca ? 'Tente ajustar os filtros de busca.' : isModelUser ? 'Nenhum curso disponível no momento.' : 'Comece criando seu primeiro treinamento.'}
          </p>
          {!busca && !isModelUser && (
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