import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { eventsService, Event, EventInvite } from '@/services/crm/events-service';
import { talentsService, Talent } from '@/services/crm/talents-service';

export default function EventosPage() {
  const [items, setItems] = useState<Event[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [place, setPlace] = useState('');
  const [dateIso, setDateIso] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event|null>(null);
  const [invites, setInvites] = useState<EventInvite[]>([]);
  const [talentId, setTalentId] = useState('');

  useEffect(() => { (async()=>{ setItems(await eventsService.list()); setTalents(await talentsService.list()); })() }, []);
  const create = async () => {
    const e = await eventsService.create({ title, city, place, dateIso, description: '' });
    setItems(await eventsService.list()); setTitle(''); setCity(''); setPlace(''); setDateIso('');
  };
  const open = async (e: Event) => { setSelectedEvent(e); setInvites(await eventsService.listInvites(e.id)); };
  const invite = async () => { if(!selectedEvent||!talentId) return; await eventsService.invite(selectedEvent.id, talentId); setInvites(await eventsService.listInvites(selectedEvent.id)); setTalentId(''); };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Evento/Seletiva</CardTitle>
          <CardDescription>Cadastre um evento e convide leads</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><Label>Título</Label><Input value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div><Label>Cidade</Label><Input value={city} onChange={e=>setCity(e.target.value)} /></div>
          <div><Label>Local</Label><Input value={place} onChange={e=>setPlace(e.target.value)} /></div>
          <div><Label>Data/Hora</Label><Input type="datetime-local" value={dateIso} onChange={e=>setDateIso(e.target.value)} /></div>
          <div className="md:col-span-4"><Button onClick={create}>Criar Evento</Button></div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Eventos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map(e=> (
              <div key={e.id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{e.city} • {new Date(e.dateIso).toLocaleString('pt-BR')}</div>
                </div>
                <Button size="sm" onClick={()=>open(e)}>Abrir</Button>
              </div>
            ))}
            {items.length===0 && <div className="text-sm text-muted-foreground">Nenhum evento</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Convites {selectedEvent && `— ${selectedEvent.title}`}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!selectedEvent && <div className="text-sm text-muted-foreground">Selecione um evento</div>}
            {selectedEvent && (
              <>
                <div className="flex gap-2">
                  <select className="border rounded px-2 py-1 flex-1" value={talentId} onChange={e=>setTalentId(e.target.value)}>
                    <option value="">Selecione um lead</option>
                    {talents.map(t => (<option key={t.id} value={t.id}>{t.fullName} — {t.phone}</option>))}
                  </select>
                  <Button size="sm" onClick={invite}>Convidar</Button>
                </div>
                <div className="space-y-2">
                  {invites.map(inv => (
                    <div key={inv.id} className="p-2 border rounded">
                      <div className="font-medium text-sm">{inv.talentName} • Protocolo {inv.protocol}</div>
                      <div className="text-xs text-muted-foreground break-all">{inv.linkUrl}</div>
                      <div className="mt-2"><img src={inv.qrUrl} alt="QR" className="h-28 w-28" /></div>
                    </div>
                  ))}
                  {invites.length===0 && <div className="text-sm text-muted-foreground">Sem convites</div>}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


