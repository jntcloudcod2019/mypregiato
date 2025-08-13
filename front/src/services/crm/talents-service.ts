import { modulesApi } from '@/services/modules-service';

export type TalentStatus = 'novo' | 'avaliacao' | 'aprovado' | 'rejeitado';

export type Talent = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  uf?: string;
  instagram?: string;
  city?: string;
  age?: number;
  profession?: string;
  notes?: string;
  status: TalentStatus;
  stage?: 'novo' | 'contato' | 'agendamento' | 'seletiva' | 'contrato' | 'finalizado' | 'perdido';
  sources?: string[]; // meta, site, formulario, redes
  score?: number; // 0-100
  interactionsCount?: number;
  purchasesCount?: number;
  measures?: {
    height?: string; bust?: string; waist?: string; hips?: string; shoes?: string;
  };
  photos?: string[]; // dataUrls
  portfolio?: string[]; // links
  history?: Array<{ ts: string; type: 'note' | 'email' | 'meeting' | 'message'; text: string }>;
  createdAt?: string;
  updatedAt?: string;
};

const slug = 'crm-talent';

export const talentsService = {
  async list(): Promise<Talent[]> {
    const { items } = await modulesApi.list(slug, 1, 1000);
    return items.map(r => {
      const t = { id: r.id, ...(JSON.parse(r.payloadJson || '{}')) } as Talent;
      if (typeof t.score !== 'number') t.score = computeScore(t);
      return t;
    });
  },
  async get(id: string): Promise<Talent | null> {
    const { items } = await modulesApi.list(slug, 1, 1000);
    const rec = items.find(i => i.id === id);
    if (!rec) return null;
    const t = { id: rec.id, ...(JSON.parse(rec.payloadJson || '{}')) } as Talent;
    if (typeof t.score !== 'number') t.score = computeScore(t);
    return t;
  },
  async create(t: Omit<Talent, 'id'|'createdAt'|'updatedAt'>): Promise<Talent> {
    const payload = { ...t, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const rec = await modulesApi.create({ moduleSlug: slug, title: t.fullName, status: t.status, tags: t.city, payloadJson: JSON.stringify(payload) });
    return { id: rec.id, ...(JSON.parse(rec.payloadJson)) } as Talent;
  },
  async update(id: string, t: Partial<Talent>): Promise<Talent> {
    const current = await talentsService.get(id);
    const next = { ...(current||{}), ...t, id, updatedAt: new Date().toISOString() } as Talent;
    await modulesApi.update(id, { moduleSlug: slug, title: next.fullName, status: next.status, tags: next.city, payloadJson: JSON.stringify(next) });
    return next;
  },
  async remove(id: string): Promise<void> {
    await modulesApi.delete(id);
  },
  async bulkImport(rows: Array<Record<string, any>>): Promise<number> {
    let imported = 0;
    for (const r of rows) {
      const t: Omit<Talent, 'id'|'createdAt'|'updatedAt'> = {
        fullName: r.nome || r.name || r.fullName || 'Sem nome',
        email: r.email || r.mail,
        phone: r.telefone || r.phone,
        city: r.cidade || r.city,
        uf: r.uf || r.estado,
        age: r.idade ? Number(r.idade) : undefined,
        profession: r.profissao || r.profession,
        notes: r.observacoes || r.notes,
        status: (r.status as TalentStatus) || 'novo',
        stage: r.etapa || 'novo',
        sources: r.origem ? String(r.origem).split(',').map((s:string)=>s.trim()) : undefined,
        score: undefined
      };
      await talentsService.create(t);
      imported++;
    }
    return imported;
  }
};

function computeScore(t: Talent): number {
  let s = 0;
  if (t.email) s += 10;
  if (t.phone) s += 20;
  if ((t.sources||[]).includes('meta')) s += 20;
  if ((t.sources||[]).includes('site') || (t.sources||[]).includes('formulario')) s += 10;
  if (t.interactionsCount) s += Math.min(30, t.interactionsCount * 5);
  if (t.purchasesCount) s += Math.min(20, t.purchasesCount * 10);
  return Math.max(0, Math.min(100, s));
}


