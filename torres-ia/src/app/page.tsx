import Link from 'next/link';

export default function Home() {
  return (
    <main className="container-tight py-16">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-widest text-petrol/70">TORRES&amp;IA</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl text-ink">
          Panel personal · v0.1
        </h1>
        <p className="mt-3 text-ink/70 max-w-2xl">
          Iteración 1: gestión de impresión 3D para clínicas dentales. Portal para
          que las clínicas suban STL, panel Kanban y facturación mensual con Holded.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin"
          className="rounded-2xl border border-ink/10 bg-white p-6 hover:border-gold transition"
        >
          <div className="text-xs uppercase text-petrol/60">Interno</div>
          <div className="mt-1 text-xl font-semibold">Panel admin</div>
          <div className="mt-2 text-sm text-ink/70">
            Kanban de placas, clínicas, facturación mensual.
          </div>
        </Link>

        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <div className="text-xs uppercase text-petrol/60">Público</div>
          <div className="mt-1 text-xl font-semibold">Portal clínica</div>
          <div className="mt-2 text-sm text-ink/70">
            Cada clínica recibe un link único{' '}
            <code className="rounded bg-ink/5 px-1 py-0.5">/c/&lt;slug&gt;</code>{' '}
            para subir STL sin registro.
          </div>
        </div>
      </section>

      <footer className="mt-16 text-xs text-ink/40">
        Alejandro Torres · Las Palmas de Gran Canaria
      </footer>
    </main>
  );
}
