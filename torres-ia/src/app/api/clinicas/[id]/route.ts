import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const Body = z.object({
  activa: z.boolean().optional(),
  precio_placa_eur: z.number().positive().max(10000).optional(),
  iva_pct: z.number().min(0).max(100).optional(),
  cif: z.string().max(20).optional(),
  email_contacto: z.string().email().nullable().optional(),
  holded_contact_id: z.string().max(80).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const admin = supabaseAdmin();
  const { error } = await admin.from('clinicas').update(parsed.data).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
