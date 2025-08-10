import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FileData } from '@/types/talent'

interface TalentCarouselProps {
  photos: FileData[]
  selectedPhotos: string[]
  onPhotoSelect: (photoUrl: string, selected: boolean) => void
}

export function TalentCarousel({ photos, selectedPhotos, onPhotoSelect }: TalentCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === photos.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    )
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (!photos || photos.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Nenhuma foto disponível</p>
        </CardContent>
      </Card>
    )
  }

  const currentPhoto = photos[currentIndex]

  return (
    <div className="w-full space-y-4">
      {/* Main carousel */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-96">
            <img
              src={currentPhoto.url}
              alt={`Foto ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Photo counter */}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentIndex + 1} / {photos.length}
            </div>

            {/* Selection checkbox */}
            <div className="absolute top-4 left-4">
              <div className="flex items-center space-x-2 bg-white/90 px-3 py-2 rounded">
                <Checkbox
                  checked={selectedPhotos.includes(currentPhoto.url)}
                  onCheckedChange={(checked) => 
                    onPhotoSelect(currentPhoto.url, checked as boolean)
                  }
                />
                <span className="text-sm font-medium">Selecionar</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative flex-shrink-0"
            >
              <button
                onClick={() => goToSlide(index)}
                className={`relative w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-primary' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={photo.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedPhotos.includes(photo.url) && (
                  <div className="absolute top-1 right-1">
                    <Badge variant="default" className="text-xs px-1 py-0">
                      ✓
                    </Badge>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selection summary */}
      {selectedPhotos.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedPhotos.length} foto{selectedPhotos.length > 1 ? 's' : ''} selecionada{selectedPhotos.length > 1 ? 's' : ''} para o composite
          </span>
          <Badge variant="secondary">
            {selectedPhotos.length}/4
          </Badge>
        </div>
      )}
    </div>
  )
}