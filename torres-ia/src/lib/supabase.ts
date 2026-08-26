import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from './env';

// Cliente de servidor ligado a la sesión del admin (usa cookies de Next).
export function supabaseServer() {
  const store = cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      get: (name: string) => store.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        try { store.set({ name, value, ...options }); } catch { /* Server Component */ }
      },
      remove: (name: string, options: CookieOptions) => {
        try { store.set({ name, value: '', ...options }); } catch { /* Server Component */ }
      },
    },
  });
}

// Cliente admin con service role. NUNCA exponer al navegador.
export function supabaseAdmin() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRole(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
