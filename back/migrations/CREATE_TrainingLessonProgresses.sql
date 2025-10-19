-- ============================================================================
-- MIGRATION: Criar tabela TrainingLessonProgresses
-- Data: 2025-10-18
-- Descrição: Tabela para rastrear progresso individual de cada aula
-- ============================================================================

CREATE TABLE IF NOT EXISTS `TrainingLessonProgresses` (
    `Id` CHAR(36) NOT NULL,
    `EnrollmentId` CHAR(36) NOT NULL,
    `LessonId` CHAR(36) NOT NULL,
    
    -- Progresso
    `IsCompleted` BOOLEAN NOT NULL DEFAULT FALSE,
    `CompletedAt` DATETIME(6) NULL,
    `WatchedSeconds` INT NOT NULL DEFAULT 0,
    `LastPositionSeconds` INT NOT NULL DEFAULT 0,
    
    -- Tracking
    `StartedAt` DATETIME(6) NULL,
    `LastWatchedAt` DATETIME(6) NULL,
    `WatchCount` INT NOT NULL DEFAULT 0,
    
    PRIMARY KEY (`Id`),
    
    -- Índices
    INDEX `IX_TrainingLessonProgresses_EnrollmentId` (`EnrollmentId`),
    INDEX `IX_TrainingLessonProgresses_LessonId` (`LessonId`),
    UNIQUE INDEX `IX_TrainingLessonProgresses_EnrollmentId_LessonId` (`EnrollmentId`, `LessonId`),
    
    -- Foreign Keys
    CONSTRAINT `FK_TrainingLessonProgresses_TrainingEnrollments_EnrollmentId` 
        FOREIGN KEY (`EnrollmentId`) 
        REFERENCES `TrainingEnrollments` (`Id`) 
        ON DELETE CASCADE,
        
    CONSTRAINT `FK_TrainingLessonProgresses_TrainingLessons_LessonId` 
        FOREIGN KEY (`LessonId`) 
        REFERENCES `TrainingLessons` (`Id`) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 
    TABLE_NAME,
    ENGINE,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'railway' 
  AND TABLE_NAME = 'TrainingLessonProgresses';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

