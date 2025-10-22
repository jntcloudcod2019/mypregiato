import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Eye, Download, Share2, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { talentService, TalentPhotoDto } from '@/services/talent-service';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';

interface GalleryProps {
  className?: string;
}

interface PhotoViewerProps {
  photos: TalentPhotoDto[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ photos, currentIndex, isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  const currentPhoto = photos[currentIndex];

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    onNavigate(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Botão fechar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navegação anterior */}
      {photos.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 text-white hover:bg-white/20"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Imagem principal */}
      <div className="relative max-w-4xl max-h-[90vh] mx-16">
        <img
          src={currentPhoto.filePath}
          alt={`Foto ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        
        {/* Informações da foto */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{currentPhoto.fileName}</p>
              <p className="text-sm text-gray-300">
                {Math.round(currentPhoto.fileSize / 1024)} KB
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="secondary">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação próxima */}
      {photos.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 text-white hover:bg-white/20"
          onClick={handleNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Indicador de posição */}
      {photos.length > 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => onNavigate(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Gallery: React.FC<GalleryProps> = ({ className }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<TalentPhotoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    const loadGallery = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setError('Email do usuário não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🎭 [GALLERY] Carregando galeria para:', user.primaryEmailAddress.emailAddress);
        
        const { photos: talentPhotos } = await talentService.getTalentWithPhotos(
          user.primaryEmailAddress.emailAddress
        );
        
        setPhotos(talentPhotos);
        console.log(`✅ [GALLERY] ${talentPhotos.length} fotos carregadas`);
      } catch (error) {
        console.error('❌ [GALLERY] Erro ao carregar galeria:', error);
        setError('Erro ao carregar galeria de fotos');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar suas fotos. Verifique se você tem um perfil de talento cadastrado.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, [user, toast]);

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  const handleNavigate = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Galeria de Fotos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando suas fotos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Galeria de Fotos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Galeria de Fotos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma foto encontrada</p>
            <p className="text-sm text-muted-foreground">
              Faça upload de suas fotos no perfil para vê-las aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Galeria de Fotos
            </div>
            <Badge variant="secondary">
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Grid de fotos - máximo 4 colunas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square"
                onClick={() => handlePhotoClick(index)}
              >
                <img
                  src={photo.filePath}
                  alt={photo.fileName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                
                {/* Overlay com informações */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                    <Eye className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Ver Foto</p>
                  </div>
                </div>

                {/* Indicador de posição */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visualizador de fotos */}
      <PhotoViewer
        photos={photos}
        currentIndex={selectedPhotoIndex}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
        onNavigate={handleNavigate}
      />
    </>
  );
};

export default Gallery;
