import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const Body = z.object({
  slug: z.string().min(1),
  token: z.string().min(10),
  filename: z.string().min(1),
  size: z.number().int().positive().max(200 * 1024 * 1024), // 200 MB duro
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const { slug, token, filename, size } = parsed.data;

  const admin = supabaseAdmin();
  const { data: clinica } = await admin
    .from('clinicas')
    .select('id, upload_token, activa')
    .eq('slug', slug)
    .maybeSingle();
  if (!clinica || !clinica.activa || clinica.upload_token !== token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const safe = filename.replace(/[^\w.\-]+/g, '_');
  const path = `${slug}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}_${safe}`;

  const { data, error } = await admin.storage
    .from('stl-files')
    .createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path, signedUrl: data.signedUrl, size });
}
