import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import UploadForm from './upload-form';

export const dynamic = 'force-dynamic';

export default async function ClinicaPortal({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { t?: string };
}) {
  const admin = supabaseAdmin();
  const { data: clinica } = await admin
    .from('clinicas')
    .select('id, slug, nombre, activa, upload_token')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!clinica || !clinica.activa) notFound();

  const tokenOk = !!searchParams.t && searchParams.t === clinica.upload_token;

  return (
    <main className="container-tight py-16 max-w-2xl">
      <p className="text-xs uppercase tracking-widest text-petrol/70">TORRES&amp;IA · Impresión 3D</p>
      <h1 className="mt-2 font-display text-3xl">Portal · {clinica.nombre}</h1>

      {!tokenOk ? (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Enlace de acceso no válido. Contacta con Alejandro Torres para que te envíe tu link con token.
        </div>
      ) : (
        <>
          <p className="mt-3 text-ink/70 text-sm">
            Sube el archivo <b>STL</b> de la placa junto con los datos del paciente.
            Recibirás confirmación por email cuando la placa esté <b>colocada</b>.
          </p>
          <div className="mt-8">
            <UploadForm clinicaId={clinica.id} slug={clinica.slug} token={clinica.upload_token} />
          </div>
        </>
      )}

      <footer className="mt-16 text-xs text-ink/40">
        © Alejandro Torres · Servicio profesional de impresión 3D dental
      </footer>
    </main>
  );
}
