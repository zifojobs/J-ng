-- =============================================================
-- Migration 0015 — Les appréciations par matière
-- =============================================================
-- En plus des notes chiffrées, le professeur écrit un petit commentaire
-- (l'« appréciation ») pour CHAQUE élève, dans SA matière, pour un semestre
-- donné : ex. « Élève sérieux, doit participer davantage à l'oral. »
--
-- Une appréciation s'accroche à UNE affectation (qui porte déjà le prof, la
-- matière et la classe) + UN élève + UN semestre. Au plus une par trio, donc
-- le prof corrige son texte au lieu d'en empiler plusieurs.
--
-- Sécurité (mêmes règles que la table `notes`) :
--   - Écriture : le professeur de l'affectation (ou l'admin de l'école).
--   - Lecture  : l'élève concerné, son parent, le prof de l'affectation,
--                l'admin de l'école. Jamais l'appréciation d'un autre élève.
-- =============================================================

create table public.appreciations (
  id               uuid primary key default gen_random_uuid(),
  ecole_id         uuid not null references public.ecoles(id) on delete cascade,
  affectation_id   uuid not null references public.affectations(id) on delete cascade,
  eleve_id         uuid not null references public.profils(id) on delete cascade,
  semestre         smallint not null default 1 check (semestre in (1, 2)),
  texte            text not null check (char_length(texte) <= 500),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Au plus une appréciation par (affectation, élève, semestre).
  unique (affectation_id, eleve_id, semestre)
);

create index appreciations_ecole_id_idx on public.appreciations (ecole_id);
create index appreciations_eleve_semestre_idx on public.appreciations (eleve_id, semestre);

create trigger appreciations_set_updated_at
  before update on public.appreciations
  for each row execute function public.set_updated_at();

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.appreciations enable row level security;

-- Lecture : super-admin partout ; sinon dans son école : l'admin voit tout,
-- le prof voit celles de SES affectations, l'élève voit les siennes.
create policy "appreciations_select"
  on public.appreciations
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

-- Lecture du parent : il voit les appréciations de SES enfants.
create policy "appreciations_select_parent"
  on public.appreciations
  for select
  to authenticated
  using (
    public.auth_role() = 'parent'
    and exists (
      select 1 from public.parents_eleves pe
      where pe.eleve_id = appreciations.eleve_id
        and pe.parent_id = auth.uid()
    )
  );

-- Écriture : super-admin ; sinon dans son école : l'admin, ou le prof de
-- l'affectation concernée (il ne peut commenter que via SES affectations).
create policy "appreciations_write"
  on public.appreciations
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
