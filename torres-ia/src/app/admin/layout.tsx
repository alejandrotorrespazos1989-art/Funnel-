import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-white">
        <div className="container-tight py-3 flex items-center gap-6">
          <Link href="/admin" className="font-display text-lg">TORRES&amp;IA</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="hover:text-gold">Kanban</Link>
            <Link href="/admin/clinicas" className="hover:text-gold">Clínicas</Link>
            <Link href="/admin/facturacion" className="hover:text-gold">Facturación</Link>
          </nav>
          <div className="ml-auto text-xs text-ink/60">{user.email}</div>
        </div>
      </header>
      <div className="container-tight py-8">{children}</div>
    </div>
  );
}
