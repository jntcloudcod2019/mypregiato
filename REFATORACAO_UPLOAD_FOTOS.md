# 🖼️ REFATORAÇÃO - UPLOAD DE FOTOS DE TALENTOS

## 📋 RESUMO DA IMPLEMENTAÇÃO

### ✅ O QUE FOI FEITO:

1. **Backend - Controller criado** (`TalentPhotosController.cs`)
2. **Backend - DTOs atualizados** (`TalentDto` agora tem `Files`)
3. **Backend - Repository atualizado** (`TalentRepository` faz `.Include(t => t.Files)`)
4. **Frontend - Serviço criado** (`talent-photos-service.ts`)

---

## 🔄 FLUXO CORRETO

```
┌─────────────┐
│   FRONTEND  │
│   Usuário   │
│  seleciona  │
│    foto     │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────┐
│  compressImage(file)           │
│  Comprime a imagem             │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  talentPhotosService           │
│  .uploadPhoto(talentId, file)  │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  POST /api/Talents/{id}/photos │
│  Envia base64 para API         │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  TalentPhotosController        │
│  1. Valida talent existe       │
│  2. Converte base64 → bytes    │
│  3. Upload para MinIO          │
│  4. Salva em FileUpload        │
│     com TalentId               │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  FileUpload (Tabela)           │
│  Id: guid                      │
│  TalentId: guid ← REFERÊNCIA   │
│  FilePath: url_minio           │
│  Tags: "PHOTO"                 │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  FRONTEND recebe FileUploadDto │
│  Atualiza estado com novas     │
│  fotos via GET /photos         │
└────────────────────────────────┘
```

---

## 📝 CÓDIGO PARA SUBSTITUIR NO FRONTEND

### Arquivo: `front/src/pages/talentos/perfil/[id].tsx`

**SUBSTITUIR a função `handlePhotoUpload` por:**

```typescript
// Handle photo upload - USA API REAL
const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  console.log('📸 [Upload] Arquivos selecionados:', files?.length, 'Talent ID:', id);
  
  if (!files || files.length === 0 || !id) {
    console.warn('⚠️ [Upload] Sem arquivos ou ID inválido');
    return;
  }
  
  try {
    setUploadingPhoto(true);
    console.log('📤 [Upload] Iniciando upload de', files.length, 'arquivo(s)');
    
    for (const file of Array.from(files)) {
      console.log('📝 [Upload] Processando:', file.name, file.size, 'bytes');
      
      // Validate file
      validateImageFile(file);
      console.log('✅ [Upload] Arquivo validado');
      
      // Compress image
      const compressedFile = await compressImage(file);
      console.log('✅ [Upload] Imagem comprimida:', compressedFile.size, 'bytes');
      
      // ✅ NOVO: Upload usando API REAL
      const uploadedFile = await talentPhotosService.uploadPhoto(id, compressedFile);
      console.log('✅ [Upload] Foto enviada para API:', uploadedFile);
    }
    
    // ✅ NOVO: Buscar fotos atualizadas da API
    console.log('🔄 [Upload] Buscando fotos atualizadas da API...');
    const updatedTalent = await getTalentById(id);
    console.log('📊 [Upload] Talento atualizado:', updatedTalent);
    console.log('🖼️ [Upload] Fotos no perfil:', updatedTalent?.files?.length || 0);
    
    if (updatedTalent) {
      setTalent(updatedTalent);
    }
    
    toast({
      title: "Sucesso",
      description: `${files.length} foto(s) carregada(s) com sucesso`,
    });
    
  } catch (error: any) {
    console.error('❌ [Upload] Erro ao fazer upload:', error);
    toast({
      title: "Erro",
      description: error.message || "Erro ao fazer upload da foto",
      variant: "destructive"
    });
  } finally {
    setUploadingPhoto(false);
    event.target.value = '';
  }
};
```

**SUBSTITUIR a função `handlePhotoDelete` por:**

```typescript
// Handle photo deletion - USA API REAL
const handlePhotoDelete = async (photoId: string) => {
  if (!id) return;
  
  try {
    console.log('🗑️ [Delete] Deletando foto:', photoId);
    
    await talentPhotosService.deletePhoto(id, photoId);
    
    console.log('✅ [Delete] Foto deletada');
    
    // Atualizar lista de fotos
    const updatedTalent = await getTalentById(id);
    if (updatedTalent) {
      setTalent(updatedTalent);
    }
    
    toast({
      title: "Sucesso",
      description: "Foto removida com sucesso"
    });
  } catch (error: any) {
    console.error('❌ [Delete] Erro ao deletar foto:', error);
    toast({
      title: "Erro",
      description: "Erro ao remover foto",
      variant: "destructive"
    });
  }
};
```

---

## 🎯 ATUALIZAR O TIPO NO FRONTEND

### Arquivo: `front/src/types/talent.ts`

**ATUALIZAR a interface `FileData`:**

```typescript
export interface FileData {
  id: string;
  fileName: string;
  filePath: string;  // URL do MinIO
  contentType: string;
  fileSize: number;
  originalFileName?: string | null;
  description?: string | null;
  tags?: string | null;  // "PHOTO", "VIDEO", "DOCUMENT"
  talentId?: string | null;
  contractId?: string | null;
  uploadedAt: Date;
  uploadedBy?: string | null;
}
```

---

## ✅ RESULTADO ESPERADO

Após aplicar as mudanças:

1. ✅ Usuário faz upload de foto
2. ✅ Foto é comprimida no frontend
3. ✅ Foto é enviada como base64 para `/api/Talents/{id}/photos`
4. ✅ Backend salva em MinIO
5. ✅ Backend cria registro em `FileUpload` com `TalentId`
6. ✅ Frontend busca talent atualizado (com `.Include(t => t.Files)`)
7. ✅ Fotos aparecem na galeria
8. ✅ Foto de perfil funciona corretamente

---

## 🚀 PRÓXIMOS PASSOS

1. Aplicar as mudanças no `front/src/pages/talentos/perfil/[id].tsx`
2. Atualizar `front/src/types/talent.ts`
3. Testar o fluxo completo
4. Fazer deploy

---

**Status:** ✅ Backend pronto | ⚠️ Frontend precisa aplicar mudanças

