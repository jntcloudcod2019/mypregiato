import { modulesApi } from '@/services/modules-service';
import { talentsService, Talent } from './talents-service';

export type Event = {
  id: string;
  title: string;
  city?: string;
  place?: string;
  dateIso: string; // ISO
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EventInvite = {
  id: string;
  eventId: string;
  talentId: string;
  talentName: string;
  talentPhone?: string;
  protocol: string; // código curto
  token: string; // para link público
  linkUrl: string; // URL pública da ficha
  qrUrl: string; // URL para exibir QR (gerado via serviço HTTP)
  confirmed?: boolean; // confirmou presença
  checkedInAt?: string; // ISO
  formData?: any; // ficha digital
  createdAt?: string;
  updatedAt?: string;
};

const eventSlug = 'crm-event';
const inviteSlug = 'crm-invite';

function nowIso() { return new Date().toISOString(); }
function randomToken(len = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let t = ''; for (let i = 0; i < len; i++) t += chars[Math.floor(Math.random()*chars.length)];
  return t;
}
function shortProtocol() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export const eventsService = {
  async list(): Promise<Event[]> {
    const { items } = await modulesApi.list(eventSlug, 1, 500);
    return items.map(r => ({ id: r.id, ...(JSON.parse(r.payloadJson || '{}')) } as Event));
  },
  async get(id: string): Promise<Event | null> {
    const { items } = await modulesApi.list(eventSlug, 1, 500);
    const rec = items.find(i => i.id === id);
    return rec ? ({ id: rec.id, ...(JSON.parse(rec.payloadJson || '{}')) } as Event) : null;
  },
  async create(e: Omit<Event, 'id'|'createdAt'|'updatedAt'>): Promise<Event> {
    const payload = { ...e, createdAt: nowIso(), updatedAt: nowIso() };
    const rec = await modulesApi.create({ moduleSlug: eventSlug, title: e.title, status: 'ativo', tags: e.city, payloadJson: JSON.stringify(payload) });
    return { id: rec.id, ...(JSON.parse(rec.payloadJson||'{}')) } as Event;
  },
  async update(id: string, e: Partial<Event>): Promise<Event> {
    const current = await eventsService.get(id);
    const next = { ...(current||{}), ...e, id, updatedAt: nowIso() } as Event;
    await modulesApi.update(id, { moduleSlug: eventSlug, title: next.title, status: 'ativo', tags: next.city, payloadJson: JSON.stringify(next) });
    return next;
  },

  async listInvites(eventId: string): Promise<EventInvite[]> {
    const { items } = await modulesApi.list(inviteSlug, 1, 2000);
    return items
      .map(r => ({ id: r.id, ...(JSON.parse(r.payloadJson || '{}')) } as EventInvite))
      .filter(i => i.eventId === eventId);
  },
  async getInviteByToken(token: string): Promise<EventInvite | null> {
    const { items } = await modulesApi.list(inviteSlug, 1, 2000);
    const rec = items.find(r => {
      try { return JSON.parse(r.payloadJson||'{}').token === token; } catch { return false; }
    });
    return rec ? ({ id: rec.id, ...(JSON.parse(rec.payloadJson || '{}')) } as EventInvite) : null;
  },
  async getInviteByProtocol(protocol: string): Promise<EventInvite | null> {
    const { items } = await modulesApi.list(inviteSlug, 1, 2000);
    const rec = items.find(r => {
      try { return String(JSON.parse(r.payloadJson||'{}').protocol).toUpperCase() === protocol.toUpperCase(); } catch { return false; }
    });
    return rec ? ({ id: rec.id, ...(JSON.parse(rec.payloadJson || '{}')) } as EventInvite) : null;
  },
  async invite(eventId: string, talentId: string): Promise<EventInvite> {
    const event = await eventsService.get(eventId);
    const t = await talentsService.get(talentId) as Talent;
    if (!event || !t) throw new Error('Evento ou talento inválido');
    const token = randomToken(28);
    const protocol = shortProtocol();
    const linkUrl = `${window.location.origin}/ficha/${token}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(linkUrl)}&size=220x220`;
    const payload: Omit<EventInvite, 'id'> = {
      eventId, talentId, talentName: t.fullName, talentPhone: t.phone,
      protocol, token, linkUrl, qrUrl, confirmed: false,
      createdAt: nowIso(), updatedAt: nowIso()
    };
    const rec = await modulesApi.create({ moduleSlug: inviteSlug, title: `${event.title} - ${t.fullName}`, status: 'pendente', tags: event.city, payloadJson: JSON.stringify(payload) });
    return { id: rec.id, ...(JSON.parse(rec.payloadJson||'{}')) } as EventInvite;
  },
  async confirmByToken(token: string): Promise<void> {
    const inv = await eventsService.getInviteByToken(token); if (!inv) throw new Error('Convite inválido');
    inv.confirmed = true; inv.updatedAt = nowIso();
    await modulesApi.update(inv.id, { moduleSlug: inviteSlug, title: `${inv.talentName}`, status: inv.confirmed ? 'confirmado' : 'pendente', tags: inv.protocol, payloadJson: JSON.stringify(inv) });
  },
  async submitForm(token: string, formData: any): Promise<void> {
    const inv = await eventsService.getInviteByToken(token); if (!inv) throw new Error('Convite inválido');
    inv.formData = formData; inv.updatedAt = nowIso();
    await modulesApi.update(inv.id, { moduleSlug: inviteSlug, title: `${inv.talentName}`, status: inv.confirmed ? 'confirmado' : 'pendente', tags: inv.protocol, payloadJson: JSON.stringify(inv) });
  },
  async checkin(inviteId: string): Promise<void> {
    const { items } = await modulesApi.list(inviteSlug, 1, 2000);
    const rec = items.find(r => r.id === inviteId); if (!rec) throw new Error('Convite não encontrado');
    const inv = { id: rec.id, ...(JSON.parse(rec.payloadJson||'{}')) } as EventInvite;
    inv.checkedInAt = nowIso(); inv.updatedAt = nowIso();
    await modulesApi.update(inv.id, { moduleSlug: inviteSlug, title: `${inv.talentName}`, status: 'checkin', tags: inv.protocol, payloadJson: JSON.stringify(inv) });
  }
};


