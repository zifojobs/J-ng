-- =============================================================
-- Migration 0022 — Échéance d'abonnement (phase 6, sous-étape B)
-- =============================================================
-- But : donner à chaque école une DATE D'ÉCHÉANCE (jusqu'à quand l'accès est
-- payé), garder un HISTORIQUE des paiements, et couper l'accès automatiquement
-- quand l'échéance est dépassée (le blocage automatique se fait côté appli,
-- dans requireProfil).
--
-- Rappel : le `statut` (essai/actif/suspendu) reste le robinet MANUEL du
-- super-admin (étape 6-A). L'échéance ajoute la dimension « durée » : une école
-- dont la date est dépassée est bloquée même si son statut est 'actif'.
-- =============================================================

-- ----- 1) La date d'échéance sur l'école --------------------
-- null = pas de limite (ex. avant le premier paiement, on laisse en essai).
alter table public.ecoles
  add column if not exists date_echeance date;

-- ----- 2) L'historique des abonnements / paiements ----------
create table if not exists public.abonnements (
  id            uuid primary key default gen_random_uuid(),
  ecole_id      uuid not null references public.ecoles(id) on delete cascade,
  date_debut    date not null,
  date_fin      date not null,                       -- nouvelle échéance après ce paiement
  montant_fcfa  integer not null default 0 check (montant_fcfa >= 0),
  moyen         text,                                -- ex. "espèces", "Orange Money" (libre)
  note          text,
  cree_par      uuid references public.profils(id) on delete set null,
  created_at    timestamptz not null default now(),

  check (date_fin >= date_debut)
);

create index abonnements_ecole_id_idx on public.abonnements (ecole_id);

alter table public.abonnements enable row level security;

-- Lecture : le super-admin (tout) + les membres de leur propre école.
create policy "abonnements_select"
  on public.abonnements
  for select
  to authenticated
  using (
    public.auth_role() = 'super_admin'
    or ecole_id = public.auth_ecole_id()
  );

-- Écriture (enregistrer un paiement) : super-admin uniquement.
create policy "abonnements_super_admin_write"
  on public.abonnements
  for all
  to authenticated
  using ( public.auth_role() = 'super_admin' )
  with check ( public.auth_role() = 'super_admin' );

-- ----- 3) Étendre le verrou : statut ET échéance réservés au super-admin ----
-- (Même raison qu'en 0021 : un admin peut modifier la ligne de SON école pour
--  les coordonnées ; il ne doit pas pouvoir s'auto-prolonger l'échéance.)
create or replace function public.verrou_statut_ecole()
returns trigger
language plpgsql
as $$
begin
  if (new.statut is distinct from old.statut
       or new.date_echeance is distinct from old.date_echeance)
     and public.auth_role() is distinct from 'super_admin' then
    raise exception 'Seul le super-admin peut changer le statut ou l''échéance d''une école.';
  end if;
  return new;
end;
$$;
