-- =============================================================
-- Migration 0020 — Les demandes d'inscription d'école (onboarding)
-- =============================================================
-- Un directeur qui souhaite rejoindre la plateforme remplit un formulaire
-- PUBLIC (sans compte). Sa demande atterrit ici. Le super-admin la voit, puis
-- crée l'école + le compte admin d'un clic (ce qui marque la demande traitée).
--
-- Cette table est PARTICULIÈRE : elle n'a pas d'`ecole_id` (l'école n'existe pas
-- encore) et son insertion est ouverte aux visiteurs non connectés. La lecture
-- et la gestion restent strictement réservées au super-admin.
-- =============================================================

create table public.demandes_inscription (
  id                 uuid primary key default gen_random_uuid(),
  nom_ecole          text not null check (char_length(nom_ecole) between 1 and 200),
  contact_prenom     text not null check (char_length(contact_prenom) between 1 and 100),
  contact_nom        text not null check (char_length(contact_nom) between 1 and 100),
  contact_email      text not null check (char_length(contact_email) between 3 and 200),
  contact_telephone  text check (char_length(contact_telephone) <= 40),
  ville              text check (char_length(ville) <= 120),
  message            text check (char_length(message) <= 1000),
  statut             text not null default 'en_attente'
                       check (statut in ('en_attente', 'traitee', 'rejetee')),
  created_at         timestamptz not null default now()
);

create index demandes_inscription_statut_idx on public.demandes_inscription (statut);

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.demandes_inscription enable row level security;

-- Insertion : ouverte à tous (visiteur non connecté compris). On force la
-- nouvelle demande à l'état « en_attente » (impossible de se déclarer traité).
create policy "demandes_insert_public"
  on public.demandes_inscription
  for insert
  to anon, authenticated
  with check (statut = 'en_attente');

-- Lecture : super-admin uniquement.
create policy "demandes_select_superadmin"
  on public.demandes_inscription
  for select
  to authenticated
  using (public.auth_role() = 'super_admin');

-- Mise à jour (marquer traitée / rejetée) : super-admin uniquement.
create policy "demandes_update_superadmin"
  on public.demandes_inscription
  for update
  to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

-- Suppression : super-admin uniquement.
create policy "demandes_delete_superadmin"
  on public.demandes_inscription
  for delete
  to authenticated
  using (public.auth_role() = 'super_admin');
