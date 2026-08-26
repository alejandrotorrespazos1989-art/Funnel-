import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { notifyAdminTelegram } from '@/lib/telegram';

export const runtime = 'nodejs';

const Body = z.object({
  slug: z.string(),
  token: z.string().min(10),
  path: z.string().min(1),
  size: z.number().int().positive(),
  paciente: z.string().min(1).max(120),
  doctor: z.string().min(1).max(120),
  notas: z.string().max(2000).optional().nullable(),
  fecha_entrega: z.string().nullable().optional(), // yyyy-mm-dd
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const b = parsed.data;

  const admin = supabaseAdmin();
  const { data: clinica } = await admin
    .from('clinicas')
    .select('id, nombre, upload_token, activa')
    .eq('slug', b.slug)
    .maybeSingle();
  if (!clinica || !clinica.activa || clinica.upload_token !== b.token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: pedido, error } = await admin
    .from('pedidos')
    .insert({
      clinica_id: clinica.id,
      paciente: b.paciente,
      doctor: b.doctor,
      notas: b.notas ?? null,
      fecha_entrega: b.fecha_entrega ?? null,
      stl_path: b.path,
      stl_size_bytes: b.size,
      estado: 'recibido',
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notificación best-effort a Telegram admin
  notifyAdminTelegram(
    `🦷 *Nueva placa*\nClínica: ${clinica.nombre}\nPaciente: ${b.paciente}\nDoctor: ${b.doctor}` +
    (b.fecha_entrega ? `\nEntrega: ${b.fecha_entrega}` : ''),
  ).catch(() => {});

  return NextResponse.json({ ok: true, id: pedido.id });
}
