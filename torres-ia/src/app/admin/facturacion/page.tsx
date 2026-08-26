import { supabaseAdmin } from '@/lib/supabase';
import FacturacionClient from './facturacion-client';

export const dynamic = 'force-dynamic';

function monthRange(offset = 0) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { from: from.toISOString(), to: to.toISOString(), label: from.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) };
}

export default async function FacturacionPage({ searchParams }: { searchParams: { offset?: string } }) {
  const offset = Number(searchParams.offset ?? '0');
  const { from, to, label } = monthRange(offset);
  const admin = supabaseAdmin();

  const { data: colocadas } = await admin
    .from('pedidos')
    .select('id, paciente, doctor, colocada_at, clinica_id, precio_eur, clinicas(nombre, precio_placa_eur, iva_pct, holded_contact_id, email_contacto, cif)')
    .eq('estado', 'colocada')
    .gte('colocada_at', from)
    .lt('colocada_at', to)
    .order('colocada_at', { ascending: true });

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display text-2xl capitalize">Facturación · {label}</h1>
        <div className="flex gap-2 text-sm">
          <a className="btn-mini" href={`?offset=${offset - 1}`}>← Mes anterior</a>
          {offset < 0 && <a className="btn-mini" href={`?offset=${offset + 1}`}>Mes siguiente →</a>}
        </div>
      </div>
      <FacturacionClient pedidos={colocadas ?? []} />
    </div>
  );
}
