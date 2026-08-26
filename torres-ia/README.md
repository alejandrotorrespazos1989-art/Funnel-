# TORRES&IA · Panel personal

Iteración 1 — **Módulo Impresión 3D** para gestión de placas de descarga:
las clínicas suben STL desde un portal público con enlace único, tú las
gestionas en un Kanban, y a fin de mes se genera la factura en Holded
agrupada por clínica.

Módulos siguientes en la hoja de ruta:
1. ✅ Impresión 3D (esta iteración)
2. Finanzas personales/familiares (import CSV BBVA)
3. Inversiones (personal + hijos)
4. Instagram / marca personal

---

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Supabase** (Auth, Postgres, Storage privado para STL)
- **Vercel** para desplegar el frontend + APIs
- **Telegram Bot** vía webhook (`/api/telegram/webhook`)
- **Holded API** para facturación

---

## Estructura

```
torres-ia/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Home privado
│   │   ├── login/page.tsx           # Magic link
│   │   ├── c/[slug]/                # Portal público clínica
│   │   ├── admin/                   # Kanban, clínicas, facturación
│   │   └── api/
│   │       ├── upload/init          # Signed URL para subir STL
│   │       ├── upload/finalize      # Crea pedido tras subida
│   │       ├── orders/[id]          # PATCH estado + descarga
│   │       ├── clinicas             # CRUD clínicas
│   │       ├── holded/invoice       # Genera factura Holded
│   │       └── telegram/webhook     # Bot Telegram
│   └── lib/                         # supabase, auth, holded, telegram, env
└── supabase/migrations/0001_init.sql
```

---

## Puesta en marcha (paso a paso)

### 0. Instalar dependencias

```bash
cd torres-ia
npm install
```

### 1. Crear proyecto Supabase

1. Ve a <https://supabase.com> → **New project**.
2. En el dashboard, **SQL Editor** → pega el contenido de
   `supabase/migrations/0001_init.sql` y ejecuta.
3. **Storage** → verifica que existe el bucket `stl-files` en modo *private*
   (la migración lo crea).
4. **Project Settings → API** → copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secreto) → `SUPABASE_SERVICE_ROLE_KEY`
5. **Authentication → Providers → Email** → activa *Magic Link*.
6. **Authentication → URL Configuration** → añade tu dominio de producción
   a *Redirect URLs* (`https://tudominio.com/**`).

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena.

```bash
cp .env.example .env.local
```

### 3. Correr en local

```bash
npm run dev
# http://localhost:3000
```

- Entra en `/login` con tu email (`alejandro.torres.pazos.1989@gmail.com`).
- Recibirás un enlace mágico → llegas a `/admin`.

### 4. Dar de alta una clínica

En `/admin/clinicas`, crea la clínica con:
- Nombre, slug (será la URL), email de contacto y precio por placa.
- Se genera automáticamente un **link único** de la forma:

  ```
  https://tudominio.com/c/<slug>?t=<token>
  ```

  Cópialo y compártelo con la clínica (por WhatsApp, email…). Solo entra
  quien tenga ese link.

### 5. Deploy en Vercel

```bash
npx vercel
# o conecta el repo en https://vercel.com/new
```

- En **Project Settings → Environment Variables** replica lo del
  `.env.local` (incluida la `SUPABASE_SERVICE_ROLE_KEY`, marcada como secret).
- Al desplegar, apunta un dominio propio si lo tienes.

### 6. Bot de Telegram

1. Habla con [@BotFather](https://t.me/BotFather) → `/newbot` → guarda el
   token → `TELEGRAM_BOT_TOKEN`.
2. Elige un secreto random y ponlo en `TELEGRAM_WEBHOOK_SECRET`
   (cualquier string largo).
3. Regístra el webhook (una sola vez):

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://tudominio.com/api/telegram/webhook" \
     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```

4. Escríbele `/start` al bot y anota el `chat_id` que te devuelve → ponlo
   como `TELEGRAM_ADMIN_CHAT_ID`. Redespliega para que tome el valor.
5. Comandos:
   - `/pendientes` — placas en cola o imprimiendo.
   - `/mes` — resumen del mes.
   - `/facturar <slug-clinica>` — genera factura Holded.

Cada vez que una clínica suba un STL, recibirás un mensaje en tu chat.

### 7. Holded

1. En Holded → **Configuración → Desarrolladores → API Key** → crea una →
   `HOLDED_API_KEY`.
2. Ya está. La primera vez que factures a una clínica, el sistema busca su
   contacto en Holded y, si no existe, lo crea. Guarda el
   `holded_contact_id` para siguientes facturas.

---

## Flujo operativo típico

```
Clínica       → sube STL en /c/<slug>?t=<token>
Torres        → notificación Telegram
Panel admin   → mueve la placa: Recibido → En impresión → Colocada
Fin de mes    → /admin/facturacion → botón "Crear factura en Holded" por clínica
                (o desde Telegram: /facturar <slug>)
Holded        → genera la factura y (opcional) la envía al email de la clínica
```

---

## Roadmap

- **v0.2 Finanzas** — importer CSV BBVA + categorización + gráficos mes a mes.
- **v0.3 Inversiones** — cartera con lotes, precios en vivo, sub-carteras
  para hijos.
- **v0.4 Instagram** — calendario editorial + publicación vía Graph API.
- **Agente Telegram unificado** — un único bot que enruta comandos a los
  cuatro módulos (integrable con Claude/OpenAI para NLU).

---

## Notas de seguridad

- Los enlaces de clínica llevan un token de 24 bytes (48 hex chars). Si se
  filtra uno, en `/admin/clinicas` puedes desactivar la clínica y regenerar
  su token (regenerar aún no está expuesto en UI — se hace desde el SQL
  Editor: `update clinicas set upload_token = encode(gen_random_bytes(24), 'hex') where slug = 'xxx';`).
- El bucket `stl-files` es privado. La descarga admin usa signed URL con
  caducidad de 10 minutos.
- El webhook de Telegram valida el `secret_token`.
- El `SUPABASE_SERVICE_ROLE_KEY` solo se usa en route handlers de servidor.
  Nunca se expone al navegador.
