-- ============================================================
-- TORRES&IA · Iteración 1 (Impresión 3D)
-- Esquema inicial, RLS y bucket privado para STL.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Enum estados ----------
do $$ begin
  create type order_status as enum (
    'recibido', 'en_impresion', 'colocada', 'facturada', 'cancelada'
  );
exception when duplicate_object then null; end $$;

-- ---------- Clínicas ----------
create table if not exists clinicas (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,           -- se usa en /c/<slug>
  nombre          text not null,
  cif             text,
  email_contacto  text,
  telefono        text,
  direccion       text,
  holded_contact_id text,                         -- id del contacto en Holded
  precio_placa_eur numeric(10,2) not null default 45.00,
  iva_pct          numeric(5,2)  not null default 21.00,
  activa          boolean not null default true,
  upload_token    text unique not null default encode(gen_random_bytes(24), 'hex'),
  created_at      timestamptz not null default now()
);

create index if not exists clinicas_activa_idx on clinicas(activa);

-- ---------- Pedidos (una placa = una fila) ----------
create table if not exists pedidos (
  id              uuid primary key default gen_random_uuid(),
  clinica_id      uuid not null references clinicas(id) on delete restrict,
  paciente        text not null,
  doctor          text not null,
  notas           text,
  fecha_entrega   date,
  stl_path        text,                           -- ruta en bucket stl-files
  stl_size_bytes  bigint,
  estado          order_status not null default 'recibido',
  precio_eur      numeric(10,2),                  -- fijado al facturar
  factura_holded_id text,
  colocada_at     timestamptz,
  facturada_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists pedidos_clinica_idx on pedidos(clinica_id);
create index if not exists pedidos_estado_idx  on pedidos(estado);
create index if not exists pedidos_colocada_idx on pedidos(colocada_at);

-- trigger updated_at
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

drop trigger if exists trg_pedidos_updated on pedidos;
create trigger trg_pedidos_updated before update on pedidos
  for each row execute function set_updated_at();

-- ---------- Admins autorizados ----------
create table if not exists admins (
  email text primary key,
  telegram_chat_id text,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table clinicas enable row level security;
alter table pedidos  enable row level security;
alter table admins   enable row level security;

-- Solo admins autenticados leen/escriben todo (el service role las salta igualmente).
drop policy if exists admin_all_clinicas on clinicas;
create policy admin_all_clinicas on clinicas for all
  using (auth.jwt() ->> 'email' in (select email from admins))
  with check (auth.jwt() ->> 'email' in (select email from admins));

drop policy if exists admin_all_pedidos on pedidos;
create policy admin_all_pedidos on pedidos for all
  using (auth.jwt() ->> 'email' in (select email from admins))
  with check (auth.jwt() ->> 'email' in (select email from admins));

drop policy if exists admin_all_admins on admins;
create policy admin_all_admins on admins for all
  using (auth.jwt() ->> 'email' in (select email from admins))
  with check (auth.jwt() ->> 'email' in (select email from admins));

-- El portal público NO usa esta tabla directamente: escribe vía route handler con service role.

-- ---------- Storage: bucket privado ----------
insert into storage.buckets (id, name, public)
values ('stl-files', 'stl-files', false)
on conflict (id) do nothing;

-- Lectura solo con signed URL (default de bucket privado). Escritura vía service role desde el server.

-- ---------- Seed: admin ----------
insert into admins (email) values ('alejandro.torres.pazos.1989@gmail.com')
on conflict (email) do nothing;
