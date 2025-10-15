import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Play, Save, Eye, Upload, Video, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useTrainingCourses } from '@/hooks/use-training-courses';
import { CreateTrainingCourseDto, CreateTrainingLessonDto } from '@/types/training';

const CriarTreinamentoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const { createCourse, isCreating } = useTrainingCourses();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Normal',
    isActive: true
  });
  
  const [lessons, setLessons] = useState<CreateTrainingLessonDto[]>([]);
  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    description: '',
    orderIndex: 1,
    durationSeconds: 0,
    videoUrl: '',
    videoObjectName: '',
    // ✅ ADICIONADO: Campos para dados Base64 do vídeo
    videoBase64Data: '',
    videoFileName: '',
    videoFileSize: 0,
    videoMimeType: ''
  });
  
  const [activeStep, setActiveStep] = useState<'course' | 'lessons' | 'videos' | 'preview'>('course');
  const [showPreview, setShowPreview] = useState(true);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // ✅ FUNÇÃO PARA CONVERTER ARQUIVO PARA BASE64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const result = reader.result as string;
            if (result && result.includes(',')) {
              const base64Data = result.split(',')[1]; // Remove data:video/mp4;base64,
              console.log('✅ [Debug] Base64 extraído com sucesso:', base64Data ? `${base64Data.substring(0, 50)}...` : 'VAZIO');
              resolve(base64Data);
            } else {
              reject(new Error('Resultado do FileReader inválido'));
            }
          } catch (error) {
            console.error('❌ [Debug] Erro ao processar resultado do FileReader:', error);
            reject(error);
          }
        };
        reader.onerror = (error) => {
          console.error('❌ [Debug] Erro no FileReader:', error);
          reject(new Error('Erro ao ler arquivo'));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ [Debug] Erro ao criar FileReader:', error);
        reject(error);
      }
    });
  };

  const addLesson = () => {
    if (!currentLesson.title) {
      toast({
        title: "Campo obrigatório",
        description: "O título da aula é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!currentLesson.durationSeconds || currentLesson.durationSeconds <= 0) {
      toast({
        title: "Campo obrigatório",
        description: "A duração do vídeo é obrigatória.",
        variant: "destructive"
      });
      return;
    }

    // ✅ VALIDAÇÃO DE VÍDEO OBRIGATÓRIO
    if (!currentLesson.videoBase64Data) {
      console.log('❌ [Debug] Validação falhou - videoBase64Data vazio:', {
        videoBase64Data: currentLesson.videoBase64Data,
        videoFileName: currentLesson.videoFileName,
        videoFileSize: currentLesson.videoFileSize,
        videoMimeType: currentLesson.videoMimeType
      });
      toast({
        title: "Vídeo obrigatório",
        description: "É necessário fazer upload de um vídeo para a aula.",
        variant: "destructive"
      });
      return;
    }

    const newLesson: CreateTrainingLessonDto = {
      ...currentLesson,
      isActive: true,
      // ✅ INCLUIR DADOS BASE64 DO VÍDEO (OBRIGATÓRIOS)
      videoBase64Data: currentLesson.videoBase64Data, // Já validado acima
      videoFileName: currentLesson.videoFileName, // Nome do arquivo original
      videoFileSize: currentLesson.videoFileSize, // Tamanho em bytes
      videoMimeType: currentLesson.videoMimeType, // Tipo MIME (video/mp4, etc)
      // Manter dados do vídeo para envio posterior
      videoUrl: currentLesson.videoUrl || '', // Será preenchido pelo backend
      videoObjectName: currentLesson.videoObjectName || '' // Será preenchido pelo backend
    };

    // ✅ DEBUG: Log dos dados do vídeo
    console.log('🎥 [Debug] Dados do vídeo na aula:', {
      videoBase64Data: currentLesson.videoBase64Data ? `${currentLesson.videoBase64Data.substring(0, 50)}...` : 'VAZIO',
      videoFileName: currentLesson.videoFileName,
      videoFileSize: currentLesson.videoFileSize,
      videoMimeType: currentLesson.videoMimeType
    });

    setLessons([...lessons, newLesson]);
    
    // Limpar formulário para próxima aula
    setCurrentLesson({
      title: '',
      description: '',
      orderIndex: lessons.length + 2,
      durationSeconds: 0,
      videoUrl: '',
      videoObjectName: '',
      // ✅ LIMPAR CAMPOS BASE64
      videoBase64Data: '',
      videoFileName: '',
      videoFileSize: 0,
      videoMimeType: ''
    });
    
    toast({
      title: "Aula adicionada",
      description: `"${newLesson.title}" foi adicionada ao curso. Você pode continuar adicionando mais aulas.`
    });
  };


  const removeLesson = (index: number) => {
    const updatedLessons = lessons.filter((_, i) => i !== index);
    setLessons(updatedLessons.map((lesson, i) => ({
      ...lesson,
      orderIndex: i + 1
    })));
    setCurrentLesson(prev => ({
      ...prev,
      orderIndex: updatedLessons.length + 1
    }));
  };

  const handleCourseSubmit = async () => {
    if (!formData.title || !formData.description) {
    toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
    });
      return;
    }

    setActiveStep('lessons');
  };

  const handleCreateCourse = async () => {
    if (!formData.title || !formData.description || lessons.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e adicione pelo menos uma aula.",
        variant: "destructive"
      });
      return;
    }

    // // ✅ Validar autenticação
    // if (!user?.id) {
    //   toast({
    //     title: "Erro de autenticação",
    //     description: "Usuário não autenticado. Faça login novamente.",
    //     variant: "destructive"
    //   });
    //   return;
    // }

    const newId: string = uuidv4();

    const courseData: CreateTrainingCourseDto = {
      ...formData,
      createdBy: newId, 
      lessons: lessons
    };

    // ✅ DEBUG: Log do payload completo
    console.log('📤 [Debug] Payload completo do curso:', {
      ...courseData,
      lessons: courseData.lessons?.map(lesson => ({
        ...lesson,
        videoBase64Data: lesson.videoBase64Data ? `${lesson.videoBase64Data.substring(0, 50)}...` : 'VAZIO'
      }))
    });

    setIsCreatingCourse(true);

    try {
      const response = await createCourse(courseData);
      
      // Verificar se a resposta contém a mensagem personalizada
      if (response && typeof response === 'object' && 'message' in response) {
        toast({
          title: "Sucesso!",
          description: String(response.message),
          duration: 5000,
        });
      } else if (response && typeof response === 'object' && 'id' in response) {
        // Fallback para resposta sem mensagem personalizada
    toast({
      title: "Curso criado com sucesso!",
          description: `ID do Curso: ${response.id || 'N/A'}`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Curso criado!",
          description: "O curso foi criado com sucesso.",
          duration: 5000,
        });
      }
      
      navigate('/treinamentos');
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      toast({
        title: "Erro ao criar curso",
        description: "Não foi possível criar o curso. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const categories = [

    'Marketing',
    'Design',
    'Desenvolvimento Pessoal',
    'Liderança',
    'Produtividade',
    'Comunicação',
    'Outros'
  ];

  const difficulties = [
    'Iniciante',
    'Intermediário',
    'Avançado'
  ];

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
            Crie um novo curso de treinamento para sua equipe
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${activeStep === 'course' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep === 'course' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span className="font-medium">Informações do Curso</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center space-x-2 ${activeStep === 'lessons' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep === 'lessons' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
          <span className="font-medium">Aulas</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center space-x-2 ${activeStep === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span className="font-medium">Revisão</span>
        </div>
      </div>

      {/* Step 1: Course Information */}
      {activeStep === 'course' && (
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Informações do Curso
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Curso *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Introdução ao React"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
                <Textarea
                id="description"
                placeholder="Descreva o conteúdo e objetivos do curso..."
                  rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Nível de Dificuldade</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    Curso ativo
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCourseSubmit}>
                Próximo: Adicionar Aulas
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              </div>
            </CardContent>
          </Card>
      )}

      {/* Step 2: Lessons */}
      {activeStep === 'lessons' && (
        <div className="space-y-6">
          {/* Add Lesson Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Nova Aula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonTitle">Título da Aula *</Label>
                  <Input
                    id="lessonTitle"
                    placeholder="Ex: Introdução aos Conceitos"
                    value={currentLesson.title}
                    onChange={(e) => setCurrentLesson(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lessonOrder">Ordem</Label>
                <Input
                    id="lessonOrder"
                    type="number"
                    min="1"
                    value={currentLesson.orderIndex}
                    onChange={(e) => setCurrentLesson(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonDescription">Descrição da Aula</Label>
                <Textarea
                  id="lessonDescription"
                  placeholder="Descreva o conteúdo desta aula..."
                  rows={3}
                  value={currentLesson.description}
                  onChange={(e) => setCurrentLesson(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonDuration">Duração do Vídeo (segundos) *</Label>
                <Input
                    id="lessonDuration"
                    type="number"
                    min="1"
                    placeholder="Ex: 1800 (30 minutos)"
                    value={currentLesson.durationSeconds || ''}
                    onChange={(e) => setCurrentLesson(prev => ({ ...prev, durationSeconds: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Upload do Vídeo *</Label>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        // Validar tipo de arquivo
                        const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
                        if (!validTypes.includes(file.type)) {
                          toast({
                            title: 'Tipo de arquivo inválido',
                            description: 'Use MP4, WebM, MOV ou AVI',
                            variant: 'destructive'
                          });
                          return;
                        }

                        // Validar tamanho (máx 5GB)
                        const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
                        if (file.size > maxSize) {
                          toast({
                            title: 'Arquivo muito grande',
                            description: 'Tamanho máximo: 5GB',
                            variant: 'destructive'
                          });
                          return;
                        }

                        // Criar URL de preview do vídeo
                        const videoPreviewUrl = URL.createObjectURL(file);
                        setVideoPreviewUrl(videoPreviewUrl);
                        console.log('🎬 [Debug] URL de preview criada:', videoPreviewUrl);
                        
                        // Converter para Base64
                        console.log('🔄 [Debug] Iniciando conversão para Base64:', file.name, file.size, 'bytes');
                        const base64Data = await convertFileToBase64(file);
                        console.log('✅ [Debug] Base64 convertido:', base64Data ? `${base64Data.substring(0, 50)}...` : 'VAZIO');
                        
                        // Obter duração do vídeo
                        const video = document.createElement('video');
                        video.preload = 'metadata';
                        const duration = await new Promise<number>((resolve) => {
                          video.onloadedmetadata = () => resolve(video.duration);
                          video.src = videoPreviewUrl;
                        });
                        console.log('⏱️ [Debug] Duração do vídeo:', duration, 'segundos');

                        // Atualizar estado com dados do vídeo
                        const videoData = {
                          videoBase64Data: base64Data,
                          videoFileName: file.name,
                          videoFileSize: file.size,
                          videoMimeType: file.type,
                          durationSeconds: Math.round(duration)
                        };
                        
                        console.log('📝 [Debug] Dados do vídeo para salvar:', {
                          ...videoData,
                          videoBase64Data: base64Data ? `${base64Data.substring(0, 50)}...` : 'VAZIO'
                        });
                        
                        setCurrentLesson(prev => {
                          const updated = {
                            ...prev,
                            ...videoData
                          };
                          console.log('🔄 [Debug] Estado atualizado:', {
                            ...updated,
                            videoBase64Data: updated.videoBase64Data ? `${updated.videoBase64Data.substring(0, 50)}...` : 'VAZIO'
                          });
                          return updated;
                        });

                        toast({
                          title: 'Vídeo processado!',
                          description: `${file.name} (${Math.round(file.size / 1024 / 1024)}MB) preparado para envio`
                        });
                      } catch (error) {
                        console.error('❌ [Debug] Erro completo ao processar vídeo:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                        toast({
                          title: 'Erro no processamento',
                          description: `Erro ao processar o vídeo: ${errorMessage}`,
                          variant: 'destructive'
                        });
                      }
                    }}
                  />
                  {currentLesson.videoFileName && (
                    <div className="space-y-3">
                      <div className="text-sm text-green-600">
                        ✅ {currentLesson.videoFileName} ({Math.round(currentLesson.videoFileSize / 1024 / 1024)}MB)
                        {currentLesson.videoBase64Data && (
                          <div className="text-xs text-blue-600 mt-1">
                            📊 Base64: {Math.round(currentLesson.videoBase64Data.length / 1024)}KB | 
                            Tipo: {currentLesson.videoMimeType} | 
                            Duração: {currentLesson.durationSeconds}s
                          </div>
                        )}
                      </div>
                      
                      {/* ✅ PREVIEW DO VÍDEO COM PLAYER */}
                      {videoPreviewUrl && (
                        <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
                          <video
                            src={videoPreviewUrl}
                            controls
                            className="w-full max-h-64 object-contain"
                            preload="metadata"
                            onLoadedMetadata={() => {
                              console.log('🎬 [Debug] Vídeo carregado para preview');
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Preview
                          </div>
                          <div className="absolute top-2 left-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                // Limpar vídeo selecionado
                                URL.revokeObjectURL(videoPreviewUrl);
                                setVideoPreviewUrl(null);
                                setCurrentLesson(prev => ({
                                  ...prev,
                                  videoBase64Data: '',
                                  videoFileName: '',
                                  videoFileSize: 0,
                                  videoMimeType: '',
                                  durationSeconds: 0
                                }));
                                // Limpar input
                                const fileInput = document.getElementById('video-upload') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addLesson}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Aula
              </Button>
                {lessons.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveStep('preview')}
                  >
                    Revisar Curso ({lessons.length} aulas)
                    <Eye className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lessons List */}
          {lessons.length > 0 && (
          <Card>
            <CardHeader>
                <CardTitle>Aulas do Curso ({lessons.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{lesson.orderIndex}</Badge>
                        <div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground">{lesson.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Duração: {lesson.durationSeconds ? `${Math.floor(lesson.durationSeconds / 60)}min ${lesson.durationSeconds % 60}s` : 'Não definida'}
                            </span>
                            {lesson.videoUrl ? (
                              <span className="text-xs text-green-600 font-medium">✓ Vídeo pronto</span>
                            ) : (
                              <span className="text-xs text-orange-600 font-medium">⚠ Vídeo pendente</span>
                            )}
                          </div>
                      </div>
                      </div>
                      <div className="flex items-center space-x-2">
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLesson(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveStep('course')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => setActiveStep('preview')}>
              Revisar Curso
              <Eye className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {activeStep === 'preview' && (
        <div className="space-y-6">
            <Card>
              <CardHeader>
              <CardTitle>Revisão do Curso</CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Título</Label>
                  <p className="text-lg font-semibold">{formData.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                  <p>{formData.category || 'Não especificada'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Dificuldade</Label>
                  <Badge variant="outline">{formData.difficulty}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                    {formData.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                <p className="text-sm">{formData.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Aulas ({lessons.length})</Label>
                <div className="space-y-2 mt-2">
                  {lessons.map((lesson, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 border rounded">
                      <Badge variant="outline">{lesson.orderIndex}</Badge>
                      <span className="font-medium">{lesson.title}</span>
                    </div>
                  ))}
                </div>
                </div>
              </CardContent>
            </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveStep('lessons')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar para Aulas
            </Button>
            <Button
              onClick={handleCreateCourse} 
              disabled={isCreatingCourse}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreatingCourse ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Curso...
                </>
              ) : (
                <>
              <Save className="h-4 w-4 mr-2" />
                  Salvar Curso ({lessons.length} aulas)
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriarTreinamentoPage;