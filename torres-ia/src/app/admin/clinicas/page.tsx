import { supabaseAdmin } from '@/lib/supabase';
import { env } from '@/lib/env';
import ClinicasClient from './clinicas-client';

export const dynamic = 'force-dynamic';

export default async function ClinicasPage() {
  const admin = supabaseAdmin();
  const { data: clinicas } = await admin
    .from('clinicas')
    .select('id, slug, nombre, cif, email_contacto, precio_placa_eur, iva_pct, activa, upload_token, holded_contact_id, created_at')
    .order('created_at', { ascending: false });
  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Clínicas</h1>
      <ClinicasClient initial={clinicas ?? []} appUrl={env.appUrl()} />
    </div>
  );
}
