import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';
import { tgSend } from '@/lib/telegram';

export const runtime = 'nodejs';

/**
 * Webhook de Telegram. Se protege con el secret que el propio bot añade
 * como header X-Telegram-Bot-Api-Secret-Token cuando se configura con setWebhook.
 */
export async function POST(req: Request) {
  const secret = env.telegramSecret();
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  if (!msg?.text || !msg.chat?.id) return NextResponse.json({ ok: true });

  const chatId: number = msg.chat.id;
  const adminChat = env.telegramAdminChat();
  const isAdmin = adminChat && String(chatId) === adminChat;

  const [cmd, ...args] = String(msg.text).trim().split(/\s+/);

  if (cmd === '/start') {
    await tgSend(chatId,
      `Hola. Soy el bot de *TORRES&IA*. Tu chat_id es \`${chatId}\`.\n` +
      (isAdmin
        ? 'Comandos:\n/pendientes · placas activas\n/mes · resumen del mes\n/facturar <slug> · factura mensual de una clínica'
        : 'Ponte en contacto con Alejandro para autorizar tu chat como admin.'));
    return NextResponse.json({ ok: true });
  }

  if (!isAdmin) {
    await tgSend(chatId, 'No autorizado.');
    return NextResponse.json({ ok: true });
  }

  const admin = supabaseAdmin();

  if (cmd === '/pendientes') {
    const { data } = await admin
      .from('pedidos')
      .select('paciente, doctor, estado, clinicas(nombre)')
      .in('estado', ['recibido', 'en_impresion'])
      .order('created_at', { ascending: true })
      .limit(50);
    const lines = (data ?? []).map((p: any) =>
      `· *${p.paciente}* — ${p.clinicas?.nombre} — Dr. ${p.doctor} — _${p.estado}_`,
    );
    await tgSend(chatId, lines.length ? lines.join('\n') : 'Sin pendientes.');
    return NextResponse.json({ ok: true });
  }

  if (cmd === '/mes') {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const { data } = await admin
      .from('pedidos')
      .select('estado, clinica_id, clinicas(nombre, precio_placa_eur)')
      .gte('created_at', from).lt('created_at', to);
    const total = data?.length ?? 0;
    const colocadas = data?.filter((p: any) => p.estado === 'colocada' || p.estado === 'facturada').length ?? 0;
    const ingreso = (data ?? [])
      .filter((p: any) => p.estado === 'colocada' || p.estado === 'facturada')
      .reduce((s: number, p: any) => s + Number(p.clinicas?.precio_placa_eur ?? 0), 0);
    await tgSend(chatId,
      `*Resumen del mes*\nPlacas recibidas: ${total}\nColocadas/facturadas: ${colocadas}\nIngreso bruto (sin IVA): *${ingreso.toFixed(2)} €*`);
    return NextResponse.json({ ok: true });
  }

  if (cmd === '/facturar') {
    const slug = args[0];
    if (!slug) { await tgSend(chatId, 'Uso: /facturar <slug-clinica>'); return NextResponse.json({ ok: true }); }
    const { data: cli } = await admin.from('clinicas').select('id, nombre').eq('slug', slug).maybeSingle();
    if (!cli) { await tgSend(chatId, `Clínica *${slug}* no encontrada.`); return NextResponse.json({ ok: true }); }
    const r = await fetch(`${env.appUrl()}/api/holded/invoice`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: '' },
      body: JSON.stringify({ clinica_id: cli.id }),
    });
    // Nota: este endpoint exige sesión admin. Para uso desde bot conviene un endpoint dedicado con clave.
    const j = await r.json().catch(() => ({}));
    if (!r.ok) await tgSend(chatId, `✗ ${j.error || r.statusText}`);
    else await tgSend(chatId, `✓ Factura ${j.docNumber || j.id} creada para ${cli.nombre} (${j.count} placas).`);
    return NextResponse.json({ ok: true });
  }

  await tgSend(chatId, 'Comando no reconocido. Usa /start.');
  return NextResponse.json({ ok: true });
}
