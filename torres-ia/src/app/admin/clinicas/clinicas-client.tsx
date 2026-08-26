'use client';

import { useState, useTransition } from 'react';

type Clinica = {
  id: string;
  slug: string;
  nombre: string;
  cif: string | null;
  email_contacto: string | null;
  precio_placa_eur: number;
  iva_pct: number;
  activa: boolean;
  upload_token: string;
  holded_contact_id: string | null;
};

export default function ClinicasClient({ initial, appUrl }: { initial: Clinica[]; appUrl: string }) {
  const [items, setItems] = useState<Clinica[]>(initial);
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [precio, setPrecio] = useState(45);
  const [busy, start] = useTransition();

  async function crear() {
    if (!nombre.trim() || !slug.trim()) return alert('Nombre y slug requeridos');
    start(async () => {
      const r = await fetch('/api/clinicas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nombre, slug, email_contacto: email || null, precio_placa_eur: precio }),
      });
      if (!r.ok) return alert(await r.text());
      const nueva = await r.json();
      setItems([nueva, ...items]);
      setNombre(''); setSlug(''); setEmail(''); setPrecio(45);
    });
  }

  async function toggle(c: Clinica) {
    start(async () => {
      const r = await fetch(`/api/clinicas/${c.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ activa: !c.activa }),
      });
      if (r.ok) setItems(items.map((x) => (x.id === c.id ? { ...x, activa: !x.activa } : x)));
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-2xl bg-white border border-ink/10 p-4 md:col-span-1">
        <h2 className="font-medium mb-3">Nueva clínica</h2>
        <label className="block text-xs text-ink/60">Nombre</label>
        <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <label className="block text-xs text-ink/60 mt-2">Slug (URL)</label>
        <input className="input" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^\w-]+/g, '-'))} placeholder="clinica-ejemplo" />
        <label className="block text-xs text-ink/60 mt-2">Email contacto</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block text-xs text-ink/60 mt-2">Precio por placa (€)</label>
        <input className="input" type="number" step="0.01" value={precio} onChange={(e) => setPrecio(Number(e.target.value))} />
        <button onClick={crear} disabled={busy} className="mt-4 w-full rounded-xl bg-petrol text-white py-2.5 font-medium">
          Crear
        </button>
      </div>

      <div className="md:col-span-2 space-y-3">
        {items.map((c) => {
          const link = `${appUrl}/c/${c.slug}?t=${c.upload_token}`;
          return (
            <div key={c.id} className="rounded-2xl bg-white border border-ink/10 p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-medium">{c.nombre}</div>
                  <div className="text-xs text-ink/60">{c.slug} · {c.precio_placa_eur} € · IVA {c.iva_pct}%</div>
                </div>
                <button onClick={() => toggle(c)} className="text-xs underline">
                  {c.activa ? 'Desactivar' : 'Activar'}
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input readOnly value={link} className="input text-xs" />
                <button
                  className="btn-mini"
                  onClick={() => { navigator.clipboard.writeText(link); }}
                >Copiar</button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="text-sm text-ink/50">Aún no hay clínicas.</div>}
      </div>

      <style jsx global>{`
        .input { width: 100%; border: 1px solid rgba(15,20,23,0.15); border-radius: 0.6rem; padding: 0.55rem 0.7rem; background: white; font-size: 14px; }
        .btn-mini { border: 1px solid rgba(15,20,23,0.15); border-radius: 0.5rem; padding: 0.4rem 0.7rem; font-size: 12px; background: white; }
      `}</style>
    </div>
  );
}
