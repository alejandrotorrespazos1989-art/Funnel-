'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { err?: string };
}) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.err === 'not_admin' ? 'Ese email no está en la lista de admins.' : null,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/admin` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="container-tight py-24 max-w-md">
      <h1 className="font-display text-3xl">Entrar</h1>
      <p className="mt-2 text-ink/70 text-sm">
        Solo emails autorizados. Te enviamos un enlace mágico.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl bg-mint/20 p-4 text-sm">
          Enlace enviado a <b>{email}</b>. Revisa tu correo.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full rounded-xl border border-ink/15 px-4 py-3"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-petrol text-white py-3 font-medium hover:bg-ink transition"
          >
            Enviar enlace
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </main>
  );
}
