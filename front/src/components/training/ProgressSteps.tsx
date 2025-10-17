import React from 'react';
import { CheckCircle, Circle, Play } from 'lucide-react';
import { TrainingLesson, TrainingLessonProgressDto } from '@/types/training';

interface ProgressStepsProps {
  lessons: TrainingLesson[];
  lessonProgress: TrainingLessonProgressDto[];
  currentLessonId: string;
  onLessonClick: (lessonId: string) => void;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  lessons,
  lessonProgress,
  currentLessonId,
  onLessonClick
}) => {
  const getLessonStatus = (lessonId: string) => {
    const progress = lessonProgress.find(p => p.lessonId === lessonId);
    const isActive = currentLessonId === lessonId;
    const isCompleted = progress?.isCompleted || false;

    return { isActive, isCompleted, progress };
  };

  return (
    <div className="relative">
      {lessons.map((lesson, index) => {
        const { isActive, isCompleted } = getLessonStatus(lesson.id);
        const isLast = index === lessons.length - 1;

        return (
          <div key={lesson.id} className="relative">
            {/* Step */}
            <div
              className={`flex items-start gap-4 pb-8 cursor-pointer transition-all hover:opacity-80 ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}
              onClick={() => onLessonClick(lesson.id)}
            >
              {/* Icon & Line */}
              <div className="relative flex flex-col items-center">
                {/* Icon */}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 transition-all
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500' 
                      : isActive 
                        ? 'bg-primary border-primary animate-pulse' 
                        : 'bg-background border-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : isActive ? (
                    <Play className="h-5 w-5 text-white fill-white" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`
                      w-0.5 h-16 mt-1 transition-colors
                      ${isCompleted ? 'bg-green-500' : 'bg-muted'}
                    `}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 -mt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Aula {index + 1}
                  </span>
                  {isActive && (
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                      Em Andamento
                    </span>
                  )}
                </div>
                <h4
                  className={`font-medium text-sm leading-tight ${
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {lesson.title}
                </h4>
                {lesson.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {lesson.description}
                  </p>
                )}
                {lesson.videoDurationSeconds && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor(lesson.videoDurationSeconds / 60)} min
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

