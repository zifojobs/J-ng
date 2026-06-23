-- =============================================================
-- Migration 0001 — Socle multi-école : tables `ecoles` et `profils`
-- =============================================================
-- Cette migration crée :
--   1) les "types" pour les rôles et le statut d'une école ;
--   2) la table des écoles ;
--   3) la table des profils (les utilisateurs), reliée à l'authentification ;
--   4) une mise à jour automatique de la date de modification.
-- La sécurité (RLS) sera posée dans la migration suivante (0002).
-- =============================================================

-- ----- 1) Les types (listes de valeurs autorisées) ----------

-- Les 5 rôles possibles d'un utilisateur.
create type public.role_utilisateur as enum (
  'super_admin',
  'admin_ecole',
  'professeur',
  'eleve',
  'parent'
);

-- L'état d'abonnement d'une école.
create type public.statut_ecole as enum (
  'essai',
  'actif',
  'suspendu'
);

-- ----- 2) La table des écoles -------------------------------

create table public.ecoles (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  slug        text not null unique,          -- identifiant court et unique (ex. "college-jang")
  adresse     text,
  telephone   text,
  logo_url    text,
  statut      public.statut_ecole not null default 'essai',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----- 3) La table des profils (utilisateurs) ---------------
-- `id` est le MÊME identifiant que dans l'authentification Supabase (auth.users).
-- `ecole_id` rattache l'utilisateur à son école (vide pour le super-admin).

create table public.profils (
  id           uuid primary key references auth.users(id) on delete cascade,
  ecole_id     uuid references public.ecoles(id) on delete cascade,
  role         public.role_utilisateur not null,
  nom          text not null,
  prenom       text not null,
  email        text,
  identifiant  text,                          -- matricule créé par l'école (login sans email)
  telephone    text,
  photo_url    text,
  actif        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Dans une même école, deux personnes ne peuvent pas avoir le même identifiant.
  unique (ecole_id, identifiant)
);

-- Index pour retrouver vite tous les utilisateurs d'une école.
create index profils_ecole_id_idx on public.profils (ecole_id);

-- ----- 4) Mise à jour automatique de `updated_at` -----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ecoles_set_updated_at
  before update on public.ecoles
  for each row execute function public.set_updated_at();

create trigger profils_set_updated_at
  before update on public.profils
  for each row execute function public.set_updated_at();
