import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { modules } from './data';

export default function ModulePage() {
  const { slug } = useParams();
  const mod = modules.find(m => m.slug === slug);

  if (!mod) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Módulo não encontrado</h1>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{mod.title}</h1>
        <p className="text-muted-foreground">{mod.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades</CardTitle>
          <CardDescription>Principais capacidades deste módulo</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-6 space-y-2 text-sm">
            {mod.features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


