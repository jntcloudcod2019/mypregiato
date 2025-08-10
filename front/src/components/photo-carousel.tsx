import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUpdateEffect } from 'primereact/hooks'

interface PhotoCarouselProps {
  photos: string[]
  selectedPhotos?: string[]
  onPhotoSelect?: (photo: string, selected: boolean) => void
  showSelection?: boolean
  className?: string
}

export function PhotoCarousel({
  photos,
  selectedPhotos = [],
  onPhotoSelect,
  showSelection = false,
  className = ''
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useUpdateEffect(() => {
    if (currentIndex >= photos.length && photos.length > 0) {
      setCurrentIndex(0)
    }
  }, [photos])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === photos.length - 1 ? 0 : prevIndex + 1
    )
  }

  const handlePhotoSelect = (photo: string, checked: boolean) => {
    onPhotoSelect?.(photo, checked)
  }

  if (photos.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          Nenhuma foto disponível
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main carousel */}
      <Card>
        <CardContent className="relative p-0">
          <div className="relative h-64 md:h-96 overflow-hidden rounded-lg">
            <img
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Photo selection */}
            {showSelection && onPhotoSelect && (
              <div className="absolute top-2 right-2">
                <div className="flex items-center space-x-2 bg-white/80 p-2 rounded">
                  <Checkbox
                    checked={selectedPhotos.includes(photos[currentIndex])}
                    onCheckedChange={(checked) => 
                      handlePhotoSelect(photos[currentIndex], !!checked)
                    }
                  />
                  <span className="text-sm">Selecionar</span>
                </div>
              </div>
            )}

            {/* Photo counter */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentIndex + 1} de {photos.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail navigation */}
      {photos.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                index === currentIndex 
                  ? 'border-primary' 
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <img
                src={photo}
                alt={`Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Selection summary */}
      {showSelection && selectedPhotos.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedPhotos.length} foto{selectedPhotos.length !== 1 ? 's' : ''} selecionada{selectedPhotos.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}