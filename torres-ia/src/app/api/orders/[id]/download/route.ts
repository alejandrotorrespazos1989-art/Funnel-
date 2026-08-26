import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  const admin = supabaseAdmin();
  const { data: pedido } = await admin
    .from('pedidos').select('stl_path').eq('id', params.id).maybeSingle();
  if (!pedido?.stl_path) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data, error } = await admin.storage.from('stl-files').createSignedUrl(pedido.stl_path, 60 * 10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
