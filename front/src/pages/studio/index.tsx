import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, ImageIcon, Video, Settings, Star, Users, Calendar, TrendingUp } from 'lucide-react';
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
              Sua central de recursos para ensaios fotográficos
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Star className="h-4 w-4 mr-1" />
            MODEL
          </Badge>
        </div>
      </div>

      {/* Cards de recursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Galeria */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              Galeria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Visualize e gerencie todas as suas fotos profissionais
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Fotos carregadas</span>
              <Badge variant="outline">Ativo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Ensaios */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-600" />
              Ensaios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Agende e gerencie seus ensaios fotográficos
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Em breve</span>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Portfólio */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              Portfólio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Crie e compartilhe seu portfólio profissional
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Em breve</span>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Agendamentos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Gerencie sua agenda de ensaios e compromissos
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Em breve</span>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Acompanhe seu desempenho e engajamento
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Em breve</span>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Personalize sua experiência no Studio
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Em breve</span>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Galeria de Fotos */}
      <Gallery />
    </div>
  );
};

export default StudioPage;
