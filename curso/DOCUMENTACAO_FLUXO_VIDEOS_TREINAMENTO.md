# 📚 Documentação Completa - Sistema de Vídeo-Aulas de Treinamento

## 🎯 Visão Geral do Fluxo

Este documento detalha o fluxo completo para exibição de vídeo-aulas na página de curso individual do sistema MY PREGIATO.

**URL de Exemplo:** `https://my-pregiato-production.up.railway.app/treinamentos/curso/374e3768-4d2a-47db-b6d7-9d472f0ac630`

---

## 📊 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)                │
├─────────────────────────────────────────────────────────────────────┤
│  1. Página: /treinamentos/curso/[id].tsx                            │
│  2. Serviço: training-service.ts                                    │
│  3. API Client: api-client.ts                                       │
│  4. Componente: VideoPlayer.tsx (não utilizado atualmente)          │
│  5. Player: HTML5 <video> nativo                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
                              HTTP Request
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND API (.NET 8 + EF Core)                  │
├─────────────────────────────────────────────────────────────────────┤
│  1. Controller: TrainingCoursesController.cs                        │
│  2. Service: TrainingCourseService.cs                               │
│  3. Repository: TrainingCourseRepository.cs                         │
│  4. Storage Adapter: MinIOStorageAdapter.cs                         │
│  5. Database: MySQL (Railway)                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
                            Vídeos Armazenados
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    MINIO STORAGE (Railway)                           │
├─────────────────────────────────────────────────────────────────────┤
│  Endpoint: https://bucket-production-1aef.up.railway.app            │
│  Bucket: midias                                                      │
│  Path: /midias/Course/{NomeDoCurso}/{NomeDoVideo}.mp4              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo Detalhado Passo a Passo

### **1️⃣ FRONTEND - Carregamento Inicial da Página**

#### **Arquivo:** `front/src/pages/treinamentos/curso/[id].tsx`

**Linhas: 53-163** - `useEffect` para carregar dados do curso

```typescript
useEffect(() => {
  const carregarCurso = async () => {
    if (!id || !isUserLoaded) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Buscar dados do curso
      const cursoData = await trainingService.getCourseById(id);
      setCurso(cursoData);
      
      // 2. Buscar aulas específicas do curso
      const aulasData = await trainingService.getCourseLessons(id);
      
      // 3. Ordenar aulas por índice
      const aulasOrdenadas = aulasData.sort((a, b) => a.orderIndex - b.orderIndex);
      setAulas(aulasOrdenadas);
      
      // 4. Definir primeira aula como ativa
      if (aulasOrdenadas.length > 0) {
        setAulaAtiva(aulasOrdenadas[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar curso:', err);
      setError('Erro ao carregar o curso.');
    } finally {
      setIsLoading(false);
    }
  };
  
  carregarCurso();
}, [id, user, isUserLoaded, toast, showCertificatePrompt]);
```

**Estados Principais:**
- `curso`: Dados do curso (título, descrição, etc.)
- `aulas`: Lista de aulas do curso
- `aulaAtiva`: ID da aula atualmente selecionada
- `videoUrl`: URL do vídeo da aula ativa

---

### **2️⃣ FRONTEND - Carregamento da URL do Vídeo**

#### **Linhas: 166-181** - `useEffect` para carregar URL do vídeo

```typescript
useEffect(() => {
  const carregarVideoUrl = () => {
    const aula = aulas.find(a => a.id === aulaAtiva);
    if (!aula?.videoUrl) {
      console.warn('Aula sem videoUrl:', aula);
      return;
    }
    
    console.log('🎬 [CURSO] Usando URL direta do banco:', aula.videoUrl);
    setVideoUrl(aula.videoUrl);
  };
  
  if (aulaAtiva && aulas.length > 0) {
    carregarVideoUrl();
  }
}, [aulaAtiva, aulas]);
```

**Fluxo:**
1. Busca a aula ativa pelo ID
2. Extrai o `videoUrl` da aula
3. Define o `videoUrl` no estado
4. O player HTML5 renderiza o vídeo

---

### **3️⃣ FRONTEND - Serviço de Treinamentos**

#### **Arquivo:** `front/src/services/training-service.ts`

**Método Principal: `getCourseLessons`**

