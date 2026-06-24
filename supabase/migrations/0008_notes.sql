-- =============================================================
-- Migration 0008 — Les notes
-- =============================================================
-- Une note appartient à UNE affectation (qui porte déjà le prof, la
-- matière et la classe) et concerne UN élève. Type = devoir ou
-- composition, avec un titre libre ("Devoir 1", "Composition"…), ce
-- qui permet 1 ou 2 devoirs + compo, ou 1 seul devoir, sans rigidité.
-- Valeur sur 20.
--
-- Sécurité (données d'élèves mineurs — confidentialité) :
--   - Écriture : le professeur de l'affectation (ou l'admin de l'école).
--   - Lecture  : l'élève concerné voit SES notes ; le prof de l'affectation
--                et l'admin voient celles de l'école. Un élève ne voit
--                jamais les notes d'un autre.
-- =============================================================

create table public.notes (
  id               uuid primary key default gen_random_uuid(),
  ecole_id         uuid not null references public.ecoles(id) on delete cascade,
  affectation_id   uuid not null references public.affectations(id) on delete cascade,
  eleve_id         uuid not null references public.profils(id) on delete cascade,
  type             text not null check (type in ('devoir', 'composition')),
  titre            text,                                         -- ex. "Devoir 1"
  valeur           numeric(4,2) not null check (valeur >= 0 and valeur <= 20),
  coefficient      numeric not null default 1 check (coefficient > 0),
  date_evaluation  date not null default current_date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index notes_ecole_id_idx on public.notes (ecole_id);
create index notes_affectation_id_idx on public.notes (affectation_id);
create index notes_eleve_id_idx on public.notes (eleve_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.notes enable row level security;

-- Lecture : super-admin partout ; sinon dans son école : l'admin voit tout,
-- le prof voit les notes de SES affectations, l'élève voit SES notes.
create policy "notes_select"
  on public.notes
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

-- Écriture : super-admin ; sinon dans son école : l'admin, ou le prof
-- de l'affectation concernée (il ne peut noter que via SES affectations).
create policy "notes_write"
  on public.notes
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
