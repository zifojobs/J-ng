-- =============================================================
-- Migration 0018 — Les absences (l'appel)
-- =============================================================
-- Le professeur fait l'appel pour UN de ses cours (une affectation, qui porte
-- déjà le prof, la matière et la classe), à une DATE donnée. On n'enregistre
-- QUE les élèves absents ou en retard : un élève sans ligne ce jour-là est
-- considéré présent. Refaire l'appel le même jour remplace les lignes du jour.
--
-- Champs :
--   - date_absence : le jour de l'appel.
--   - statut       : « absent » ou « retard ».
--   - justifie     : passé à vrai quand un parent justifie l'absence.
--   - motif        : le motif écrit par le parent (facultatif).
--
-- Sécurité :
--   - Écriture (appel) : le professeur de l'affectation (ou l'admin de l'école).
--   - Justification    : le parent d'un enfant concerné (il met à jour justifie/motif).
--   - Lecture          : l'élève concerné, ses parents, le prof de l'affectation,
--                        l'admin de l'école. Personne ne voit les absences d'une
--                        autre école ni d'un autre élève.
-- =============================================================

create table public.absences (
  id               uuid primary key default gen_random_uuid(),
  ecole_id         uuid not null references public.ecoles(id) on delete cascade,
  affectation_id   uuid not null references public.affectations(id) on delete cascade,
  eleve_id         uuid not null references public.profils(id) on delete cascade,
  date_absence     date not null,
  statut           text not null check (statut in ('absent', 'retard')),
  justifie         boolean not null default false,
  motif            text check (char_length(motif) <= 500),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (affectation_id, eleve_id, date_absence)
);

create index absences_ecole_id_idx on public.absences (ecole_id);
create index absences_eleve_id_idx on public.absences (eleve_id);
create index absences_affectation_id_idx on public.absences (affectation_id);

create trigger absences_set_updated_at
  before update on public.absences
  for each row execute function public.set_updated_at();

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.absences enable row level security;

-- Lecture : super-admin partout ; sinon dans son école : l'admin voit tout,
-- le prof voit celles de SES affectations, l'élève voit les SIENNES.
create policy "absences_select"
  on public.absences
  for select
  to authenticated
  using (
    public.auth_role() = 'super_admin'
    or (
      ecole_id = public.auth_ecole_id()
      and (
        public.auth_role() = 'admin_ecole'
        or eleve_id = auth.uid()
        or exists (
          select 1 from public.affectations a
          where a.id = affectation_id
            and a.professeur_id = auth.uid()
        )
      )
    )
  );

-- Lecture du parent : il voit les absences de SES enfants.
create policy "absences_select_parent"
  on public.absences
  for select
  to authenticated
  using (
    public.auth_role() = 'parent'
    and exists (
      select 1 from public.parents_eleves pe
      where pe.parent_id = auth.uid()
        and pe.eleve_id = absences.eleve_id
    )
  );

-- Écriture (faire/refaire l'appel) : super-admin ; sinon dans son école :
-- l'admin, ou le prof de l'affectation concernée.
create policy "absences_write"
  on public.absences
  for all
  to authenticated
  using (
    public.auth_role() = 'super_admin'
    or (
      ecole_id = public.auth_ecole_id()
      and (
        public.auth_role() = 'admin_ecole'
        or exists (
          select 1 from public.affectations a
          where a.id = affectation_id
            and a.professeur_id = auth.uid()
            and a.ecole_id = public.auth_ecole_id()
        )
      )
    )
  )
  with check (
    public.auth_role() = 'super_admin'
    or (
      ecole_id = public.auth_ecole_id()
      and (
        public.auth_role() = 'admin_ecole'
        or exists (
          select 1 from public.affectations a
          where a.id = affectation_id
            and a.professeur_id = auth.uid()
            and a.ecole_id = public.auth_ecole_id()
        )
      )
    )
  );

-- Justification : le parent d'un enfant concerné peut mettre à jour la ligne
-- (en pratique : justifie + motif). Il ne peut ni créer ni supprimer une absence.
create policy "absences_justify_parent"
  on public.absences
  for update
  to authenticated
  using (
    public.auth_role() = 'parent'
    and exists (
      select 1 from public.parents_eleves pe
      where pe.parent_id = auth.uid()
        and pe.eleve_id = absences.eleve_id
    )
  )
  with check (
    public.auth_role() = 'parent'
    and exists (
      select 1 from public.parents_eleves pe
      where pe.parent_id = auth.uid()
        and pe.eleve_id = absences.eleve_id
    )
  );
