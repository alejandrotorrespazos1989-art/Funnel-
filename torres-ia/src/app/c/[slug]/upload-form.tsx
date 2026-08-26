'use client';

import { useState } from 'react';

type Props = { clinicaId: string; slug: string; token: string };

export default function UploadForm({ slug, token }: Props) {
  const [paciente, setPaciente] = useState('');
  const [doctor, setDoctor] = useState('');
  const [fecha, setFecha] = useState('');
  const [notas, setNotas] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState<string>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setMsg('Selecciona un archivo STL.'); return; }
    if (!file.name.toLowerCase().endsWith('.stl')) { setMsg('El archivo debe ser .stl'); return; }
    setStatus('uploading'); setMsg('Preparando subida…');

    try {
      // 1) Pedir signed URL
      const init = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, token, filename: file.name, size: file.size }),
      });
      if (!init.ok) throw new Error(await init.text());
      const { path, signedUrl } = await init.json();

      // 2) PUT del archivo directo a Supabase Storage
      setMsg('Subiendo STL…');
      const put = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'content-type': 'application/octet-stream' },
        body: file,
      });
      if (!put.ok) throw new Error(`Fallo al subir el archivo (${put.status})`);

      // 3) Crear el pedido
      setMsg('Guardando pedido…');
      const fin = await fetch('/api/upload/finalize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug, token, path, size: file.size,
          paciente, doctor, notas, fecha_entrega: fecha || null,
        }),
      });
      if (!fin.ok) throw new Error(await fin.text());
      setStatus('done'); setMsg('¡Recibido! Te avisaremos cuando esté colocada.');
    } catch (err: any) {
      setStatus('error');
      setMsg(err?.message || 'Error inesperado');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-xl bg-mint/25 p-6 text-sm">
        <div className="font-medium">Placa registrada correctamente.</div>
        <div className="mt-1 text-ink/70">{msg}</div>
        <button
          className="mt-4 rounded-lg bg-petrol text-white px-4 py-2 text-sm"
          onClick={() => { setStatus('idle'); setPaciente(''); setDoctor(''); setNotas(''); setFecha(''); setFile(null); setMsg(''); }}
        >
          Enviar otra
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Paciente" required>
          <input required value={paciente} onChange={(e) => setPaciente(e.target.value)}
                 className="input" placeholder="Nombre y apellidos" />
        </Field>
        <Field label="Doctor/a" required>
          <input required value={doctor} onChange={(e) => setDoctor(e.target.value)}
                 className="input" placeholder="Dr./Dra." />
        </Field>
      </div>
      <Field label="Fecha de entrega deseada">
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
      </Field>
      <Field label="Notas (opcional)">
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
                  className="input min-h-[100px]" placeholder="Grosor, indicaciones…" />
      </Field>
      <Field label="Archivo STL" required>
        <input type="file" accept=".stl" required onChange={(e) => setFile(e.target.files?.[0] ?? null)}
               className="block w-full text-sm" />
        {file && <div className="mt-1 text-xs text-ink/60">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</div>}
      </Field>

      <button
        type="submit"
        disabled={status === 'uploading'}
        className="w-full rounded-xl bg-petrol text-white py-3 font-medium hover:bg-ink transition disabled:opacity-60"
      >
        {status === 'uploading' ? 'Enviando…' : 'Enviar placa'}
      </button>
      {msg && <p className={status === 'error' ? 'text-sm text-red-600' : 'text-sm text-ink/60'}>{msg}</p>}

      <style jsx global>{`
        .input {
          width: 100%; border-radius: 0.75rem; border: 1px solid rgba(15,20,23,0.15);
          padding: 0.75rem 1rem; background: white;
        }
        .input:focus { outline: 2px solid #c9a24a; outline-offset: 1px; }
      `}</style>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-ink/70">{label}{required && ' *'}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
