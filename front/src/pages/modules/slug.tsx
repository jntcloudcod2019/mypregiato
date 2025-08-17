import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { modules } from './data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RecordsTable from '@/components/modules/records-table';

export default function ModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const [module, setModule] = useState(modules.find(m => m.slug === slug));
  
  useEffect(() => {
    const foundModule = modules.find(m => m.slug === slug);
    setModule(foundModule);
  }, [slug]);
  
  if (!module) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Módulo não encontrado</CardTitle>
            <CardDescription>O módulo solicitado não foi encontrado</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Verifique o URL ou retorne para a página inicial.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{module.title}</h1>
        <p className="text-muted-foreground mt-1">{module.description}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recursos disponíveis</CardTitle>
          <CardDescription>Funcionalidades deste módulo</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-6 space-y-1">
            {module.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <RecordsTable moduleSlug={module.slug} title={`Registros de ${module.title}`} />
    </div>
  );
}
