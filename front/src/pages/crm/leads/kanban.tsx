import React, { useEffect, useState } from 'react';
import { talentsService, Talent } from '@/services/crm/talents-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const columns = [
  { key: 'novo', title: 'Novo' },
  { key: 'contato', title: 'Contato' },
  { key: 'agendamento', title: 'Agendamento' },
  { key: 'seletiva', title: 'Seletiva' },
  { key: 'contrato', title: 'Contrato' },
  { key: 'finalizado', title: 'Finalizado' },
  { key: 'perdido', title: 'Perdido' }
] as const;

type ColumnKey = typeof columns[number]['key'];

export default function LeadsKanban() {
  const [items, setItems] = useState<Talent[]>([]);

  useEffect(() => { (async()=>{ setItems(await talentsService.list()) })() }, []);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>, col: ColumnKey) => {
    const id = e.dataTransfer.getData('id');
    e.preventDefault();
    const t = items.find(x => x.id === id);
    if (!t) return;
    const next = { ...t, stage: col } as Talent;
    await talentsService.update(t.id, { stage: col });
    setItems(prev => prev.map(p => p.id === t.id ? next : p));
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => { e.dataTransfer.setData('id', id); };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-3">
      {columns.map(col => (
        <Card key={col.key} onDrop={(e)=>onDrop(e, col.key)} onDragOver={onDragOver} className="min-h-[60vh]">
          <CardHeader>
            <CardTitle className="text-sm">{col.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.filter(i => (i.stage || 'novo') === col.key).map(i => (
              <div key={i.id} draggable onDragStart={(e)=>onDragStart(e, i.id)} className="p-2 rounded-md border bg-card cursor-grab">
                <div className="font-medium text-sm truncate">{i.fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{i.phone || i.email}</div>
                <div className="text-[11px] text-muted-foreground">{i.city || ''}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


