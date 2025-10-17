import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Circle, 
  ThumbsUp, 
  ThumbsDown, 
  Download,
  Star,
  Clock,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/clerk-react';
import { trainingService } from '@/services/training-service';
import { 
  TrainingCourse, 
  TrainingLesson, 
  TrainingEnrollment, 
  TrainingProgressSummaryDto 
} from '@/types/training';
import { VideoPlayer } from '@/components/training/VideoPlayer';

const CursoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoaded: isUserLoaded } = useUser();
  
  // Estados
  const [curso, setCurso] = useState<TrainingCourse | null>(null);
  const [aulas, setAulas] = useState<TrainingLesson[]>([]);
  const [enrollment, setEnrollment] = useState<TrainingEnrollment | null>(null);
  const [progresso, setProgresso] = useState<TrainingProgressSummaryDto | null>(null);
  const [aulaAtiva, setAulaAtiva] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showCertificatePrompt, setShowCertificatePrompt] = useState(false);

  // Carregar dados do curso
  useEffect(() => {
    const carregarCurso = async () => {
      if (!id || !isUserLoaded) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Buscar curso
        const cursoData = await trainingService.getCourseById(id);
        setCurso(cursoData);
        
        // Buscar aulas específicas do curso usando endpoint /lessons
        const aulasData = await trainingService.getCourseLessons(id);
        console.log('📚 [CURSO] Aulas carregadas:', aulasData);
        
        // Ordenar aulas por orderIndex
        const aulasOrdenadas = aulasData.sort((a, b) => a.orderIndex - b.orderIndex);
        setAulas(aulasOrdenadas);

        aulasData.forEach(aula => {
          // Exemplo de acesso a uma propriedade de cada aula
          console.log(`ID da Aula: ${aula.id}`); 
          console.log(`Título da Aula: ${aula.title}`);
          console.log(`VideoUrl da Aula: ${aula.videoUrl}`);
          
      });


      
        
        console.log('📚 [CURSO] Total de aulas encontradas:', aulasOrdenadas.length);
        
        // ✅ DEFINIR PRIMEIRA AULA COMO ATIVA
        if (aulasOrdenadas.length > 0) {
          setAulaAtiva(aulasOrdenadas[0].id);
          console.log('🎯 [CURSO] Primeira aula definida como ativa:', aulasOrdenadas[0].id);
        }
       
        // // Se usuário autenticado, buscar enrollment e progresso
        // if (user) {
        //   try {
        //     // Verificar se já tem enrollment
        //     const isEnrolled = await trainingService.isEnrolled(user.id, id);
            
        //     if (isEnrolled) {
        //       // Buscar enrollment existente
        //       const enrollments = await trainingService.getEnrollments({
        //         userId: user.id,
        //         courseId: id
        //       });
              
        //       if (enrollments.length > 0) {
        //         setEnrollment(enrollments[0]);
                
        //         // Buscar progresso detalhado
        //         const progressoData = await trainingService.getProgressSummary(user.id, id);
        //         setProgresso(progressoData);
                
        //         // Verificar se curso foi concluído
        //         if (progressoData.isCompleted && !showCertificatePrompt) {
        //           setShowCertificatePrompt(true);
        //         }
                
        //         // Encontrar primeira aula não concluída ou primeira aula
        //         const primeiraAulaNaoConcluida = aulasOrdenadas.find(aula => {
        //           const lessonProgress = enrollments[0].lessonProgress?.find(
        //             p => p.lessonId === aula.id
        //           );
        //           return !lessonProgress?.isCompleted;
        //         });
                
        //         if (primeiraAulaNaoConcluida) {
        //           setAulaAtiva(primeiraAulaNaoConcluida.id);
        //         } else if (aulasOrdenadas.length > 0) {
        //           setAulaAtiva(aulasOrdenadas[0].id);
        //         }
        //       }
        //     } else {
        //       // Criar enrollment automaticamente ao abrir o curso
        //       const novoEnrollment = await trainingService.enrollInCourse({
        //         userId: user.id,
        //         courseId: id
        //       });
        //       setEnrollment(novoEnrollment);
              
        //       // Definir primeira aula como ativa
        //       if (aulasOrdenadas.length > 0) {
        //         setAulaAtiva(aulasOrdenadas[0].id);
        //       }
          
        //   toast({
        //         title: 'Matrícula realizada!',
        //         description: 'Você foi inscrito neste curso com sucesso.',
        //       });
        //     }
        //   } catch (err) {
        //     console.error('Erro ao buscar enrollment:', err);
        //   }
        // } else {
        //   // Se não autenticado, apenas mostrar primeira aula
        //   if (aulasOrdenadas.length > 0) {
        //     setAulaAtiva(aulasOrdenadas[0].id);
        //   }
        // }
      } catch (err) {
        console.error('Erro ao carregar curso:', err);
        setError('Erro ao carregar o curso. Tente novamente mais tarde.');
          toast({
          title: 'Erro',
          description: 'Não foi possível carregar o curso.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarCurso();
  }, [id, user, isUserLoaded, toast, showCertificatePrompt]);

  // Carregar URL do vídeo quando aula ativa mudar
  useEffect(() => {
    const carregarVideoUrl = () => {
      const aula = aulas.find(a => a.id === aulaAtiva);
      if (!aula?.videoUrl) {
        console.warn('Aula sem videoUrl:', aula);
        return;
      }
      
      console.log('🎬 [CURSO] Usando URL direta do banco:', aula.videoUrl);
      setVideoUrl(aula.videoUrl);
    };
    
    if (aulaAtiva && aulas.length > 0) {
      carregarVideoUrl();
    }
  }, [aulaAtiva, aulas]);

  // Callback para atualizar progresso
  const handleProgressUpdate = useCallback(async () => {
    if (!enrollment || !progresso) return;
    
    try {
      const progressoAtualizado = await trainingService.getProgressSummary(
        user!.id, 
        id!
      );
      setProgresso(progressoAtualizado);
      
      // Verificar se curso foi concluído
      if (progressoAtualizado.isCompleted && !showCertificatePrompt) {
        setShowCertificatePrompt(true);
        toast({
          title: '🎉 Parabéns!',
          description: 'Você concluiu o curso!',
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
    }
  }, [enrollment, progresso, user, id, showCertificatePrompt, toast]);

  // Callback para quando vídeo é concluído
  const handleVideoComplete = useCallback(async () => {
    handleProgressUpdate();
    
    // Avançar para próxima aula
    const currentIndex = aulas.findIndex(a => a.id === aulaAtiva);
    if (currentIndex < aulas.length - 1) {
      setAulaAtiva(aulas[currentIndex + 1].id);
      toast({
        title: 'Aula concluída!',
        description: 'Avançando para a próxima aula...',
      });
    }
  }, [aulas, aulaAtiva, handleProgressUpdate, toast]);

  // Avaliar curso (like/dislike)
  const handleRating = useCallback(async (tipo: 'like' | 'dislike') => {
    if (!user || !id) return;
    
    try {
      await trainingService.addCourseRating(id, {
        courseId: id,
        ratingType: tipo.toUpperCase(),
        stars: tipo === 'like' ? 5 : 1,
      });
      
      setUserRating(tipo);
      
      // Recarregar curso para atualizar contadores
      const cursoAtualizado = await trainingService.getCourseById(id);
      setCurso(cursoAtualizado);
      
      toast({
        title: 'Avaliação registrada!',
        description: `Obrigado pelo seu ${tipo === 'like' ? 'like' : 'dislike'}!`,
      });
    } catch (err) {
      console.error('Erro ao avaliar curso:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar sua avaliação.',
        variant: 'destructive'
      });
    }
  }, [user, id, toast]);

  // Gerar certificado
  const handleGenerateCertificate = useCallback(async () => {
    if (!user || !enrollment) return;
    
    try {
      const blob = await trainingService.generateCertificate({
        userEmail: user.emailAddresses[0].emailAddress,
        courseId: id!,
        completionDate: new Date()
      });
      
      // Download do certificado
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
      a.download = `certificado-${curso?.title.replace(/\s+/g, '-')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
        title: 'Certificado gerado!',
        description: 'Seu certificado foi baixado com sucesso.',
      });
    } catch (err) {
      console.error('Erro ao gerar certificado:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o certificado.',
        variant: 'destructive'
      });
    }
  }, [user, enrollment, id, curso, toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Carregando curso...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !curso) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Curso não encontrado'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/treinamentos')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Treinamentos
        </Button>
      </div>
    );
  }

  const aulaAtivaDados = aulas.find(aula => aula.id === aulaAtiva);
  const lessonProgress = enrollment?.lessonProgress?.find(p => p.lessonId === aulaAtiva);

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
          <h1 className="text-2xl font-bold">{curso.title}</h1>
          <p className="text-muted-foreground">{curso.description}</p>
        </div>
        <div className="flex items-center gap-4">
          {progresso && (
            <Badge variant={progresso.isCompleted ? "default" : "secondary"}>
              {progresso.isCompleted 
                ? '✓ Concluído' 
                : `${Math.round(progresso.progressPercentage)}% Completo`}
          </Badge>
          )}
        </div>
      </div>

      {/* Progresso */}
      {progresso && !progresso.isCompleted && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso do Curso</span>
            <span>{Math.round(progresso.progressPercentage)}%</span>
          </div>
          <Progress value={progresso.progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {progresso.completedLessons} de {progresso.totalLessons} aulas concluídas
          </p>
        </div>
      )}

      {/* Prompt de conclusão e certificado */}
      {showCertificatePrompt && progresso?.isCompleted && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <Star className="h-4 w-4 text-green-600" />
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
                  className="bg-white dark:bg-gray-900"
                />
                
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                    variant={userRating === 'like' ? 'default' : 'outline'}
                      size="sm"
                    onClick={() => handleRating('like')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                    {curso.totalLikes}
                    </Button>
                  
                    <Button
                    variant={userRating === 'dislike' ? 'destructive' : 'outline'}
                      size="sm"
                    onClick={() => handleRating('dislike')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                    {curso.totalDislikes}
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={handleGenerateCertificate}
                    className="ml-auto"
                  >
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
          {aulaAtivaDados && enrollment && videoUrl ? (
            <>
              <VideoPlayer
                videoUrl={videoUrl}
                objectName={aulaAtivaDados.videoUrl || ''} // Usar videoUrl como objectName
                enrollmentId={enrollment.id}
                lessonId={aulaAtivaDados.id}
                userId={user?.id || ''}
                onProgressUpdate={handleProgressUpdate}
                onVideoComplete={handleVideoComplete}
                autoPlay={false}
                showControls={true}
              />
              
            <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold">{aulaAtivaDados.title}</h2>
                      <p className="text-muted-foreground mt-1">{aulaAtivaDados.description}</p>
                      {aulaAtivaDados.videoDurationSeconds && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Duração: {Math.floor(aulaAtivaDados.videoDurationSeconds / 60)} minutos
                        </p>
                      )}
                    </div>
                    {lessonProgress?.isCompleted && (
                      <Badge variant="secondary" className="ml-4">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Concluída
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {aulas.length === 0 
                    ? 'Este curso ainda não possui aulas.' 
                    : 'Carregando vídeo...'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Playlist Lateral */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Playlist do Curso</CardTitle>
              <p className="text-sm text-muted-foreground">
                {aulas.length} {aulas.length === 1 ? 'aula' : 'aulas'}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {aulas.map((aula, index) => {
                  const aulaProgress = enrollment?.lessonProgress?.find(p => p.lessonId === aula.id);
                  const isCompleted = aulaProgress?.isCompleted || false;
                  const isActive = aulaAtiva === aula.id;
                  
                  return (
                  <div
                    key={aula.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        isActive ? 'bg-muted border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => setAulaAtiva(aula.id)}
                  >
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium flex-shrink-0">
                          {isCompleted ? (
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
                              isActive ? 'text-primary' : ''
                          }`}>
                              {aula.title}
                          </h4>
                        </div>
                          {aula.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                              {aula.description}
                          </p>
                        )}
                          {aula.videoDurationSeconds && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(aula.videoDurationSeconds / 60)}min
                          </span>
                          )}
                        </div>
                        {isActive && (
                          <Play className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Avaliações do Curso */}
          {!progresso?.isCompleted && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avaliações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                <Button
                    variant={userRating === 'like' ? 'default' : 'outline'}
                  size="sm"
                    onClick={() => handleRating('like')}
                    className="flex-1"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                    {curso.totalLikes}
                </Button>
                <Button
                    variant={userRating === 'dislike' ? 'destructive' : 'outline'}
                  size="sm"
                    onClick={() => handleRating('dislike')}
                  className="flex-1"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                    {curso.totalDislikes}
                </Button>
              </div>
                {curso.averageRating > 0 && (
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{curso.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">/ 5.0</span>
                  </div>
                )}
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CursoPage;
