create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

create policy "lectura_publica_app_state"
on public.app_state for select
using (true);

create policy "escritura_publica_app_state"
on public.app_state for insert
with check (true);

create policy "actualizacion_publica_app_state"
on public.app_state for update
using (true)
with check (true);

insert into public.app_state (id, payload)
values ('principal', '{}'::jsonb)
on conflict (id) do nothing;
