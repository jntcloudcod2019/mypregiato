# 🚀 GUIA COMPLETO DE IMPLEMENTAÇÃO
## Módulo de Treinamentos - Passo a Passo

---

## 📋 **ÍNDICE**

1. [Pré-requisitos](#prerequisites)
2. [Configuração Inicial](#setup)
3. [Implementação Backend](#backend)
4. [Implementação Frontend](#frontend)
5. [Testes](#tests)
6. [Deploy](#deploy)
7. [Checklist Final](#checklist)

---

<a name="prerequisites"></a>
## ✅ **PRÉ-REQUISITOS**

### **Infraestrutura Existente**
- [x] MinIO configurado e funcionando
- [x] MySQL Railway conectado
- [x] Clerk Authentication ativo
- [x] Backend .NET 8 rodando
- [x] Frontend React + Vite funcionando

### **Pacotes Necessários (já instalados)**
- [x] Minio 6.0.2 (.NET)
- [x] Entity Framework Core 8.0
- [x] FluentValidation
- [x] AutoMapper
- [x] PuppeteerSharp
- [x] Axios (Frontend)
- [x] React Query (Frontend)

---

<a name="setup"></a>
## 🔧 **CONFIGURAÇÃO INICIAL**

### **Passo 1: Criar Branch de Feature**

```bash
cd "/Users/worldgames/Documents/PREGIATO/My_pregiato /mypregiato"

# Criar branch
git checkout -b feature/training-module

# Verificar branch atual
git branch
```

### **Passo 2: Registrar Services no Program.cs**

Adicionar no arquivo `back/Pregiato.API/Program.cs`:

```csharp
// Training Services (adicionar após linha 149)
builder.Services.AddScoped<ITrainingCourseRepository, TrainingCourseRepository>();
builder.Services.AddScoped<ITrainingEnrollmentRepository, TrainingEnrollmentRepository>();
builder.Services.AddScoped<ITrainingCourseService, TrainingCourseService>();
builder.Services.AddScoped<ITrainingLessonService, TrainingLessonService>();
builder.Services.AddScoped<ITrainingEnrollmentService, TrainingEnrollmentService>();
builder.Services.AddScoped<TrainingVideoService>();

// Training Validators
builder.Services.AddScoped<IValidator<CreateCourseDto>, CreateCourseDtoValidator>();
builder.Services.AddScoped<IValidator<CreateLessonDto>, CreateLessonDtoValidator>();
```

### **Passo 3: Criar Estrutura de Pastas**

```bash
# Backend
mkdir -p back/Pregiato.Core/Entities
mkdir -p back/Pregiato.Application/DTOs/Training
mkdir -p back/Pregiato.Application/Services
mkdir -p back/Pregiato.Application/Validators
mkdir -p back/Pregiato.Infrastructure/Repositories
mkdir -p back/Pregiato.API/Services

# Frontend
mkdir -p front/src/services
mkdir -p front/src/components/training
mkdir -p front/src/hooks
```

---

<a name="backend"></a>
## 🏗️ **IMPLEMENTAÇÃO BACKEND**

### **Fase 1: Criar Entidades (30min)**

Copie os arquivos de entidades do `REFINAMENTO_IMPLEMENTACAO_TREINAMENTOS.md`:

```bash
# Criar todas as entidades
touch back/Pregiato.Core/Entities/TrainingCourse.cs
touch back/Pregiato.Core/Entities/TrainingLesson.cs
touch back/Pregiato.Core/Entities/TrainingEnrollment.cs
touch back/Pregiato.Core/Entities/TrainingLessonProgress.cs
touch back/Pregiato.Core/Entities/TrainingRating.cs
touch back/Pregiato.Core/Entities/TrainingCertificate.cs
```

Copie o conteúdo de cada arquivo do documento de refinamento.

### **Fase 2: Atualizar DbContext e Migration (1h)**

1. **Adicionar DbSets no `PregiatoDbContext.cs`**
2. **Adicionar configurações no `OnModelCreating`**
3. **Criar e aplicar migration:**

```bash
cd "/Users/worldgames/Documents/PREGIATO/My_pregiato /mypregiato/back"

# Criar migration
dotnet ef migrations add AddTrainingModule \
  --project Pregiato.Infrastructure \
  --startup-project Pregiato.API \
  --output-dir Migrations

# Visualizar SQL que será executado
dotnet ef migrations script --project Pregiato.Infrastructure

# Aplicar em desenvolvimento
dotnet ef database update --project Pregiato.Infrastructure --startup-project Pregiato.API

# Verificar tabelas criadas
# Conecte no MySQL e execute:
# SHOW TABLES LIKE 'Training%';
```

### **Fase 3: Criar DTOs e Validators (1h)**

Criar arquivos conforme `REFINAMENTO_IMPLEMENTACAO_TREINAMENTOS.md`:

```bash
# DTOs
touch back/Pregiato.Application/DTOs/Training/CourseDto.cs
touch back/Pregiato.Application/DTOs/Training/CreateCourseDto.cs
touch back/Pregiato.Application/DTOs/Training/LessonDto.cs
touch back/Pregiato.Application/DTOs/Training/CreateLessonDto.cs
touch back/Pregiato.Application/DTOs/Training/ProgressDto.cs
touch back/Pregiato.Application/DTOs/Training/CertificateDto.cs

# Validators
touch back/Pregiato.Application/Validators/CreateCourseDtoValidator.cs
touch back/Pregiato.Application/Validators/CreateLessonDtoValidator.cs
```

### **Fase 4: Implementar Repositories (2h)**

```bash
# Interfaces
touch back/Pregiato.Core/Interfaces/ITrainingCourseRepository.cs
touch back/Pregiato.Core/Interfaces/ITrainingEnrollmentRepository.cs

# Implementações
touch back/Pregiato.Infrastructure/Repositories/TrainingCourseRepository.cs
touch back/Pregiato.Infrastructure/Repositories/TrainingEnrollmentRepository.cs
```

### **Fase 5: Implementar Services (3h)**

```bash
# Interfaces
touch back/Pregiato.Application/Interfaces/ITrainingCourseService.cs
touch back/Pregiato.Application/Interfaces/ITrainingLessonService.cs
touch back/Pregiato.Application/Interfaces/ITrainingEnrollmentService.cs

# Implementações
touch back/Pregiato.Application/Services/TrainingCourseService.cs
touch back/Pregiato.Application/Services/TrainingLessonService.cs
touch back/Pregiato.Application/Services/TrainingEnrollmentService.cs
touch back/Pregiato.API/Services/TrainingVideoService.cs
```

### **Fase 6: Criar Controllers (2h)**

```bash
touch back/Pregiato.API/Controllers/TrainingCoursesController.cs
touch back/Pregiato.API/Controllers/TrainingLessonsController.cs
touch back/Pregiato.API/Controllers/TrainingEnrollmentsController.cs
```

### **Fase 7: Configurar AutoMapper (30min)**

Adicionar no `back/Pregiato.Application/Mappings/AutoMapperProfile.cs`:

```csharp
// Training mappings
CreateMap<TrainingCourse, CourseDto>();
CreateMap<CreateCourseDto, TrainingCourse>();
CreateMap<TrainingLesson, LessonDto>();
CreateMap<CreateLessonDto, TrainingLesson>();
CreateMap<TrainingEnrollment, EnrollmentStatusDto>();
CreateMap<TrainingLessonProgress, LessonProgressDto>();
```

### **Fase 8: Testar Backend (1h)**

```bash
# Executar API
cd back
dotnet run --project Pregiato.API

# Em outro terminal, testar endpoints
curl http://localhost:5000/api/training/courses
curl http://localhost:5000/health
```

**Testar com Postman/Insomnia:**
- GET `/api/training/courses`
- POST `/api/training/courses` (com FormData)
- POST `/api/training/courses/{id}/lessons` (com vídeo)

---

<a name="frontend"></a>
## 🎨 **IMPLEMENTAÇÃO FRONTEND**

### **Fase 1: Configurar Services (1h)**

```bash
cd front

# Criar services
touch src/services/training-service.ts
```

Copiar conteúdo do `REFINAMENTO_IMPLEMENTACAO_TREINAMENTOS_PARTE2.md`

### **Fase 2: Criar Hooks Customizados (1h)**

#### **Arquivo: `front/src/hooks/use-training-courses.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '@/services/training-service';

export const useTrainingCourses = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: ['training-courses', params],
    queryFn: () => trainingService.getCourses(params || {}),
  });
};

export const useTrainingCourse = (id: string) => {
  return useQuery({
    queryKey: ['training-course', id],
    queryFn: () => trainingService.getCourse(id),
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => trainingService.createCourse(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
    },
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => trainingService.enrollCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
    },
  });
};
```

### **Fase 3: Criar Componentes (3h)**

```bash
# Componentes de Training
touch front/src/components/training/video-player.tsx
touch front/src/components/training/course-card.tsx
touch front/src/components/training/lesson-list.tsx
touch front/src/components/training/upload-progress.tsx
```

#### **Exemplo: `front/src/components/training/course-card.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Course } from '@/services/training-service';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        {course.thumbnailUrl && (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {course.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {course.userEnrollment && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{course.userEnrollment.progressPercentage}%</span>
            </div>
            <Progress value={course.userEnrollment.progressPercentage} />
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{course.totalLessons} aulas</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{Math.floor(course.totalDurationMinutes / 60)}h</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/treinamentos/curso/${course.id}`} className="flex-1">
            <Button className="w-full">
              <Play className="h-4 w-4 mr-2" />
              {course.userEnrollment ? 'Continuar' : 'Iniciar'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
```

### **Fase 4: Refatorar Páginas Existentes (2h)**

Atualizar arquivos existentes para usar API:

```bash
# Atualizar páginas
# front/src/pages/treinamentos/index.tsx (usar hooks e API)
# front/src/pages/treinamentos/criar/index.tsx (upload para API)
# front/src/pages/treinamentos/curso/[id].tsx (VideoPlayer component)
```

### **Fase 5: Testar Frontend (1h)**

```bash
# Executar frontend
cd front
npm run dev

# Abrir navegador
open http://localhost:5173/treinamentos
```

**Testar fluxo completo:**
1. ✅ Listar cursos
2. ✅ Criar novo curso (com thumbnail)
3. ✅ Adicionar aula (upload de vídeo)
4. ✅ Matricular em curso
5. ✅ Assistir aula (streaming)
6. ✅ Marcar como concluído
7. ✅ Visualizar progresso

---

<a name="tests"></a>
## 🧪 **TESTES**

### **Teste 1: Upload de Vídeo**

```bash
# Testar upload de vídeo grande (100MB+)
# Verificar progress bar
# Confirmar armazenamento no MinIO
```

### **Teste 2: Streaming de Vídeo**

```bash
# Testar Range Requests
curl -H "Range: bytes=0-1000" http://localhost:5000/api/training/courses/{id}/lessons/{id}/stream

# Verificar se retorna status 206 Partial Content
```

### **Teste 3: Progresso Automático**

```bash
# Assistir 50% de uma aula
# Fechar navegador
# Reabrir e verificar se retoma do ponto correto
```

### **Teste 4: Conclusão de Curso**

```bash
# Completar todas as aulas
# Verificar se marca curso como concluído
# Verificar se gera certificado
```

---

<a name="deploy"></a>
## 🚀 **DEPLOY**

### **Passo 1: Build Backend**

```bash
cd back

# Build em modo Release
dotnet build -c Release

# Criar migration SQL para produção
dotnet ef migrations script --project Pregiato.Infrastructure --idempotent -o migration.sql
```

### **Passo 2: Build Frontend**

```bash
cd front

# Build para produção
npm run build

# Testar build local
npm run preview
```

### **Passo 3: Deploy Railway (Backend)**

```bash
# Commit das alterações
git add .
git commit -m "feat: Add training module with MinIO integration"

# Push para Railway (trigger auto-deploy)
git push origin feature/training-module

# Ou fazer merge para main
git checkout main
git merge feature/training-module
git push origin main
```

### **Passo 4: Aplicar Migration em Produção**

```bash
# Conectar no banco de produção Railway
mysql -h gondola.proxy.rlwy.net -P 23254 -u root -p railway

# Executar migration
source migration.sql;

# Verificar tabelas
SHOW TABLES LIKE 'Training%';
```

### **Passo 5: Verificar MinIO em Produção**

```bash
# Testar conectividade MinIO
curl https://bucket-production-1aef.up.railway.app

# Verificar bucket 'midias'
# Fazer upload de teste via API
```

---

<a name="checklist"></a>
## ✅ **CHECKLIST FINAL**

### **Backend**
- [ ] Entidades criadas (6 arquivos)
- [ ] DbContext atualizado
- [ ] Migration aplicada em dev
- [ ] Migration aplicada em prod
- [ ] Repositories implementados (2)
- [ ] Services implementados (4)
- [ ] Controllers implementados (3)
- [ ] Validators configurados (2)
- [ ] AutoMapper configurado
- [ ] MinIO integrado (TrainingVideoService)
- [ ] Clerk auth configurado nos endpoints
- [ ] Streaming com Range Requests funcionando

### **Frontend**
- [ ] Services TypeScript criados
- [ ] Hooks customizados (useTrainingCourses, etc)
- [ ] VideoPlayer component
- [ ] CourseCard component
- [ ] UploadProgress component
- [ ] Páginas refatoradas para usar API
- [ ] Upload com progress bar
- [ ] Auto-save de progresso
- [ ] Detecção automática de conclusão

### **Testes**
- [ ] Upload de vídeo (até 500MB)
- [ ] Streaming de vídeo
- [ ] Range Requests
- [ ] Progresso automático
- [ ] Conclusão de aula
- [ ] Conclusão de curso
- [ ] Geração de certificado

### **Deploy**
- [ ] Build backend (Release)
- [ ] Build frontend
- [ ] Migration aplicada em prod
- [ ] MinIO configurado em prod
- [ ] API rodando em prod
- [ ] Frontend deployado
- [ ] Testes E2E em produção

### **Documentação**
- [ ] README atualizado
- [ ] API documentada (Swagger)
- [ ] Guia de uso para usuários
- [ ] Guia de manutenção

---

## 📊 **ESTIMATIVA DE TEMPO TOTAL**

| Fase | Tempo Estimado |
|------|----------------|
| **Backend** | 10-12 horas |
| - Entidades e Migration | 1.5h |
| - DTOs e Validators | 1h |
| - Repositories | 2h |
| - Services | 3h |
| - Controllers | 2h |
| - Testes | 1.5h |
| **Frontend** | 8-10 horas |
| - Services | 1h |
| - Hooks | 1h |
| - Componentes | 3h |
| - Refatoração Páginas | 2h |
| - Testes | 2h |
| **Deploy** | 2-3 horas |
| **TOTAL** | **20-25 horas** |

---

## 🎉 **CONCLUSÃO**

Este guia fornece um **roteiro completo** para implementar o módulo de Treinamentos:

✅ **Infraestrutura existente 100% aproveitada**  
✅ **MinIO para vídeos (já configurado)**  
✅ **MySQL para dados (já conectado)**  
✅ **Clerk para auth (já integrado)**  
✅ **Arquitetura hexagonal mantida**  
✅ **Padrões de código seguidos**  
✅ **Upload com progress**  
✅ **Streaming otimizado**  
✅ **Auto-save de progresso**  

**Pronto para começar!** 🚀

---

**Próximos Passos:**
1. Revisar documentação
2. Criar branch de feature
3. Seguir checklist fase por fase
4. Testar continuamente
5. Deploy em produção

**Boa implementação!** 💪
