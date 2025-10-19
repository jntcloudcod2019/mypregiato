-- ============================================================================
-- SCRIPT DE VERIFICAÇÃO E CRIAÇÃO DA TABELA TrainingLessonProgress
-- ============================================================================

-- 1. Verificar se a tabela existe
SELECT 
    TABLE_NAME,
    TABLE_SCHEMA,
    TABLE_TYPE
FROM information_schema.TABLES 
WHERE TABLE_NAME LIKE '%TrainingLessonProgress%' 
  AND TABLE_SCHEMA = 'railway';

-- 2. Verificar estrutura da tabela (se existir)
DESCRIBE TrainingLessonProgress;

-- 3. Se a tabela não existir, criar com a estrutura correta:
CREATE TABLE IF NOT EXISTS `TrainingLessonProgress` (
    `Id` varchar(100) NOT NULL,
    `EnrollmentId` varchar(100) NOT NULL,
    `LessonId` varchar(100) NOT NULL,
    `IsCompleted` tinyint(1) NOT NULL DEFAULT 0,
    `StartedAt` datetime(6) NULL,
    `CompletedAt` datetime(6) NULL,
    `LastWatchedAt` datetime(6) NULL,
    `WatchedSeconds` int NOT NULL DEFAULT 0,
    `LastPositionSeconds` int NOT NULL DEFAULT 0,
    `WatchCount` int NOT NULL DEFAULT 0,
    PRIMARY KEY (`Id`),
    KEY `IX_TrainingLessonProgress_EnrollmentId` (`EnrollmentId`),
    KEY `IX_TrainingLessonProgress_LessonId` (`LessonId`),
    CONSTRAINT `FK_TrainingLessonProgress_TrainingEnrollments_EnrollmentId` 
        FOREIGN KEY (`EnrollmentId`) REFERENCES `TrainingEnrollments` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_TrainingLessonProgress_TrainingLessons_LessonId` 
        FOREIGN KEY (`LessonId`) REFERENCES `TrainingLessons` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Verificar se foi criada corretamente
SELECT 
    TABLE_NAME,
    TABLE_SCHEMA,
    TABLE_TYPE
FROM information_schema.TABLES 
WHERE TABLE_NAME = 'TrainingLessonProgress' 
  AND TABLE_SCHEMA = 'railway';