```typescript
async getCourseLessons(id: string): Promise<TrainingLesson[]> {
  return await apiClient.get<TrainingLesson[]>(
    `${this.baseUrl}/TrainingCourses/${id}/lessons`
  );
}
```

**Método: `getCourseById`**

```typescript
async getCourseById(id: string): Promise<TrainingCourse> {
  return await apiClient.get<TrainingCourse>(
    `${this.baseUrl}/TrainingCourses/${id}`
  );
}
```

**Base URL:** `https://pregiato-api-production.up.railway.app/api`

---

### **4️⃣ FRONTEND - API Client (Axios)**

#### **Arquivo:** `front/src/api-client.ts`

**Configurações Importantes:**

```typescript
this.client = axios.create({
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token Clerk
this.client.interceptors.request.use(
  async (config) => {
    const clerk = (window as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
    if (clerk?.session) {
      const token = await clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  }
);
```

---

### **5️⃣ BACKEND - Controller de Cursos**

#### **Arquivo:** `back/Pregiato.API/Controllers/TrainingCoursesController.cs`

**Endpoint 1: GET `/api/TrainingCourses/{id}`**

```csharp
[HttpGet("{id}")]
public async Task<ActionResult<TrainingCourseDto>> GetById(Guid id)
{
    try
    {
        var course = await _courseService.GetByIdAsync(id);
        if (course == null)
            return NotFound("Curso não encontrado");

        return Ok(course);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erro ao buscar curso {CourseId}", id);
        return StatusCode(500, "Erro interno do servidor");
    }
}
```

**Endpoint 2: GET `/api/TrainingCourses/{id}/lessons`**

```csharp
[HttpGet("{id}/lessons")]
public async Task<ActionResult<IEnumerable<TrainingLessonDto>>> GetLessons(Guid id)
{
    try
    {
        _logger.LogInformation("🔍 [LESSONS] Buscando aulas do curso {CourseId}", id);
        
        // ✅ BUSCAR DIRETAMENTE NA TABELA TrainingLessons
        var lessons = await _context.TrainingLessons
            .Where(l => l.CourseId == id && l.DeletedAt == null)
            .OrderBy(l => l.OrderIndex)
            .ToListAsync();
        
        _logger.LogInformation("📚 [LESSONS] Encontradas {Count} aulas", lessons.Count);
        
        // Mapear para DTO manualmente
        var lessonDtos = lessons.Select(l => new TrainingLessonDto
        {
            Id = l.Id,
            CourseId = l.CourseId,
            Title = l.Title,
            Description = l.Description,
            OrderIndex = l.OrderIndex,
            VideoUrl = l.VideoUrl, // ⭐ URL COMPLETA DO MINIO
            VideoObjectName = l.VideoObjectName,
            VideoSize = l.VideoSize,
            VideoDurationSeconds = l.VideoDurationSeconds,
            VideoMimeType = l.VideoMimeType,
            AttachmentsJson = l.AttachmentsJson,
            IsActive = l.IsActive,
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt
        }).ToList();
        
        return Ok(lessonDtos);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "❌ [LESSONS] Erro ao buscar aulas do curso {CourseId}", id);
        return StatusCode(500, "Erro interno do servidor");
    }
}
```

**Autenticação:** ⚠️ **TEMPORARIAMENTE DESABILITADA** (linha 13)

---

### **6️⃣ BACKEND - Estrutura do Banco de Dados**

#### **Tabela: `TrainingCourses`**

```sql
CREATE TABLE TrainingCourses (
    Id CHAR(36) PRIMARY KEY,
    Title VARCHAR(200) NOT NULL,
    Description TEXT,
    Category VARCHAR(100),
    ThumbnailUrl VARCHAR(500),
    TotalLessons INT DEFAULT 0,
    TotalDurationMinutes INT DEFAULT 0,
    TotalLikes INT DEFAULT 0,
    TotalDislikes INT DEFAULT 0,
    AverageRating DECIMAL(3,2) DEFAULT 0,
    IsPublished BOOLEAN DEFAULT FALSE,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    DeletedAt DATETIME NULL
);
```

#### **Tabela: `TrainingLessons`**

