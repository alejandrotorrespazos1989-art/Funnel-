/**
 * Cliente mínimo de Holded. Docs: https://developers.holded.com
 * Nota: La API de Holded permite crear facturas y (opcionalmente) enviarlas por email.
 */
import { env } from './env';

const BASE = 'https://api.holded.com/api/invoicing/v1';

async function h<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'key': env.holdedKey(),
      'content-type': 'application/json',
      accept: 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Holded ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type HoldedLine = {
  name: string;
  units: number;
  price: number;   // sin IVA
  tax: number;     // % IVA
  sku?: string;
};

/** Crea contacto si no existe y devuelve su id. */
export async function ensureContact(input: {
  name: string; email?: string | null; cif?: string | null;
}): Promise<string> {
  const list = await h<any[]>(`/contacts?name=${encodeURIComponent(input.name)}`);
  if (Array.isArray(list) && list.length && list[0].id) return list[0].id;
  const created = await h<{ id: string }>(`/contacts`, {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email ?? undefined,
      code: input.cif ?? undefined,
      type: 'client',
    }),
  });
  return created.id;
}

/** Crea una factura para un contacto con las líneas dadas. */
export async function createInvoice(input: {
  contactId: string;
  concept?: string;
  lines: HoldedLine[];
  date?: number; // epoch seconds
  send?: boolean;
}): Promise<{ id: string; docNumber?: string }> {
  const body: any = {
    contactId: input.contactId,
    desc: input.concept,
    date: input.date ?? Math.floor(Date.now() / 1000),
    notes: 'Facturación mensual placas impresión 3D',
    items: input.lines.map((l) => ({
      name: l.name,
      units: l.units,
      subtotal: l.price,
      tax: l.tax,
      sku: l.sku,
    })),
  };
  const inv = await h<{ id: string; docNumber?: string }>(`/documents/invoice`, {
    method: 'POST', body: JSON.stringify(body),
  });
  if (input.send) {
    await h(`/documents/invoice/${inv.id}/send`, { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
  }
  return inv;
}
