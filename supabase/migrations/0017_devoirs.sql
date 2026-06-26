-- =============================================================
-- Migration 0017 — Les devoirs (travail à faire pour une classe)
-- =============================================================
-- Le professeur donne un devoir (un exercice, une leçon à apprendre, un
-- contrôle annoncé…) à UNE de ses classes, dans SA matière. Le devoir
-- s'accroche à une AFFECTATION (qui porte déjà le prof, la matière et la
-- classe) : pas de ressaisie, et seules des combinaisons valides sont
-- possibles. Un devoir concerne TOUTE la classe (pas un élève en particulier).
--
-- Champs :
--   - titre        : court intitulé (ex. « Exercices p.42 »).
--   - consigne     : le détail / les instructions (facultatif).
--   - date_pour_le : la date à laquelle le devoir est attendu (facultatif).
--
-- Sécurité :
--   - Écriture : le professeur de l'affectation (ou l'admin de l'école).
--   - Lecture  : tous les élèves de la classe concernée, leurs parents, le
--                prof de l'affectation, l'admin de l'école. Un élève d'une
--                autre classe ne voit pas le devoir.
-- =============================================================

create table public.devoirs (
  id               uuid primary key default gen_random_uuid(),
  ecole_id         uuid not null references public.ecoles(id) on delete cascade,
  affectation_id   uuid not null references public.affectations(id) on delete cascade,
  titre            text not null check (char_length(titre) between 1 and 200),
  consigne         text check (char_length(consigne) <= 2000),
  date_pour_le     date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index devoirs_ecole_id_idx on public.devoirs (ecole_id);
create index devoirs_affectation_id_idx on public.devoirs (affectation_id);
create index devoirs_date_idx on public.devoirs (date_pour_le);

create trigger devoirs_set_updated_at
  before update on public.devoirs
  for each row execute function public.set_updated_at();

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.devoirs enable row level security;

-- Lecture : super-admin partout ; sinon dans son école : l'admin voit tout,
-- le prof voit ceux de SES affectations, l'élève voit ceux de SA classe.
create policy "devoirs_select"
  on public.devoirs
  for select
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
        )
        or exists (
          select 1
          from public.affectations a
          join public.profils p on p.id = auth.uid()
          where a.id = affectation_id
            and p.classe_id = a.classe_id
        )
      )
    )
  );

-- Lecture du parent : il voit les devoirs de la classe de SES enfants.
create policy "devoirs_select_parent"
  on public.devoirs
  for select
  to authenticated
  using (
    public.auth_role() = 'parent'
    and exists (
      select 1
      from public.affectations a
      join public.parents_eleves pe on pe.parent_id = auth.uid()
      join public.profils enfant on enfant.id = pe.eleve_id
      where a.id = affectation_id
        and enfant.classe_id = a.classe_id
    )
  );

-- Écriture : super-admin ; sinon dans son école : l'admin, ou le prof de
-- l'affectation concernée (il ne peut donner un devoir que via SES affectations).
create policy "devoirs_write"
  on public.devoirs
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
