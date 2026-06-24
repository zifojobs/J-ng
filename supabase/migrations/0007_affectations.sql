-- =============================================================
-- Migration 0007 — Les affectations (qui enseigne quoi, où)
-- =============================================================
-- Une affectation relie UN professeur, UNE matière et UNE classe :
-- ex. "M. Diop enseigne les Maths en 6ème A".
-- La classe porte déjà son année scolaire, donc l'année est implicite.
-- C'est la brique indispensable avant les NOTES : un prof ne pourra
-- saisir des notes que pour ses affectations.
-- Lecture : tous les membres de l'école. Écriture : l'admin de l'école.
-- =============================================================

create table public.affectations (
  id              uuid primary key default gen_random_uuid(),
  ecole_id        uuid not null references public.ecoles(id) on delete cascade,
  professeur_id   uuid not null references public.profils(id) on delete cascade,
  matiere_id      uuid not null references public.matieres(id) on delete cascade,
  classe_id       uuid not null references public.classes(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Pas deux fois la même affectation (même prof, même matière, même classe).
  unique (ecole_id, professeur_id, matiere_id, classe_id)
);

create index affectations_ecole_id_idx on public.affectations (ecole_id);
create index affectations_professeur_id_idx on public.affectations (professeur_id);
create index affectations_matiere_id_idx on public.affectations (matiere_id);
create index affectations_classe_id_idx on public.affectations (classe_id);

create trigger affectations_set_updated_at
  before update on public.affectations
  for each row execute function public.set_updated_at();

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.affectations enable row level security;

-- Lecture : membres de la même école (ou super-admin).
create policy "affectations_select"
  on public.affectations
  for select
  to authenticated
  using (
    ecole_id = public.auth_ecole_id()
    or public.auth_role() = 'super_admin'
  );

-- Écriture : l'admin de la même école (ou super-admin).
create policy "affectations_admin_write"
  on public.affectations
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
