-- =============================================================
-- Migration 0016 — L'emploi du temps (créneaux hebdomadaires)
-- =============================================================
-- Un créneau place UNE affectation (qui porte déjà la classe, la matière et le
-- professeur) sur un JOUR de la semaine, à une heure de début et de fin, dans
-- une salle (facultative). L'emploi du temps est donc « hebdomadaire type » :
-- il se répète chaque semaine.
--
-- En s'appuyant sur l'affectation, on garantit que seules des combinaisons
-- valides (prof/matière/classe déjà créées par l'admin) peuvent être placées.
--
-- Sécurité :
--   - Écriture : l'admin de l'école (ou super-admin).
--   - Lecture  : tous les membres de l'école (un emploi du temps n'est pas
--                confidentiel ; chaque page filtre ce qui concerne l'utilisateur).
-- =============================================================

create table public.creneaux (
  id               uuid primary key default gen_random_uuid(),
  ecole_id         uuid not null references public.ecoles(id) on delete cascade,
  affectation_id   uuid not null references public.affectations(id) on delete cascade,
  jour             smallint not null check (jour between 1 and 6),  -- 1 = lundi … 6 = samedi
  heure_debut      time not null,
  heure_fin        time not null,
  salle            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- L'heure de fin doit être après l'heure de début.
  check (heure_fin > heure_debut)
);

create index creneaux_ecole_id_idx on public.creneaux (ecole_id);
create index creneaux_affectation_id_idx on public.creneaux (affectation_id);

create trigger creneaux_set_updated_at
  before update on public.creneaux
  for each row execute function public.set_updated_at();

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.creneaux enable row level security;

-- Lecture : membres de la même école (ou super-admin).
create policy "creneaux_select"
  on public.creneaux
  for select
  to authenticated
  using (
    ecole_id = public.auth_ecole_id()
    or public.auth_role() = 'super_admin'
  );

-- Écriture : l'admin de la même école (ou super-admin).
create policy "creneaux_admin_write"
  on public.creneaux
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
