create extension if not exists "pgcrypto";

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  incident_type text,
  location text,
  activation_level text not null default 'verde',
  status text not null default 'activo',
  commander_name text,
  objective text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.resource_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  resource_type text not null,
  institution text,
  home_location text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_resources (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  catalog_resource_id uuid references public.resource_catalog(id),
  custom_code text,
  custom_name text,
  resource_type text not null,
  status text not null default 'Asignado',
  quantity integer not null default 1 check (quantity > 0),
  responsible_name text,
  current_location text,
  assignment text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (catalog_resource_id is not null or custom_name is not null)
);

create table if not exists public.incident_log (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  event_time timestamptz not null default now(),
  category text,
  description text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.incidents enable row level security;
alter table public.resource_catalog enable row level security;
alter table public.incident_resources enable row level security;
alter table public.incident_log enable row level security;

create policy "authenticated read incidents"
on public.incidents for select to authenticated using (true);

create policy "authenticated manage incidents"
on public.incidents for all to authenticated using (true) with check (true);

create policy "authenticated read catalog"
on public.resource_catalog for select to authenticated using (true);

create policy "authenticated manage catalog"
on public.resource_catalog for all to authenticated using (true) with check (true);

create policy "authenticated manage incident resources"
on public.incident_resources for all to authenticated using (true) with check (true);

create policy "authenticated manage incident log"
on public.incident_log for all to authenticated using (true) with check (true);