```sql
CREATE TABLE TrainingLessons (
    Id CHAR(36) PRIMARY KEY,
    CourseId CHAR(36) NOT NULL,
    Title VARCHAR(200) NOT NULL,
    Description TEXT,
    OrderIndex INT NOT NULL,
    VideoUrl VARCHAR(500), -- ⭐ URL COMPLETA DO MINIO
    VideoObjectName VARCHAR(500), -- Nome do objeto no MinIO
    VideoSize BIGINT,
    VideoDurationSeconds INT,
    VideoMimeType VARCHAR(50),
    AttachmentsJson TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    DeletedAt DATETIME NULL,
    FOREIGN KEY (CourseId) REFERENCES TrainingCourses(Id)
);
```

**Exemplo de Registro:**

```sql
Id: 08de0ca5-a403-4fca-8cc3-10791f972a84
CourseId: 374e3768-4d2a-47db-b6d7-9d472f0ac630
Title: Testde de curso My Pregiato Apresentaçao 1
VideoUrl: https://bucket-production-1aef.up.railway.app/midias/Course/Testde_de_curso_My_Pregiato_Apresentaçao_/20251016_111746_ce65cdc8_Testde_de_curso_My_Pregiato_Apresentaçao__1.mp4
VideoObjectName: Course/Testde_de_curso_My_Pregiato_Apresentaçao_/20251016_111746_ce65cdc8_Testde_de_curso_My_Pregiato_Apresentaçao__1.mp4
OrderIndex: 1
```

---

### **7️⃣ BACKEND - MinIO Storage Adapter**

#### **Arquivo:** `back/Pregiato.Infrastructure/Adapters/MinIOStorageAdapter.cs`

**Método: `GetPublicUrlAsync`**

```csharp
public Task<string> GetPublicUrlAsync(string objectName)
{
    try
    {
        // Gerar URL pública válida do MinIO
        var baseUrl = _options.UseSSL ? "https://" : "http://";
        var endpoint = _options.Endpoint.Replace("https://", "").Replace("http://", "");
        
        // URL final: https://bucket-production-1aef.up.railway.app/midias/objectName
        var publicUrl = $"{baseUrl}{endpoint}/{_options.BucketName}/{objectName}";
        
        _logger.LogInformation("🔗 [MINIO] URL pública gerada: {PublicUrl}", publicUrl);
        
        return Task.FromResult(publicUrl);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "❌ [MINIO] Erro ao gerar URL pública");
        throw;
    }
}
```

**Configurações MinIO (appsettings.json):**

```json
{
  "MinIO": {
    "Endpoint": "bucket-production-1aef.up.railway.app",
    "AccessKey": "****",
    "SecretKey": "****",
    "BucketName": "midias",
    "UseSSL": true,
    "Region": "us-east-1"
  }
}
```

---

### **8️⃣ FRONTEND - Renderização do Player**

#### **Arquivo:** `front/src/pages/treinamentos/curso/[id].tsx`

**Linhas: 426-475** - Renderização do Player HTML5

```typescript
<div className="lg:col-span-3 space-y-4">
  {aulaAtivaDados && videoUrl ? (
    <>
      {/* Player HTML5 com CORS configurado */}
      <Card>
        <CardContent className="p-0">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              key={videoUrl} // Força re-render ao trocar vídeo
              src={videoUrl} // URL direta do MinIO
              controls // Controles nativos do navegador
              controlsList="nodownload" // Desabilita download
              className="w-full h-auto"
              style={{ maxHeight: '70vh' }}
              preload="metadata" // Carrega apenas metadados
              crossOrigin="anonymous" // ✅ CRÍTICO: MinIO não usa credenciais
              onError={(e) => {
                // Log detalhado de erros de vídeo
                console.error('❌ [VIDEO] Erro:', e.currentTarget.error);
                console.error('❌ [VIDEO] URL:', videoUrl);
              }}
              onLoadStart={() => console.log('🎬 [VIDEO] Carregando')}
              onLoadedMetadata={() => console.log('✅ [VIDEO] Metadados OK')}
              onCanPlay={() => console.log('✅ [VIDEO] Pronto')}
            >
              <source src={videoUrl} type="video/mp4" />
              Seu navegador não suporta a tag de vídeo.
            </video>
          </div>
        </CardContent>
      </Card>
      
      {/* Informações da Aula */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold">{aulaAtivaDados.title}</h2>
          <p className="text-muted-foreground">{aulaAtivaDados.description}</p>
        </CardContent>
      </Card>
    </>
  ) : (
    <Card>
      <CardContent className="p-12 text-center">
        <p className="text-muted-foreground">
          {aulas.length === 0 
            ? 'Este curso ainda não possui aulas.' 
            : 'Carregando vídeo...'}
        </p>
      </CardContent>
    </Card>
  )}
</div>
```

