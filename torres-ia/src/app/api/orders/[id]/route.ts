import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const Body = z.object({
  estado: z.enum(['recibido', 'en_impresion', 'colocada', 'facturada', 'cancelada']),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const patch: Record<string, unknown> = { estado: parsed.data.estado };
  if (parsed.data.estado === 'colocada') patch.colocada_at = new Date().toISOString();
  if (parsed.data.estado === 'facturada') patch.facturada_at = new Date().toISOString();

  const admin = supabaseAdmin();
  const { error } = await admin.from('pedidos').update(patch).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
