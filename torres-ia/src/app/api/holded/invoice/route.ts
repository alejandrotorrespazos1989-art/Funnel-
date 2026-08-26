import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { ensureContact, createInvoice } from '@/lib/holded';

export const runtime = 'nodejs';

const Body = z.object({
  clinica_id: z.string().uuid(),
  month_offset: z.number().int().min(-24).max(0).default(0),
});

export async function POST(req: Request) {
  await requireAdmin();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const admin = supabaseAdmin();
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + parsed.data.month_offset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + parsed.data.month_offset + 1, 1);

  const { data: clinica } = await admin
    .from('clinicas')
    .select('id, nombre, cif, email_contacto, precio_placa_eur, iva_pct, holded_contact_id')
    .eq('id', parsed.data.clinica_id)
    .single();
  if (!clinica) return NextResponse.json({ error: 'clinica_not_found' }, { status: 404 });

  const { data: pedidos } = await admin
    .from('pedidos')
    .select('id, paciente, doctor, colocada_at')
    .eq('clinica_id', clinica.id)
    .eq('estado', 'colocada')
    .gte('colocada_at', from.toISOString())
    .lt('colocada_at', to.toISOString());
  if (!pedidos || pedidos.length === 0) {
    return NextResponse.json({ error: 'no_pedidos' }, { status: 400 });
  }

  const contactId = clinica.holded_contact_id
    ?? await ensureContact({ name: clinica.nombre, email: clinica.email_contacto, cif: clinica.cif });

  if (!clinica.holded_contact_id) {
    await admin.from('clinicas').update({ holded_contact_id: contactId }).eq('id', clinica.id);
  }

  const inv = await createInvoice({
    contactId,
    concept: `Placas ${from.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
    lines: pedidos.map((p) => ({
      name: `Placa · ${p.paciente} · Dr. ${p.doctor}`,
      units: 1,
      price: Number(clinica.precio_placa_eur),
      tax: Number(clinica.iva_pct),
    })),
  });

  await admin.from('pedidos')
    .update({ estado: 'facturada', facturada_at: new Date().toISOString(), factura_holded_id: inv.id, precio_eur: Number(clinica.precio_placa_eur) })
    .in('id', pedidos.map((p) => p.id));

  return NextResponse.json({ ok: true, id: inv.id, docNumber: inv.docNumber, count: pedidos.length });
}