---

### **9️⃣ SEGURANÇA - Content Security Policy (CSP)**

#### **Arquivo:** `front/index.html` e `front/dist/index.html`

**Linha 10** - Meta tag CSP

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: 
    https://fonts.googleapis.com 
    https://clerk.com 
    https://*.clerk.accounts.dev; 
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
  font-src 'self' data: blob: https://fonts.gstatic.com; 
  img-src 'self' data: blob: https:; 
  media-src 'self' data: blob: https: 
    https://bucket-production-1aef.up.railway.app; 
  connect-src 'self' 
    https://clerk.com 
    https://*.clerk.accounts.dev 
    https://clerk-telemetry.com 
    https://pregiato-api-production.up.railway.app 
    https://bucket-production-1aef.up.railway.app 
    https://viacep.com.br 
    wss:; 
  frame-src 'self' https://clerk.com https://*.clerk.accounts.dev; 
  worker-src 'self' blob:; 
  child-src 'self' blob:; 
  object-src 'none'; 
  base-uri 'self';">
```

**Diretivas Críticas para Vídeos:**
- ✅ `media-src`: Permite carregar vídeos do MinIO
- ✅ `connect-src`: Permite fazer requisições para API e MinIO
- ✅ `script-src 'unsafe-eval'`: Permite execução do Clerk

---

## 🐛 Diagnóstico de Problemas Conhecidos

### **❌ PROBLEMA: Vídeos não são exibidos**

#### **Possíveis Causas:**

1. **CSP muito restritivo**
   - **Sintoma:** Console do navegador mostra erro de CSP
   - **Verificação:** Abrir DevTools → Console → Procurar por "Content Security Policy"
   - **Solução:** Verificar se `media-src` inclui `https://bucket-production-1aef.up.railway.app`

2. **URL do vídeo inválida ou não acessível**
   - **Sintoma:** Erro 404 ou CORS no console
   - **Verificação:** Copiar `videoUrl` do console e testar diretamente no navegador
   - **Solução:** Verificar se o vídeo existe no MinIO e se as permissões estão corretas

3. **Condição de renderização não satisfeita**
   - **Sintoma:** Player não aparece, mostra "Carregando vídeo..."
   - **Verificação:** Verificar valores de `aulaAtivaDados`, `videoUrl` no console
   - **Solução:** Garantir que `setAulaAtiva` é chamado após carregar aulas

4. **CORS bloqueado pelo MinIO** ⚠️ **PROBLEMA CRÍTICO**
   - **Sintoma:** Erro CORS no console do navegador
   - **Verificação:** Network tab → Ver resposta da requisição ao MinIO
   - **Solução:** Configurar CORS no MinIO bucket (ver seção abaixo)

5. **Enrollment necessário mas não criado**
   - **Sintoma:** Condição `enrollment && videoUrl` sempre falsa
   - **Verificação:** Todo código de enrollment está comentado
   - **Solução:** Remover dependência de `enrollment` da condição (✅ JÁ IMPLEMENTADO)

---

## 🔧 Configuração Manual de CORS no MinIO

### **⚠️ PASSO CRÍTICO PARA STREAMING DE VÍDEO**

Para que os vídeos sejam exibidos no frontend, é **obrigatório** configurar CORS no bucket MinIO. Sem isso, o navegador bloqueará as requisições de vídeo.

### **Opção 1: Configurar via MinIO Console (Recomendado)**

1. **Acessar MinIO Console:**
   ```
   https://bucket-production-1aef.up.railway.app
   ```

2. **Login com credenciais de admin**

3. **Navegar para o bucket `midias`**

4. **Acessar "Settings" → "CORS Configuration"**

5. **Adicionar a seguinte configuração CORS:**

