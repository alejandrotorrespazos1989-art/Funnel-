import { redirect } from 'next/navigation';
import { supabaseServer, supabaseAdmin } from './supabase';

export async function requireAdmin() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) redirect('/login');

  const admin = supabaseAdmin();
  const { data } = await admin.from('admins').select('email').eq('email', user.email).maybeSingle();
  if (!data) redirect('/login?err=not_admin');
  return user;
}
