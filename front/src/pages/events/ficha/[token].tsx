import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { eventsService } from '@/services/crm/events-service';

export default function FichaDigitalPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|undefined>();
  const [form, setForm] = useState<any>({});
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    (async()=>{
      try {
        if (!token) { setError('Token inválido'); setLoading(false); return; }
        const inv = await eventsService.getInviteByToken(token);
        if (!inv) { setError('Convite não encontrado'); } else {
          setInvite(inv);
          setForm(inv.formData || { fullName: inv.talentName, phone: inv.talentPhone });
        }
      } catch { setError('Erro ao carregar ficha'); } finally { setLoading(false); }
    })();
  }, [token]);

  const submit = async () => {
    if (!token) return;
    await eventsService.submitForm(token, form);
    await eventsService.confirmByToken(token);
    alert('Ficha enviada. Obrigado!');
    navigate('/');
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Ficha Digital - {invite?.talentName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nome Completo</Label>
            <Input value={form.fullName||''} onChange={e=>setForm((f:any)=>({ ...f, fullName: e.target.value }))} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.phone||''} onChange={e=>setForm((f:any)=>({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.city||''} onChange={e=>setForm((f:any)=>({ ...f, city: e.target.value }))} />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={form.instagram||''} onChange={e=>setForm((f:any)=>({ ...f, instagram: e.target.value }))} />
          </div>
          <div className="pt-2">
            <Button className="w-full" onClick={submit}>Enviar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


