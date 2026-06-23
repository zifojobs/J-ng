-- =============================================================
-- SEED — Créer le profil du super-admin
-- =============================================================
-- À lancer APRÈS avoir créé l'utilisateur dans :
--   Authentication -> Users -> Add user (avec "Auto Confirm User" coché).
--
-- Ce script retrouve l'utilisateur par son email et lui crée un profil
-- avec le rôle super_admin (pas d'ecole_id : il voit toutes les écoles).
--
-- 👉 Remplace les 3 valeurs ci-dessous (email, nom, prénom) par les tiennes.
-- =============================================================

insert into public.profils (id, ecole_id, role, nom, prenom, email)
select
  u.id,
  null,                       -- super_admin : aucune école
  'super_admin',
  'Danfakha',            -- ex. 'Shabeeb'
  'Saibo',         -- ex. 'Hasan'
  u.email
from auth.users u
where u.email = 'zifo1819@gmail.com'   -- 👈 mets ici l'email utilisé à l'étape "Add user"
on conflict (id) do update
  set role = excluded.role,
      nom = excluded.nom,
      prenom = excluded.prenom,
      email = excluded.email;

-- Vérification : doit afficher ta ligne avec role = super_admin.
select id, role, nom, prenom, email, ecole_id from public.profils;
