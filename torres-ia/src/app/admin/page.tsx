import { supabaseAdmin } from '@/lib/supabase';
import KanbanClient from './kanban-client';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const admin = supabaseAdmin();
  const { data: pedidos } = await admin
    .from('pedidos')
    .select('id, paciente, doctor, notas, fecha_entrega, estado, stl_path, stl_size_bytes, created_at, colocada_at, clinica_id, clinicas(nombre, precio_placa_eur)')
    .in('estado', ['recibido', 'en_impresion', 'colocada'])
    .order('created_at', { ascending: true });

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl">Placas en curso</h1>
          <p className="text-sm text-ink/60">Arrastra visualmente cambiando de columna con los botones.</p>
        </div>
      </div>
      <KanbanClient initial={pedidos ?? []} />
    </div>
  );
}
