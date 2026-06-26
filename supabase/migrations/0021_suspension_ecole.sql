-- =============================================================
-- Migration 0021 — Suspension d'une école (phase 6, sous-étape A)
-- =============================================================
-- But : faire en sorte que le `statut` d'une école (essai / actif / suspendu)
-- soit un vrai « robinet » d'abonnement, et que SEUL le super-admin puisse le
-- tourner.
--
-- Le problème : depuis la migration 0010, un admin peut modifier SA propre
-- école (règle `ecoles_admin_update`, prévue pour les coordonnées du bulletin).
-- La RLS de Postgres autorise ou refuse une LIGNE entière — elle ne sait pas
-- filtrer colonne par colonne. Tel quel, un admin suspendu pourrait donc se
-- réactiver lui-même en repassant `statut` à 'actif' via l'API.
--
-- La parade, au niveau de la BASE (et pas seulement du code) : un déclencheur
-- (trigger) qui refuse toute modification de `statut` si l'auteur n'est pas le
-- super-admin. Les autres colonnes (adresse, téléphone, logo, directeur)
-- restent modifiables par l'admin comme avant.
-- =============================================================

-- ----- Le verrou : interdire de changer `statut` sauf super-admin ----------
create or replace function public.verrou_statut_ecole()
returns trigger
language plpgsql
as $$
begin
  -- `is distinct from` gère correctement le cas des valeurs nulles.
  if new.statut is distinct from old.statut
     and public.auth_role() is distinct from 'super_admin' then
    raise exception 'Seul le super-admin peut changer le statut d''une école.';
  end if;
  return new;
end;
$$;

drop trigger if exists ecoles_verrou_statut on public.ecoles;

create trigger ecoles_verrou_statut
  before update on public.ecoles
  for each row execute function public.verrou_statut_ecole();
