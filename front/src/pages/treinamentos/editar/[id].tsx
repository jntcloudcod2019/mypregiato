import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Save, 
  Plus,
  Trash2,
  Video,
  Eye
} from 'lucide-react';
import { useTrainingCourses } from '@/hooks/use-training-courses';
import { useToast } from '@/hooks/use-toast';
import VideoUpload from '@/components/training/VideoUpload';
import { CreateTrainingLessonDto } from '@/types/training';

export default function EditarTreinamentoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { courses, isLoading, updateCourse } = useTrainingCourses({});
  const course = courses?.find(c => c.id === id);

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

  const [activeTab, setActiveTab] = useState<'info' | 'lessons'>('info');

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description || '',
        category: course.category || '',
        difficulty: course.difficulty || 'Iniciante',
        isActive: course.isActive
      });
      
      if (course.lessons) {
        setLessons(course.lessons.map(lesson => ({
          title: lesson.title,
          description: lesson.description || '',
          orderIndex: lesson.orderIndex,
          videoUrl: lesson.videoUrl,
          videoObjectName: lesson.videoObjectName,
          videoDurationSeconds: lesson.videoDurationSeconds,
          videoMimeType: lesson.videoMimeType,
          isActive: lesson.isActive
        })));
      }
    }
  }, [course]);

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
    
    toast({
      title: "Aula removida",
      description: "A aula foi removida do curso."
    });
  };

  const handleSubmit = async () => {
    if (!id) return;

    if (!formData.title || !formData.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateCourse.mutateAsync({
        id,
        course: {
          ...formData,
          lessons
        }
      });

      toast({
        title: "Curso atualizado!",
        description: "As alterações foram salvas com sucesso."
      });

      navigate('/treinamentos/gerenciar');
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando curso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-semibold mb-2">Curso não encontrado</p>
            <Button onClick={() => navigate('/treinamentos/gerenciar')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = [
    'Tecnologia',
    'Negócios',
    'Marketing',
    'Design',
    'Desenvolvimento Pessoal',
    'Fotografia',
    'Modelagem',
    'Passarela',
    'Etiqueta',
    'Outro'
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/treinamentos/gerenciar')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Editar Treinamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações do curso e gerencie as aulas
          </p>
        </div>
        <Button size="lg" onClick={handleSubmit} disabled={updateCourse.isPending}>
          {updateCourse.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'info' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('info')}
        >
          Informações do Curso
        </Button>
        <Button
          variant={activeTab === 'lessons' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('lessons')}
        >
          Aulas ({lessons.length})
        </Button>
      </div>

      {/* Course Info Tab */}
      {activeTab === 'info' && (
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
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Curso Ativo</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lessons Tab */}
      {activeTab === 'lessons' && (
        <>
          {/* Add Lesson Form */}
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Aula</CardTitle>
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
                    courseId={id || 'temp'}
                    lessonId={currentLesson.title || 'temp'}
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

              <Button onClick={addLesson} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Aula
              </Button>
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
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-3 flex-1">
                        <Badge variant="outline">{lesson.orderIndex}</Badge>
                        <div className="flex-1">
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Duração: {lesson.videoDurationSeconds ? `${Math.floor(lesson.videoDurationSeconds / 60)}min ${lesson.videoDurationSeconds % 60}s` : 'Não definida'}
                            </span>
                            {lesson.videoUrl && (
                              <span className="text-xs text-green-600">✓ Vídeo carregado</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeLesson(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

