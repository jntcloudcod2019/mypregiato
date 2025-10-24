import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import Gallery from '@/components/studio/Gallery';

const StudioPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Studio Pregiato
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Sua galeria de fotos profissionais
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Star className="h-4 w-4 mr-1" />
            MODEL
          </Badge>
        </div>
      </div>

      {/* Galeria de Fotos */}
      <Gallery />
    </div>
  );
};

export default StudioPage;
