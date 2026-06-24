-- =============================================================
-- Migration 0010 — Coordonnées de l'école (pour le bulletin)
-- =============================================================
-- But : afficher sur le bulletin l'adresse, le téléphone, le logo et une
-- ligne de signature du responsable de l'école.
--
-- Les colonnes `adresse`, `telephone` et `logo_url` existent déjà (migration
-- 0001). Il manque seulement le nom du responsable (le signataire).
--
-- Et surtout : jusqu'ici SEUL le super-admin pouvait modifier une école. On
-- ajoute une règle pour que l'admin puisse renseigner LES COORDONNÉES de SA
-- propre école (et uniquement la sienne).
-- =============================================================

-- ----- 1) Le nom du responsable (pour la signature) ---------
alter table public.ecoles
  add column if not exists directeur text;   -- ex. "M. Diop, Directeur"

-- ----- 2) L'admin peut modifier SA propre école -------------
-- La RLS travaille au niveau de la ligne : cette règle limite l'admin à la
-- ligne de SON école. Le choix des colonnes réellement modifiées (adresse,
-- téléphone, logo, directeur) est verrouillé côté serveur dans l'action.
create policy "ecoles_admin_update"
  on public.ecoles
  for update
  to authenticated
  using ( public.auth_role() = 'admin_ecole' and id = public.auth_ecole_id() )
  with check ( public.auth_role() = 'admin_ecole' and id = public.auth_ecole_id() );
