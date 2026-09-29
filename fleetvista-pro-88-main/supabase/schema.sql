-- FrotaViva — esquema do banco (Supabase / Postgres)
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run

create table if not exists public.vehicles (
  id            text primary key default gen_random_uuid()::text,
  nome          text not null,
  categoria     text not null check (categoria in ('Caminhão','Escavadeira','Munck','Caçamba')),
  ano_modelo    text not null default '',
  status        text not null default 'Ativo' check (status in ('Ativo','Manutenção','Inativo')),
  unidade       text not null default 'km' check (unidade in ('km','h')),
  medidor_atual numeric,
  revisao_km    numeric,
  revisao_data  date,
  created_at    timestamptz not null default now()
);

create table if not exists public.fuelings (
  id          text primary key default gen_random_uuid()::text,
  data        date not null,
  veiculo_id  text not null references public.vehicles(id) on delete cascade,
  inicial     numeric not null,
  final       numeric not null,
  litros      numeric not null,
  valor       numeric not null,
  combustivel text not null default 'Diesel' check (combustivel in ('Diesel','Gasolina','Arla')),
  created_at  timestamptz not null default now()
);

create table if not exists public.maintenances (
  id           text primary key default gen_random_uuid()::text,
  data         date not null,
  veiculo_id   text not null references public.vehicles(id) on delete cascade,
  tipo         text not null check (tipo in ('Preventiva','Corretiva','Revisão / Troca de óleo')),
  categoria    text not null check (categoria in ('Mecânica','Elétrica','Pneus','Hidráulica','Funilaria')),
  medidor      numeric not null,
  oficina      text not null default '',
  pecas        numeric not null default 0,
  mao_de_obra  numeric not null default 0,
  obs          text,
  created_at   timestamptz not null default now()
);

create index if not exists fuelings_veiculo_idx     on public.fuelings (veiculo_id, data desc);
create index if not exists maintenances_veiculo_idx on public.maintenances (veiculo_id, data desc);

-- Segurança: só usuários logados leem/gravam. Visitantes anônimos não têm acesso.
alter table public.vehicles     enable row level security;
alter table public.fuelings     enable row level security;
alter table public.maintenances enable row level security;

do $$
declare t text;
begin
  foreach t in array array['vehicles','fuelings','maintenances'] loop
    execute format('drop policy if exists "auth_all" on public.%I', t);
    execute format(
      'create policy "auth_all" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