```json
{
  "CORSRules": [
    {
      "AllowedOrigin": ["https://my-pregiato-production.up.railway.app"],
      "AllowedMethod": ["GET", "HEAD", "OPTIONS"],
      "AllowedHeader": ["*"],
      "ExposeHeader": ["Accept-Ranges", "Content-Range", "Content-Length", "ETag"],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

6. **Salvar configuração**

---

### **Opção 2: Configurar via MinIO Client (mc)**

```bash
# 1. Instalar MinIO Client
brew install minio/stable/mc

# 2. Configurar alias para o servidor
mc alias set pregiato-minio https://bucket-production-1aef.up.railway.app ACCESS_KEY SECRET_KEY

# 3. Criar arquivo de configuração CORS (cors.json)
cat > cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigin": ["https://my-pregiato-production.up.railway.app"],
      "AllowedMethod": ["GET", "HEAD", "OPTIONS"],
      "AllowedHeader": ["*"],
      "ExposeHeader": ["Accept-Ranges", "Content-Range", "Content-Length", "ETag"],
      "MaxAgeSeconds": 86400
    }
  ]
}
EOF

# 4. Aplicar configuração CORS
mc anonymous set-json cors.json pregiato-minio/midias

# 5. Verificar configuração
mc anonymous get-json pregiato-minio/midias
```

---

### **Opção 3: Tornar bucket público (Alternativa)**

⚠️ **Atenção:** Esta opção expõe todos os arquivos publicamente

```bash
# Tornar bucket público para leitura
mc anonymous set download pregiato-minio/midias
```

---

### **Verificar se CORS está funcionando**

```bash
# Testar requisição CORS
curl -v -H "Origin: https://my-pregiato-production.up.railway.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: range" \
  -X OPTIONS \
  https://bucket-production-1aef.up.railway.app/midias/Course/test.mp4
```

**Resposta esperada:**
```
HTTP/2 200
access-control-allow-origin: https://my-pregiato-production.up.railway.app
access-control-allow-methods: GET, HEAD, OPTIONS
access-control-allow-headers: *
access-control-expose-headers: Accept-Ranges, Content-Range, Content-Length, ETag
access-control-max-age: 86400
```

---

### **Explicação dos Headers CORS**

| Header | Descrição |
|--------|-----------|
| `AllowedOrigin` | Domínio permitido a acessar os recursos |
| `AllowedMethod` | Métodos HTTP permitidos (GET para streaming) |
| `AllowedHeader` | Headers que o navegador pode enviar |
| `ExposeHeader` | Headers que o navegador pode ler na resposta |
| `MaxAgeSeconds` | Tempo de cache da política CORS (24 horas) |

**Headers críticos para streaming de vídeo:**
- `Accept-Ranges`: Permite download parcial (seek no vídeo)
- `Content-Range`: Informa qual parte do vídeo está sendo enviada
- `Content-Length`: Tamanho total do arquivo
- `ETag`: Cache e validação

---

## 🔍 Checklist de Depuração

### **Frontend**

```typescript
// Adicionar logs no console
console.log('🎯 [DEBUG] ID do Curso:', id);
console.log('📚 [DEBUG] Aulas carregadas:', aulas);
console.log('🎬 [DEBUG] Aula ativa ID:', aulaAtiva);
console.log('🎬 [DEBUG] Aula ativa dados:', aulaAtivaDados);
console.log('🔗 [DEBUG] Video URL:', videoUrl);
```

**Verificar no Console:**
1. ✅ Aulas foram carregadas?
2. ✅ `aulaAtiva` tem valor?
3. ✅ `aulaAtivaDados` foi encontrada?
4. ✅ `videoUrl` está definida?
5. ✅ Erros de rede ou CORS?

---

### **Backend**

**Logs no TrainingCoursesController:**

```csharp
_logger.LogInformation("🔍 [LESSONS] Buscando aulas do curso {CourseId}", id);
_logger.LogInformation("📚 [LESSONS] Encontradas {Count} aulas", lessons.Count);
_logger.LogInformation("📖 [LESSONS] Aula: {Title} (VideoUrl: {VideoUrl})", 
    lesson.Title, lesson.VideoUrl);
