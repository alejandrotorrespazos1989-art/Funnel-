'use client';

import { useMemo, useState, useTransition } from 'react';

type P = {
  id: string;
  paciente: string;
  doctor: string;
  colocada_at: string | null;
  clinica_id: string;
  precio_eur: number | null;
  clinicas: {
    nombre: string;
    precio_placa_eur: number;
    iva_pct: number;
    holded_contact_id: string | null;
    email_contacto: string | null;
    cif: string | null;
  } | null;
};

export default function FacturacionClient({ pedidos }: { pedidos: P[] }) {
  const [busy, start] = useTransition();
  const [log, setLog] = useState<string[]>([]);

  const grupos = useMemo(() => {
    const map = new Map<string, { clinica: P['clinicas']; clinica_id: string; pedidos: P[] }>();
    for (const p of pedidos) {
      const key = p.clinica_id;
      if (!map.has(key)) map.set(key, { clinica: p.clinicas, clinica_id: key, pedidos: [] });
      map.get(key)!.pedidos.push(p);
    }
    return Array.from(map.values());
  }, [pedidos]);

  async function facturar(clinicaId: string) {
    start(async () => {
      setLog((l) => [...l, `→ Facturando clínica ${clinicaId}…`]);
      const r = await fetch('/api/holded/invoice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clinica_id: clinicaId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setLog((l) => [...l, `  ✗ ${j.error || r.statusText}`]);
      else setLog((l) => [...l, `  ✓ Factura ${j.docNumber || j.id} creada`]);
    });
  }

  if (grupos.length === 0) return <div className="text-sm text-ink/60">No hay placas colocadas este mes.</div>;

  return (
    <div className="space-y-4">
      {grupos.map((g) => {
        const precio = g.clinica?.precio_placa_eur ?? 0;
        const iva = g.clinica?.iva_pct ?? 21;
        const base = g.pedidos.length * precio;
        const total = base * (1 + iva / 100);
        return (
          <div key={g.clinica_id} className="rounded-2xl bg-white border border-ink/10 p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-medium">{g.clinica?.nombre}</div>
                <div className="text-xs text-ink/60">
                  {g.pedidos.length} placas · {precio} €/placa · IVA {iva}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">Base: {base.toFixed(2)} €</div>
                <div className="font-semibold">Total: {total.toFixed(2)} €</div>
              </div>
            </div>
            <details className="mt-3">
              <summary className="text-xs text-ink/60 cursor-pointer">Ver pacientes</summary>
              <ul className="mt-2 text-xs text-ink/70 space-y-0.5">
                {g.pedidos.map((p) => (
                  <li key={p.id}>· {p.paciente} — Dr. {p.doctor} — {p.colocada_at?.slice(0, 10)}</li>
                ))}
              </ul>
            </details>
            <div className="mt-4">
              <button onClick={() => facturar(g.clinica_id)} disabled={busy} className="btn-mini btn-primary">
                Crear factura en Holded
              </button>
            </div>
          </div>
        );
      })}

      {log.length > 0 && (
        <pre className="mt-6 rounded-lg bg-ink/5 p-3 text-xs overflow-x-auto">
{log.join('\n')}
        </pre>
      )}

      <style jsx global>{`
        .btn-mini { border: 1px solid rgba(15,20,23,0.15); border-radius: 0.5rem; padding: 0.5rem 0.9rem; font-size: 13px; background: white; }
        .btn-primary { background: #1f3a44; color: white; border-color: #1f3a44; }
      `}</style>
    </div>
  );
}
