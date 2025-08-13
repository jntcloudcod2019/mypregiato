import React, { useEffect, useMemo, useState } from 'react';
import { modulesApi, ModuleRecord } from '@/services/modules-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit } from 'lucide-react';

type Props = {
  moduleSlug: string;
  title?: string;
  defaultTag?: string;
};

export const RecordsTable: React.FC<Props> = ({ moduleSlug, title, defaultTag }) => {
  const [items, setItems] = useState<ModuleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleRecord | null>(null);
  const [form, setForm] = useState<Partial<ModuleRecord>>({ moduleSlug, title: '', status: '', tags: defaultTag || '', payloadJson: '{}' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(i =>
      (!defaultTag || (i.tags || '').toLowerCase().includes(defaultTag.toLowerCase())) &&
      (i.title || '').toLowerCase().includes(q)
    );
  }, [items, search, defaultTag]);

  const refresh = async () => {
    setLoading(true);
    try {
      const { items } = await modulesApi.list(moduleSlug, 1, 100);
      setItems(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [moduleSlug]);

  const onCreate = () => {
    setEditing(null);
    setForm({ moduleSlug, title: '', status: '', tags: defaultTag || '', payloadJson: '{}' });
    setOpen(true);
  };

  const onEdit = (rec: ModuleRecord) => {
    setEditing(rec);
    setForm({ ...rec });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    await modulesApi.delete(id);
    await refresh();
  };

  const onSubmit = async () => {
    const payload: Partial<ModuleRecord> = {
      moduleSlug,
      title: form.title || '',
      status: form.status || '',
      tags: form.tags || defaultTag || '',
      payloadJson: form.payloadJson || '{}'
    };
    if (editing) await modulesApi.update(editing.id, payload);
    else await modulesApi.create(payload);
    setOpen(false);
    await refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title || 'Registros'}</CardTitle>
        <div className="flex gap-2">
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por título..." className="h-8 w-48" />
          <Button size="sm" onClick={onCreate}><Plus className="h-4 w-4 mr-1" />Novo</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(i => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.title}</TableCell>
                <TableCell>{i.status}</TableCell>
                <TableCell>{(i.tags || '').split(',').filter(Boolean).map(t => (<Badge key={t} className="mr-1">{t.trim()}</Badge>))}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={()=>onEdit(i)} title="Editar"><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={()=>onDelete(i.id)} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Nenhum registro</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="Título" value={form.title || ''} onChange={e=>setForm(f=>({ ...f, title: e.target.value }))} />
            <Input placeholder="Status" value={form.status || ''} onChange={e=>setForm(f=>({ ...f, status: e.target.value }))} />
            <Input placeholder="Tags (csv)" value={form.tags || ''} onChange={e=>setForm(f=>({ ...f, tags: e.target.value }))} />
            <Textarea placeholder="Payload JSON" rows={8} value={form.payloadJson || ''} onChange={e=>setForm(f=>({ ...f, payloadJson: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={()=>setOpen(false)} variant="outline">Cancelar</Button>
            <Button onClick={onSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RecordsTable;