```

**Verificar Logs:**
1. ✅ Endpoint `/lessons` foi chamado?
2. ✅ Aulas foram encontradas no banco?
3. ✅ `VideoUrl` está presente nos registros?
4. ✅ Erros de serialização JSON?

---

### **Banco de Dados**

```sql
-- Verificar se curso existe
SELECT * FROM TrainingCourses WHERE Id = '374e3768-4d2a-47db-b6d7-9d472f0ac630';

-- Verificar aulas do curso
SELECT * FROM TrainingLessons 
WHERE CourseId = '374e3768-4d2a-47db-b6d7-9d472f0ac630' 
  AND DeletedAt IS NULL;

-- Verificar URLs dos vídeos
SELECT Id, Title, VideoUrl, VideoObjectName 
FROM TrainingLessons 
WHERE CourseId = '374e3768-4d2a-47db-b6d7-9d472f0ac630';
```

---

### **MinIO Storage**

**Verificar se vídeo existe:**

```bash
# Testar URL diretamente
curl -I https://bucket-production-1aef.up.railway.app/midias/Course/Testde_de_curso_My_Pregiato_Apresentaçao_/20251016_111746_ce65cdc8_Testde_de_curso_My_Pregiato_Apresentaçao__1.mp4
```

**Resposta esperada:**
```
HTTP/2 200 
content-type: video/mp4
content-length: 24881398
```

---

## 🎯 Fluxo Simplificado (Resumo)

```
1. Usuário acessa /treinamentos/curso/{id}
   ↓
2. useEffect carrega curso e aulas via API
   ↓
3. Define primeira aula como ativa (setAulaAtiva)
   ↓
4. useEffect detecta aulaAtiva e extrai videoUrl
   ↓
5. Player HTML5 renderiza com src={videoUrl}
   ↓
6. Navegador faz requisição direta ao MinIO
   ↓
7. MinIO retorna vídeo via streaming HTTP
   ↓
8. Player exibe vídeo
```

---

## 📋 Estado Atual do Sistema

### ✅ **Funcionalidades Implementadas:**
- [x] Busca de cursos por ID
- [x] Busca de aulas por CourseId
- [x] Ordenação de aulas por índice
- [x] Definição automática da primeira aula
- [x] Player HTML5 nativo
- [x] CSP configurado para MinIO
- [x] URLs públicas do MinIO
- [x] Playlist lateral de aulas
- [x] Troca de aula ao clicar

### ⚠️ **Funcionalidades Desabilitadas:**
- [ ] Sistema de enrollment (auto-matrícula)
- [ ] Salvamento de progresso
- [ ] Sistema de likes/dislikes
- [ ] Geração de certificados
- [ ] VideoPlayer customizado (substituído por HTML5 nativo)

### 🚧 **Problemas Conhecidos:**
- ❌ Vídeos não estão sendo exibidos em produção
- ❌ Possível problema de CORS no MinIO
- ❌ CSP pode estar bloqueando recursos

---

## 🛠️ Próximos Passos para Resolução

### **1. Verificar Console do Navegador**
- Abrir DevTools (F12)
- Aba Console → Procurar erros
- Aba Network → Ver requisições ao MinIO

### **2. Testar URL do Vídeo Diretamente**
- Copiar `videoUrl` do console
- Abrir em nova aba
- Verificar se o vídeo carrega

### **3. Verificar CSP**
- Verificar se `media-src` inclui MinIO
- Verificar se `connect-src` inclui MinIO
- Recompilar frontend se necessário

### **4. Verificar CORS no MinIO**
- Configurar bucket policy para permitir acesso público
- Configurar CORS headers no MinIO

### **5. Logs do Backend**
- Verificar logs da Railway
- Confirmar que endpoint `/lessons` retorna dados
- Verificar se `VideoUrl` está presente

---

## 📞 Contato e Suporte

**Desenvolvedor:** AI Assistant  
**Data:** 17 de Outubro de 2025  
**Versão:** 1.0.0  

---

## 📚 Referências

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [Content Security Policy (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HTML5 Video Element (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [React Router v6](https://reactrouter.com/)
- [ASP.NET Core Controllers](https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/actions)

---

**Última Atualização:** 2025-10-17  
**Status:** 🔴 Sistema com problema de exibição de vídeos - em investigação

