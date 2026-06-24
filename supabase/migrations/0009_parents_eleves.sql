-- =============================================================
-- Migration 0009 — Les parents (et le lien parent ↔ enfant)
-- =============================================================
-- Un parent est un profil (role 'parent') qui se connecte par matricule,
-- exactement comme un élève. Il est relié à un ou plusieurs élèves via la
-- table `parents_eleves` (un enfant peut aussi avoir deux parents).
-- Le parent ne voit que les notes de SES enfants.
-- =============================================================

create table public.parents_eleves (
  id          uuid primary key default gen_random_uuid(),
  ecole_id    uuid not null references public.ecoles(id) on delete cascade,
  parent_id   uuid not null references public.profils(id) on delete cascade,
  eleve_id    uuid not null references public.profils(id) on delete cascade,
  created_at  timestamptz not null default now(),

  -- Pas deux fois le même lien parent ↔ enfant.
  unique (parent_id, eleve_id)
);

create index parents_eleves_ecole_id_idx on public.parents_eleves (ecole_id);
create index parents_eleves_parent_id_idx on public.parents_eleves (parent_id);
create index parents_eleves_eleve_id_idx on public.parents_eleves (eleve_id);

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.parents_eleves enable row level security;

-- Lecture : super-admin ; sinon dans son école : l'admin voit tout,
-- le parent voit SES propres liens.
create policy "parents_eleves_select"
  on public.parents_eleves
  for select
  to authenticated
  using (
    public.auth_role() = 'super_admin'
    or (
      ecole_id = public.auth_ecole_id()
      and (
        public.auth_role() = 'admin_ecole'
        or parent_id = auth.uid()
      )
    )
  );

-- Écriture : l'admin de la même école (ou super-admin).
create policy "parents_eleves_admin_write"
  on public.parents_eleves
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

-- ----- Le parent peut lire les notes de SES enfants ---------
-- (Règle ajoutée à la table `notes` ; elle s'ajoute aux règles existantes.)
create policy "notes_select_parent"
  on public.notes
  for select
  to authenticated
  using (
    public.auth_role() = 'parent'
    and exists (
      select 1 from public.parents_eleves pe
      where pe.eleve_id = notes.eleve_id
        and pe.parent_id = auth.uid()
    )
  );
