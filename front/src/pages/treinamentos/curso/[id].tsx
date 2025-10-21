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
import { userManagementService } from '@/services/user-management-service';
import { 
  TrainingCourse, 
  TrainingLesson, 
  TrainingEnrollment, 
  TrainingProgressSummaryDto 
} from '@/types/training';
import { VideoPlayer } from '@/components/training/VideoPlayer';
import { ProgressSteps } from '@/components/training/ProgressSteps';

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
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [totalWatchedTime, setTotalWatchedTime] = useState(0);
  const [dbUserId, setDbUserId] = useState<string | null>(null); // ID do banco MySQL

  // Carregar dados do curso
  useEffect(() => {
    const carregarCurso = async () => {
      if (!id || !isUserLoaded) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // ✅ PASSO 1: Buscar dados do usuário do BANCO (MySQL) usando email do Clerk
        let userId: string | null = null;
        
        if (user && user.primaryEmailAddress?.emailAddress) {
          try {
            console.log('👤 [CURSO] Buscando dados do usuário no banco via email:', user.primaryEmailAddress.emailAddress);
            const dbUser = await userManagementService.getUserByEmail(user.primaryEmailAddress.emailAddress);
            userId = dbUser.id; // ✅ ID do MySQL
            setDbUserId(userId);
            console.log('✅ [CURSO] Usuário do banco encontrado:', {
              id: dbUser.id,
              name: `${dbUser.firstName} ${dbUser.lastName}`,
              role: dbUser.role
            });
          } catch (err) {
            console.warn('⚠️ [CURSO] Usuário não encontrado no banco, usando fallback do Clerk');
            // Fallback: usar ClerkId se usuário não existir no banco
            userId = user.id;
            setDbUserId(userId);
          }
        }

        // ✅ PASSO 2: Buscar curso
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
        
        // ✅ PASSO 3: Buscar enrollment automaticamente (usando ID do MySQL)
        if (userId && aulasOrdenadas.length > 0) {
          try {
            console.log('🎓 [CURSO] Buscando ou criando enrollment para usuário do banco:', userId);
            
            // Buscar ou criar enrollment (backend cria automaticamente se não existir)
            const enrollmentData = await trainingService.getOrCreateEnrollment(userId, id);
            setEnrollment(enrollmentData);
            console.log('✅ [CURSO] Enrollment carregado:', enrollmentData.id);
            
            // Buscar progresso resumido
            const progressoData = await trainingService.getProgressSummary(userId, id);
            setProgresso(progressoData);
            console.log('📊 [CURSO] Progresso:', progressoData);
            
            // Verificar se curso foi concluído
            if (progressoData && progressoData.isCompleted) {
              setShowCertificatePrompt(true);
            }
            
            // Encontrar primeira aula não concluída
            const primeiraAulaNaoConcluida = aulasOrdenadas.find(aula => {
              const lessonProgress = enrollmentData.lessonProgress?.find(
                p => p.lessonId === aula.id
              );
              return !lessonProgress?.isCompleted;
            });
            
            if (primeiraAulaNaoConcluida) {
              setAulaAtiva(primeiraAulaNaoConcluida.id);
              console.log('🎯 [CURSO] Retomando aula não concluída:', primeiraAulaNaoConcluida.title);
            } else if (aulasOrdenadas.length > 0) {
              setAulaAtiva(aulasOrdenadas[0].id);
              console.log('🎯 [CURSO] Iniciando pela primeira aula');
            }
          } catch (err) {
            console.error('❌ [CURSO] Erro ao buscar enrollment:', err);
            // Em caso de erro, definir primeira aula como ativa
        if (aulasOrdenadas.length > 0) {
              setAulaAtiva(aulasOrdenadas[0].id);
            }
          }
        } else if (aulasOrdenadas.length > 0) {
          // Se não autenticado, apenas mostrar primeira aula
          setAulaAtiva(aulasOrdenadas[0].id);
        }
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
      setCurrentVideoTime(0); // Reset timer ao mudar de aula
    };
    
    if (aulaAtiva && aulas.length > 0) {
      carregarVideoUrl();
    }
  }, [aulaAtiva, aulas]);

  // ✅ TRACKING AUTOMÁTICO: Atualizar progresso a cada 5 minutos (só quando assistindo)
  useEffect(() => {
    if (!enrollment || !aulaAtiva || !dbUserId) return;

    console.log('⏱️ [TRACKING] Iniciando tracking automático de progresso (5 min)');

    const interval = setInterval(async () => {
      try {
        const timeWatchedSeconds = Math.floor(totalWatchedTime);
        
        console.log('📊 [TRACKING] Salvando progresso automático:', {
          lesson: aulaAtiva,
          timeWatched: timeWatchedSeconds,
          totalMinutes: Math.floor(totalWatchedTime / 60)
        });

        await trainingService.updateLessonProgress(
          enrollment.id,
          aulaAtiva,
          timeWatchedSeconds,
          false // Ainda não concluído
        );

        // Atualizar progresso geral
        await trainingService.updateEnrollmentProgress(
          enrollment.id,
          aulaAtiva,
          Math.floor(totalWatchedTime / 60)
        );

        console.log('✅ [TRACKING] Progresso salvo automaticamente');
      } catch (err) {
        console.error('❌ [TRACKING] Erro ao salvar progresso:', err);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      console.log('🛑 [TRACKING] Parando tracking automático');
      clearInterval(interval);
    };
  }, [enrollment, aulaAtiva, totalWatchedTime, dbUserId]);

  // Callback para atualizar progresso
  const handleProgressUpdate = useCallback(async () => {
    if (!enrollment || !progresso || !dbUserId) return;
    
    try {
      const progressoAtualizado = await trainingService.getProgressSummary(
        dbUserId, 
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
  }, [enrollment, progresso, dbUserId, id, showCertificatePrompt, toast]);

  // ✅ Callback para quando vídeo termina
  const handleVideoComplete = useCallback(async () => {
    if (!enrollment || !aulaAtiva || !dbUserId) return;

    try {
      console.log('✅ [VIDEO] Vídeo concluído, marcando aula como completa');
      
      // Marcar aula como concluída
      await trainingService.updateLessonProgress(
        enrollment.id,
        aulaAtiva,
        Math.floor(totalWatchedTime),
        true // ✅ Concluído
      );

      // Atualizar progresso resumido
      const progressoAtualizado = await trainingService.getProgressSummary(dbUserId, id!);
      setProgresso(progressoAtualizado);

      // Verificar se curso foi 100% concluído
      if (progressoAtualizado && progressoAtualizado.isCompleted) {
        setShowCertificatePrompt(true);
        toast({
          title: '🎉 Curso Concluído!',
          description: 'Parabéns! Você completou todas as aulas.',
        });
        return;
      }
    
    // Avançar para próxima aula
    const currentIndex = aulas.findIndex(a => a.id === aulaAtiva);
    if (currentIndex < aulas.length - 1) {
      setAulaAtiva(aulas[currentIndex + 1].id);
        setTotalWatchedTime(0); // Reset contador
      toast({
        title: 'Aula concluída!',
        description: 'Avançando para a próxima aula...',
      });
    }
    } catch (err) {
      console.error('❌ [VIDEO] Erro ao marcar aula como concluída:', err);
    }
  }, [aulas, aulaAtiva, enrollment, totalWatchedTime, dbUserId, id, toast]);

  // ✅ Handler para capturar tempo do vídeo
  const handleVideoTimeUpdate = useCallback((currentTime: number) => {
    setCurrentVideoTime(currentTime);
    setTotalWatchedTime(prev => prev + 1); // Incrementa a cada segundo
  }, []);

  // Avaliar curso (like/dislike)
  const handleRating = useCallback(async (tipo: 'like' | 'dislike') => {
    if (!user || !id) {
      console.warn('⚠️ [RATING] Usuário ou ID do curso não disponível');
      return;
    }
    
    if (!user.primaryEmailAddress?.emailAddress) {
      console.error('❌ [RATING] Email do usuário não encontrado');
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar seu email. Faça login novamente.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      console.log('👍 [RATING] Iniciando avaliação:', {
        tipo,
        userEmail: user.primaryEmailAddress.emailAddress,
        courseId: id
      });
      
      await trainingService.addCourseRating(
        id, 
        {
        courseId: id,
        ratingType: tipo.toUpperCase(),
        stars: tipo === 'like' ? 5 : 1,
        },
        user.primaryEmailAddress.emailAddress  // ✅ Passando email do usuário
      );
      
      setUserRating(tipo);
      
      // Recarregar curso para atualizar contadores
      const cursoAtualizado = await trainingService.getCourseById(id);
      setCurso(cursoAtualizado);
      
      console.log('✅ [RATING] Avaliação registrada com sucesso!');
      
      toast({
        title: 'Avaliação registrada!',
        description: `Obrigado pelo seu ${tipo === 'like' ? 'like' : 'dislike'}!`,
      });
    } catch (err) {
      console.error('❌ [RATING] Erro ao avaliar curso:', err);
      const error = err as { response?: { data?: string }; message?: string };
      console.error('❌ [RATING] Detalhes:', error.response?.data || error.message);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar sua avaliação.',
        variant: 'destructive'
      });
    }
  }, [user, id, toast]);

  // ✅ FEEDBACK FAKE: Enviar feedback (não salva, apenas mostra dialog)
  const handleSendFeedback = useCallback(() => {
    if (feedback.trim()) {
      setShowFeedbackDialog(true);
      setFeedback(''); // Limpar campo automaticamente
    }
  }, [feedback]);

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
                <div className="space-y-2">
                  <Textarea
                    placeholder="Deixe seu feedback sobre o curso..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="bg-white dark:bg-gray-900"
                  />
                  <Button 
                    onClick={handleSendFeedback}
                    disabled={!feedback.trim()}
                    size="sm"
                    variant="outline"
                  >
                    Enviar Feedback
                  </Button>
                </div>
                
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
          {aulaAtivaDados && videoUrl ? (
            <>
              {/* Player HTML5 com CORS configurado */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      key={videoUrl}
                      src={videoUrl}
                      controls
                      controlsList="nodownload"
                      className="w-full h-auto"
                      style={{ maxHeight: '70vh' }}
                      preload="metadata"
                      crossOrigin="anonymous"
                      onTimeUpdate={(e) => {
                        const video = e.currentTarget;
                        handleVideoTimeUpdate(video.currentTime);
                      }}
                      onEnded={handleVideoComplete}
                      onError={(e) => {
                        console.error('❌ [VIDEO] Erro ao carregar vídeo:', e.currentTarget.error);
                        console.error('❌ [VIDEO] URL do vídeo:', videoUrl);
                        console.error('❌ [VIDEO] Error code:', e.currentTarget.error?.code);
                        console.error('❌ [VIDEO] Error message:', e.currentTarget.error?.message);
                      }}
                      onLoadStart={() => console.log('🎬 [VIDEO] Iniciando carregamento:', videoUrl)}
                      onLoadedMetadata={() => console.log('✅ [VIDEO] Metadados carregados')}
                      onCanPlay={() => console.log('✅ [VIDEO] Vídeo pronto para reproduzir')}
                    >
                      <source src={videoUrl} type="video/mp4" />
                      Seu navegador não suporta a tag de vídeo.
                    </video>
                  </div>
                </CardContent>
              </Card>
              
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
            <CardContent className="p-4">
              <div className="max-h-[600px] overflow-y-auto pr-2">
                <ProgressSteps
                  lessons={aulas}
                  lessonProgress={enrollment?.lessonProgress || []}
                  currentLessonId={aulaAtiva}
                  onLessonClick={setAulaAtiva}
                />
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

      {/* ✅ DIALOG DE AGRADECIMENTO PELO FEEDBACK */}
      {showFeedbackDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Obrigado pelo feedback!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Sua opinião é muito importante para nossa melhora continua!
              </p>
              <Button 
                onClick={() => setShowFeedbackDialog(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CursoPage;
