-- =============================================================
-- Migration 0011 — Stockage du logo de l'école (Supabase Storage)
-- =============================================================
-- Le logo est un fichier image. On ne le met pas dans une colonne mais dans
-- le "Storage" de Supabase. On crée :
--   1) un bucket public `logos` (lecture par tous, pour l'afficher partout) ;
--   2) des règles : un admin ne peut déposer/remplacer/supprimer QUE dans le
--      sous-dossier de SA propre école (`<ecole_id>/...`).
-- L'adresse publique du fichier est ensuite enregistrée dans `ecoles.logo_url`.
-- =============================================================

-- ----- 1) Le bucket (lecture publique) ----------------------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- ----- 2) Les règles de sécurité sur les fichiers -----------
-- Lecture : tout le monde (le logo apparaît sur les bulletins).
create policy "logos_public_read"
  on storage.objects
  for select
  to public
  using ( bucket_id = 'logos' );

-- Dépôt : l'admin, uniquement dans le dossier de SON école.
-- `storage.foldername(name)[1]` = le 1er dossier du chemin = l'ecole_id.
create policy "logos_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and public.auth_role() = 'admin_ecole'
    and (storage.foldername(name))[1] = public.auth_ecole_id()::text
  );

-- Remplacement (upsert) : même condition.
create policy "logos_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'logos'
    and public.auth_role() = 'admin_ecole'
    and (storage.foldername(name))[1] = public.auth_ecole_id()::text
  )
  with check (
    bucket_id = 'logos'
    and public.auth_role() = 'admin_ecole'
    and (storage.foldername(name))[1] = public.auth_ecole_id()::text
  );

-- Suppression : même condition.
create policy "logos_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and public.auth_role() = 'admin_ecole'
    and (storage.foldername(name))[1] = public.auth_ecole_id()::text
  );
