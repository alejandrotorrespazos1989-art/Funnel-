'use client';

import { useState, useTransition } from 'react';

type Pedido = {
  id: string;
  paciente: string;
  doctor: string;
  notas: string | null;
  fecha_entrega: string | null;
  estado: 'recibido' | 'en_impresion' | 'colocada';
  stl_path: string | null;
  stl_size_bytes: number | null;
  created_at: string;
  clinicas: { nombre: string; precio_placa_eur: number } | null;
};

const COLS: { key: Pedido['estado']; title: string; next?: Pedido['estado'] | 'back' }[] = [
  { key: 'recibido',     title: 'Recibido' },
  { key: 'en_impresion', title: 'En impresión' },
  { key: 'colocada',     title: 'Colocada' },
];

export default function KanbanClient({ initial }: { initial: Pedido[] }) {
  const [items, setItems] = useState<Pedido[]>(initial);
  const [busy, start] = useTransition();

  async function move(id: string, to: Pedido['estado'] | 'facturada' | 'cancelada') {
    start(async () => {
      const r = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ estado: to }),
      });
      if (r.ok) {
        setItems((prev) =>
          to === 'facturada' || to === 'cancelada'
            ? prev.filter((p) => p.id !== id)
            : prev.map((p) => (p.id === id ? { ...p, estado: to } : p)),
        );
      } else {
        alert('No se pudo cambiar el estado');
      }
    });
  }

  async function download(id: string) {
    const r = await fetch(`/api/orders/${id}/download`);
    if (!r.ok) return alert('No se pudo descargar');
    const { url } = await r.json();
    window.open(url, '_blank');
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLS.map((col) => (
        <div key={col.key} className="kanban-col rounded-2xl bg-white border border-ink/10 p-3">
          <div className="flex items-center justify-between px-1 pb-3">
            <h2 className="font-medium">{col.title}</h2>
            <span className="text-xs text-ink/50">{items.filter((p) => p.estado === col.key).length}</span>
          </div>

          <ul className="space-y-2">
            {items.filter((p) => p.estado === col.key).map((p) => (
              <li key={p.id} className="rounded-xl border border-ink/10 p-3 hover:border-gold transition">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-medium text-sm">{p.paciente}</div>
                  <div className="text-[11px] text-ink/50">{fmtDate(p.created_at)}</div>
                </div>
                <div className="mt-0.5 text-xs text-ink/70">
                  {p.clinicas?.nombre} · Dr. {p.doctor}
                </div>
                {p.fecha_entrega && (
                  <div className="mt-1 text-xs text-petrol">Entrega: {p.fecha_entrega}</div>
                )}
                {p.notas && <div className="mt-1 text-xs text-ink/60 line-clamp-2">{p.notas}</div>}

                <div className="mt-3 flex flex-wrap gap-2">
                  {p.stl_path && (
                    <button onClick={() => download(p.id)} className="btn-mini">STL</button>
                  )}
                  {col.key === 'recibido' && (
                    <button disabled={busy} onClick={() => move(p.id, 'en_impresion')} className="btn-mini btn-primary">Imprimir</button>
                  )}
                  {col.key === 'en_impresion' && (
                    <>
                      <button disabled={busy} onClick={() => move(p.id, 'recibido')} className="btn-mini">← Volver</button>
                      <button disabled={busy} onClick={() => move(p.id, 'colocada')} className="btn-mini btn-primary">Colocada</button>
                    </>
                  )}
                  {col.key === 'colocada' && (
                    <button disabled={busy} onClick={() => move(p.id, 'en_impresion')} className="btn-mini">← Volver</button>
                  )}
                  <button disabled={busy} onClick={() => move(p.id, 'cancelada')} className="btn-mini btn-danger">Cancelar</button>
                </div>
              </li>
            ))}
            {items.filter((p) => p.estado === col.key).length === 0 && (
              <li className="rounded-lg border border-dashed border-ink/15 p-6 text-center text-xs text-ink/40">Nada aquí</li>
            )}
          </ul>
        </div>
      ))}

      <style jsx global>{`
        .btn-mini { border: 1px solid rgba(15,20,23,0.15); border-radius: 0.5rem; padding: 0.25rem 0.6rem; font-size: 12px; background: white; }
        .btn-mini:hover { border-color: #c9a24a; }
        .btn-primary { background: #1f3a44; color: white; border-color: #1f3a44; }
        .btn-danger { color: #b91c1c; }
      `}</style>
    </div>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}
