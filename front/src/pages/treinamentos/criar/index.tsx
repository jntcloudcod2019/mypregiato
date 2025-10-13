import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Play, Save, Eye, Upload, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTrainingCourses } from '@/hooks/use-training-courses';
import VideoUpload from '@/components/training/VideoUpload';
import { CreateTrainingCourseDto, CreateTrainingLessonDto } from '@/types/training';

const CriarTreinamentoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createCourse, isCreating } = useTrainingCourses();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Iniciante',
    isActive: true
  });
  
  const [lessons, setLessons] = useState<CreateTrainingLessonDto[]>([]);
  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    description: '',
    orderIndex: 1,
    durationSeconds: 0,
    videoUrl: '',
    videoObjectName: ''
  });
  
  const [activeStep, setActiveStep] = useState<'course' | 'lessons' | 'preview'>('course');
  const [showPreview, setShowPreview] = useState(false);

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

    if (!currentLesson.videoUrl) {
      toast({
        title: "Campo obrigatório",
        description: "O upload do vídeo é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    const newLesson: CreateTrainingLessonDto = {
      ...currentLesson,
      isActive: true
    };

    setLessons([...lessons, newLesson]);
    setCurrentLesson({
      title: '',
      description: '',
      orderIndex: lessons.length + 2,
      durationSeconds: 0,
      videoUrl: '',
      videoObjectName: ''
    });
    
    toast({
      title: "Aula adicionada",
      description: `"${newLesson.title}" foi adicionada ao curso.`
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

    const courseData: CreateTrainingCourseDto = {
      ...formData,
      createdBy: 'current-user-id', // TODO: Pegar do contexto de autenticação
      lessons: lessons
    };

    try {
      const response = await createCourse(courseData);
      
      // Verificar se a resposta contém a mensagem personalizada
      if (response && response.message) {
        toast({
          title: "Sucesso!",
          description: response.message,
          duration: 5000,
        });
      } else {
        // Fallback para resposta sem mensagem personalizada
        toast({
          title: "Curso criado com sucesso!",
          description: `ID do Curso: ${response?.id || 'N/A'}`,
          duration: 5000,
        });
      }
      
      navigate('/treinamentos');
    } catch (error) {
      console.error('Erro ao criar curso:', error);
    }
  };

  const categories = [
    'Tecnologia',
    'Negócios',
    'Marketing',
    'Design',
    'Desenvolvimento',
    'Vendas',
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  <VideoUpload
                    courseId={formData.title || 'temp'} // Usar título como ID temporário
                    lessonId={currentLesson.title || 'temp'} // Usar título como ID temporário
                    onUploadComplete={(result) => {
                      setCurrentLesson(prev => ({
                        ...prev,
                        videoUrl: result.videoUrl,
                        videoObjectName: result.videoObjectName
                      }));
                    }}
                    onUploadError={(error) => {
                      console.error('Erro no upload:', error);
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addLesson}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Aula
                </Button>
                <Button variant="outline" onClick={() => setActiveStep('preview')}>
                  Revisar Curso
                  <Eye className="h-4 w-4 ml-2" />
                </Button>
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
                            {lesson.videoUrl && (
                              <span className="text-xs text-green-600">✓ Vídeo carregado</span>
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
            <Button onClick={handleCreateCourse} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Curso
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