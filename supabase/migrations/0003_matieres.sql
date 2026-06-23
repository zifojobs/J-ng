-- =============================================================
-- Migration 0003 — Les matières
-- =============================================================
-- Une matière appartient à une école (ecole_id).
-- Lecture : tous les membres de l'école. Écriture : l'admin de l'école.
-- =============================================================

create table public.matieres (
  id                 uuid primary key default gen_random_uuid(),
  ecole_id           uuid not null references public.ecoles(id) on delete cascade,
  nom                text not null,                 -- ex. "Mathématiques"
  code               text,                          -- ex. "MATH" (facultatif)
  coefficient_defaut numeric not null default 1,    -- coefficient proposé par défaut
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Pas deux matières du même nom dans une même école.
  unique (ecole_id, nom)
);

create index matieres_ecole_id_idx on public.matieres (ecole_id);

create trigger matieres_set_updated_at
  before update on public.matieres
  for each row execute function public.set_updated_at();

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.matieres enable row level security;

-- Lecture : membres de la même école (ou super-admin).
create policy "matieres_select"
  on public.matieres
  for select
  to authenticated
  using (
    ecole_id = public.auth_ecole_id()
    or public.auth_role() = 'super_admin'
  );

-- Écriture : l'admin de la même école (ou super-admin).
create policy "matieres_admin_write"
  on public.matieres
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
