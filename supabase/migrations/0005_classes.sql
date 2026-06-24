-- =============================================================
-- Migration 0005 — Les classes
-- =============================================================
-- Une classe (ex. "6ème A") appartient à une école (ecole_id) ET à
-- une année scolaire (annee_scolaire_id). Une même classe peut donc
-- exister d'une année sur l'autre sans se mélanger.
-- Lecture : tous les membres de l'école. Écriture : l'admin de l'école.
-- =============================================================

create table public.classes (
  id                 uuid primary key default gen_random_uuid(),
  ecole_id           uuid not null references public.ecoles(id) on delete cascade,
  annee_scolaire_id  uuid not null references public.annees_scolaires(id) on delete cascade,
  nom                text not null,                  -- ex. "6ème A"
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Pas deux classes du même nom dans la même année d'une même école.
  unique (ecole_id, annee_scolaire_id, nom)
);

create index classes_ecole_id_idx on public.classes (ecole_id);
create index classes_annee_scolaire_id_idx on public.classes (annee_scolaire_id);

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.classes enable row level security;

-- Lecture : membres de la même école (ou super-admin).
create policy "classes_select"
  on public.classes
  for select
  to authenticated
  using (
    ecole_id = public.auth_ecole_id()
    or public.auth_role() = 'super_admin'
  );

-- Écriture : l'admin de la même école (ou super-admin).
create policy "classes_admin_write"
  on public.classes
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
