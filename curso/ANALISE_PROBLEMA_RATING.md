# 🐛 ANÁLISE DO PROBLEMA - Fluxo de Avaliações (Rating)

## 📋 RESUMO DO PROBLEMA

**Erro:** `POST /api/TrainingCourses/{id}/rating - 400 Bad Request`

**Causa Raiz:** Frontend não está enviando o parâmetro `userEmail` requerido pelo backend.

---

## 🔄 FLUXO ATUAL (COM PROBLEMA)

### **Frontend → Backend**

```typescript
// front/src/pages/treinamentos/curso/[id].tsx (linha 236)
await trainingService.addCourseRating(id, {
  courseId: id,
  ratingType: tipo.toUpperCase(),  // "LIKE" ou "DISLIKE"
  stars: tipo === 'like' ? 5 : 1,
});
```

```typescript
// front/src/services/training-service.ts (linha 97)
async addCourseRating(courseId: string, rating: CreateTrainingRatingDto): Promise<TrainingCourse> {
  return await apiClient.post<TrainingCourse>(
    `${this.baseUrl}/TrainingCourses/${courseId}/rating`, 
    rating  // ❌ Enviando apenas o body, sem query params
  );
}
```

### **Backend (Esperando)**

```csharp
// back/Pregiato.API/Controllers/TrainingCoursesController.cs (linha 325)
[HttpPost("{id}/rating")]
public async Task<ActionResult<TrainingCourseDto>> AddRating(
    Guid id,
    [FromBody] CreateTrainingRatingDto ratingDto,  // ✅ Body OK
    [FromQuery] string userEmail)  // ❌ Query param FALTANDO!
{
    if (string.IsNullOrEmpty(userEmail))
        return BadRequest("Email do usuário é obrigatório");  // 400 BAD REQUEST
    // ...
}
```

---

## 🔴 PROBLEMAS IDENTIFICADOS

### **1. Frontend não envia userEmail**
- ❌ Método `addCourseRating` não recebe email como parâmetro
- ❌ Não adiciona `?userEmail=xxx` na URL
- ❌ Frontend tem acesso ao `user.email` via Clerk mas não usa

### **2. Backend espera userEmail como query param**
- ✅ Validação correta: `if (string.IsNullOrEmpty(userEmail))`
- ❌ Mas não recebe o parâmetro, causando 400

### **3. Logs insuficientes**
- ❌ Usa `_logger.LogInformation` que não aparece no console
- ❌ Dificulta debug em tempo real
- ❌ Não mostra detalhes do payload recebido

---

## ✅ SOLUÇÃO

### **1. Adicionar userEmail no Frontend**

#### **Opção A: Enviar como query parameter (RECOMENDADO)**
```typescript
async addCourseRating(
  courseId: string, 
  rating: CreateTrainingRatingDto,
  userEmail: string  // ✅ Adicionar parâmetro
): Promise<TrainingCourse> {
  return await apiClient.post<TrainingCourse>(
    `${this.baseUrl}/TrainingCourses/${courseId}/rating?userEmail=${encodeURIComponent(userEmail)}`,
    rating
  );
}
```

#### **Opção B: Backend busca do token Clerk (ALTERNATIVA)**
```csharp
// Extrair email do token JWT do Clerk automaticamente
var userEmail = _clerkAuthService.GetCurrentUserEmail(User);
```

### **2. Substituir Logs por Console.WriteLine**

```csharp
// Antes
_logger.LogInformation($"Buscando usuário com email: {decodedEmail}");

// Depois
Console.WriteLine($"🔍 [RATING] Buscando usuário com email: {decodedEmail}");
Console.WriteLine($"📦 [RATING] Payload recebido: CourseId={id}, RatingType={ratingDto.RatingType}, Stars={ratingDto.Stars}");
```

---

## 📊 MAPEAMENTO COMPLETO DO FLUXO

### **Fluxo Correto (Após Correção)**

```
┌─────────────────┐
│   FRONTEND      │
│  curso/[id].tsx │
└────────┬────────┘
         │
         │ handleRating('like')
         │ user.email = "usuario@example.com"
         ▼
┌─────────────────────────────────────┐
│ trainingService.addCourseRating()   │
│ ✅ courseId: "374e..."               │
│ ✅ rating: { ratingType: "LIKE" }   │
│ ✅ userEmail: "usuario@example.com" │ ← ADICIONADO
└────────┬────────────────────────────┘
         │
         │ POST /api/TrainingCourses/{id}/rating?userEmail=usuario@example.com
         ▼
┌─────────────────────────────────────┐
│ TrainingCoursesController.cs        │
│ [HttpPost("{id}/rating")]           │
└────────┬────────────────────────────┘
         │
         │ 1. Valida ModelState
         │ 2. Valida userEmail ✅
         │ 3. Busca User no MySQL
         ▼
┌─────────────────────────────────────┐
│ TrainingCourseService.cs            │
│ AddRatingAsync()                    │
└────────┬────────────────────────────┘
         │
         │ 1. Busca curso
         │ 2. Verifica rating existente
         │ 3. Cria ou atualiza rating
         │ 4. Atualiza estatísticas
         ▼
┌─────────────────────────────────────┐
│ BANCO DE DADOS (MySQL)              │
│ TrainingRatings                     │
│ TrainingCourses (stats)             │
└─────────────────────────────────────┘
```

---

## 🎯 PONTOS DE VERIFICAÇÃO

### **Frontend**
- [ ] Adicionar parâmetro `userEmail` em `addCourseRating()`
- [ ] Passar `user.email` na chamada do método
- [ ] Verificar se `user.email` está disponível (Clerk)

### **Backend**
- [ ] Substituir `_logger.LogInformation` por `Console.WriteLine`
- [ ] Adicionar logs detalhados do payload recebido
- [ ] Log de sucesso/erro em cada etapa
- [ ] Validar se CourseId existe
- [ ] Validar se UserId existe

### **Testes**
- [ ] Testar com like
- [ ] Testar com dislike
- [ ] Testar avaliação duplicada (deve atualizar)
- [ ] Testar com usuário inexistente
- [ ] Testar com curso inexistente

---

## 📝 VALIDAÇÕES NECESSÁRIAS

### **CreateTrainingRatingDto**
```csharp
[Required]
public Guid CourseId { get; set; }  // ✅ OK

[Required]
[MaxLength(50)]
public string RatingType { get; set; }  // ✅ OK - "LIKE", "DISLIKE"

[Range(1, 5)]
public int Stars { get; set; }  // ✅ OK - 1 para dislike, 5 para like
```

### **Query Parameter**
```csharp
[FromQuery] string userEmail  // ❌ PROBLEMA - não está sendo enviado
```

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Identificar problema (COMPLETO)
2. ⏭️ Corrigir frontend (adicionar userEmail)
3. ⏭️ Substituir logs no backend
4. ⏭️ Testar fluxo completo
5. ⏭️ Validar estatísticas atualizadas

---

**Data:** 17 de Outubro de 2025  
**Status:** 🔴 Identificado - Aguardando Correção

