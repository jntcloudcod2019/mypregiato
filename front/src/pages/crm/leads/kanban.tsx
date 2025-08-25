import React, { useEffect, useState } from 'react';
import { talentsService, Talent } from '@/services/crm/talents-service';
import api from '@/services/whatsapp-api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { LeadCard } from '../../../components/crm/lead-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from '@/hooks/use-toast';

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
  const [items, setItems] = useState<Array<{ id: string; name: string; email?: string; phone?: string; stage: ColumnKey; city?: string }>>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<ColumnKey | null>(null);
  const [colStage, setColStage] = useState<Record<ColumnKey, ColumnKey>>({
    novo: 'novo',
    contato: 'contato',
    agendamento: 'agendamento',
    seletiva: 'seletiva',
    contrato: 'contrato',
    finalizado: 'finalizado',
    perdido: 'perdido'
  });

  useEffect(() => { (async()=>{
    try {
      const { data } = await api.get('/leads', { params: { page: 1, pageSize: 1000 } })
      const mapped = (Array.isArray(data) ? data : data?.items || []).map((l: {id: string; name?: string; email?: string; phone?: string; status?: string; company?: string})=>({
        id: l.id,
        name: l.name || 'Sem nome',
        email: l.email || '',
        phone: l.phone || '',
        stage: (l.status || 'novo').toLowerCase(),
        city: l.company || ''
      }))
      setItems(mapped)
    } catch {
      const t = await talentsService.list();
      setItems(t.map(x=>({ id: x.id, name: x.fullName, email: x.email, phone: x.phone, stage: (x.stage||'novo') as ColumnKey, city: x.city })))
    }
  })() }, []);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>, col: ColumnKey) => {
    const id = e.dataTransfer.getData('id');
    e.preventDefault();
    const t = items.find(x => x.id === id);
    if (!t) return;
    const target = colStage[col] || col;
    try {
      await api.put(`/leads/${t.id}`, { status: target });
      setItems(prev => prev.map(p => p.id === t.id ? { ...p, stage: target } : p));
      toast({ title: 'Card Atualizado', description: `${t.name} → ${target}` });
    } catch {
      // fallback: atualizar talent store
      await talentsService.update(t.id, { stage: target });
      setItems(prev => prev.map(p => p.id === t.id ? { ...p, stage: target } : p));
      toast({ title: 'Card Atualizado', description: `${t.name} → ${target}` });
    }
    setDraggingId(null);
    setHoverCol(null);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('id', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };
  const onDragEnd = () => { setDraggingId(null); setHoverCol(null); };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-3">
      {columns.map(col => {
        const stageShown = colStage[col.key] || col.key;
        return (
          <Card
            key={col.key}
            onDrop={(e)=>onDrop(e, col.key)}
            onDragOver={onDragOver}
            onDragEnter={()=> setHoverCol(col.key)}
            onDragLeave={()=> setHoverCol(null)}
            className={`min-h-[60vh] transition-colors ${hoverCol===col.key ? 'ring-4 ring-primary/60 bg-primary/5' : ''}`}
          >
            <CardHeader>
              <Select value={stageShown} onValueChange={(v)=> setColStage(prev => ({ ...prev, [col.key]: v as ColumnKey }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(opt => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.filter(i => (i.stage || 'novo') === stageShown).map(i => (
                <LeadCard
                  key={i.id}
                  name={i.name}
                  subtitle={i.phone || i.email}
                  badge={i.city || ''}
                  accentClassName={
                    i.stage === 'novo' ? 'bg-blue-500' :
                    i.stage === 'contato' ? 'bg-yellow-500' :
                    i.stage === 'agendamento' ? 'bg-orange-500' :
                    i.stage === 'seletiva' ? 'bg-indigo-500' :
                    i.stage === 'contrato' ? 'bg-green-500' :
                    i.stage === 'finalizado' ? 'bg-emerald-600' :
                    i.stage === 'perdido' ? 'bg-red-500' : 'bg-muted'
                  }
                  draggable
                  onDragStart={(e)=>onDragStart(e, i.id)}
                  // @ts-expect-error - we bubble drag end
                  onDragEnd={onDragEnd}
                />
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}


