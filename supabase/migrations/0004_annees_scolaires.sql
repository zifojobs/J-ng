-- =============================================================
-- Migration 0004 — Les années scolaires
-- =============================================================
-- Une année scolaire appartient à une école (ecole_id).
-- Ex. "2025-2026". Une seule année peut être "active" par école.
-- Lecture : tous les membres de l'école. Écriture : l'admin de l'école.
-- =============================================================

create table public.annees_scolaires (
  id          uuid primary key default gen_random_uuid(),
  ecole_id    uuid not null references public.ecoles(id) on delete cascade,
  libelle     text not null,                       -- ex. "2025-2026"
  active      boolean not null default false,      -- l'année en cours
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Pas deux années du même libellé dans une même école.
  unique (ecole_id, libelle)
);

create index annees_scolaires_ecole_id_idx on public.annees_scolaires (ecole_id);

-- Au plus UNE année active par école.
create unique index annees_scolaires_une_active_par_ecole
  on public.annees_scolaires (ecole_id)
  where active;

create trigger annees_scolaires_set_updated_at
  before update on public.annees_scolaires
  for each row execute function public.set_updated_at();

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.annees_scolaires enable row level security;

-- Lecture : membres de la même école (ou super-admin).
create policy "annees_scolaires_select"
  on public.annees_scolaires
  for select
  to authenticated
  using (
    ecole_id = public.auth_ecole_id()
    or public.auth_role() = 'super_admin'
  );

-- Écriture : l'admin de la même école (ou super-admin).
create policy "annees_scolaires_admin_write"
  on public.annees_scolaires
  for all
  to authenticated
  using (
    public.auth_role() = 'super_admin'
    or (public.auth_role() = 'admin_ecole' and ecole_id = public.auth_ecole_id())
  )
  with check (
    public.auth_role() = 'super_admin'
    or (public.auth_role() = 'admin_ecole' and ecole_id = public.auth_ecole_id())
  );
