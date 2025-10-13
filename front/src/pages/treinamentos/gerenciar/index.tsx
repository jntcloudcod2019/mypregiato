import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Clock, 
  Users, 
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { useTrainingCourses } from '@/hooks/use-training-courses';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function GerenciarTreinamentosPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const { courses, isLoading, deleteCourse } = useTrainingCourses({});

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (courseId: string) => {
    navigate(`/treinamentos/editar/${courseId}`);
  };

  const handleDeleteClick = (courseId: string) => {
    setCourseToDelete(courseId);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      await deleteCourse(courseToDelete);
      toast({
        title: 'Curso deletado!',
        description: 'O curso foi removido com sucesso.',
      });
      setCourseToDelete(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível deletar o curso.';
      toast({
        title: 'Erro ao deletar curso',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/treinamentos')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Gerenciar Treinamentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Edite, atualize ou remova cursos existentes
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>


      {/* Courses List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando cursos...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Nenhum curso encontrado</p>
            <p className="text-muted-foreground">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando um novo curso'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{course.title}</h3>
                      <Badge variant={course.isActive ? 'default' : 'secondary'}>
                        {course.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {course.difficulty && (
                        <Badge variant="outline">{course.difficulty}</Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.totalLessons || 0} aulas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.totalDurationMinutes || 0} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrollments?.length || 0} alunos</span>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      <strong>ID:</strong> {course.id}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(course.id)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(course.id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O curso e todas as suas aulas serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

