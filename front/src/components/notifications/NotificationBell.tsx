import React, { useState, useEffect } from 'react';
import { Bell, BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { trainingService } from '@/services/training-service';
import { userManagementService } from '@/services/user-management-service';
import { TrainingProgressSummaryDto } from '@/types/training';

export const NotificationBell: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [incompleteCourses, setIncompleteCourses] = useState<TrainingProgressSummaryDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Buscar cursos em progresso
  useEffect(() => {
    const fetchIncompleteCourses = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      try {
        // ✅ Buscar usuário do banco primeiro
        const dbUser = await userManagementService.getUserByEmail(user.primaryEmailAddress.emailAddress);
        
        const enrollments = await trainingService.getEnrollments({
          userId: dbUser.id // ✅ Usar ID do MySQL
        });

        // Filtrar apenas cursos em progresso (não concluídos)
        const inProgress = enrollments.filter(e => 
          !e.completedAt && e.progressPercentage > 0 && e.progressPercentage < 100
        );

        setIncompleteCourses(inProgress as any);
        setUnreadCount(inProgress.length);
        
        console.log('🔔 [NOTIFICATIONS] Cursos em progresso:', inProgress.length);
      } catch (err) {
        console.error('❌ [NOTIFICATIONS] Erro ao buscar cursos em progresso:', err);
      }
    };

    if (user) {
      fetchIncompleteCourses();
      // Atualizar a cada 5 minutos
      const interval = setInterval(fetchIncompleteCourses, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleCourseClick = (courseId: string) => {
    navigate(`/treinamentos/curso/${courseId}`);
    setIsOpen(false);
  };

  const dismissNotification = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    setIncompleteCourses(prev => prev.filter(c => c.courseId !== courseId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount}</Badge>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {incompleteCourses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {incompleteCourses.map((course) => (
                <div
                  key={course.courseId}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors relative group"
                  onClick={() => handleCourseClick(course.courseId)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => dismissNotification(e, course.courseId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="flex items-start gap-3 pr-6">
                    <div className="flex-shrink-0 mt-1">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-tight">
                        Continue assistindo
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.courseTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${course.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(course.progressPercentage)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Não esqueça: assistir os cursos aumenta suas chances de Jobs!
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

