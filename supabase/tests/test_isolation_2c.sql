-- =============================================================
-- TEST 2c — Vérifier l'isolation multi-école
-- =============================================================
-- Ce script ne laisse AUCUNE trace : tout est annulé à la fin (rollback).
-- Il crée 2 écoles de test, se met dans la peau d'un utilisateur,
-- et affiche ce que cet utilisateur a le DROIT de voir.
-- =============================================================

begin;

-- 1) Deux écoles fictives, avec des identifiants connus d'avance.
insert into public.ecoles (id, nom, slug) values
  ('00000000-0000-0000-0000-00000000000a', 'École A (test)', 'ecole-a-test'),
  ('00000000-0000-0000-0000-00000000000b', 'École B (test)', 'ecole-b-test');

-- 2) On se met dans la peau d'un ADMIN de l'École A
--    (faux badge : son école = A, son rôle = admin_ecole).
set local role authenticated;
set local "request.jwt.claims" =
  '{"ecole_id":"00000000-0000-0000-0000-00000000000a","user_role":"admin_ecole"}';

-- 3) Ce que cet utilisateur voit. RÉSULTAT ATTENDU : UNE seule ligne -> "École A (test)".
select nom, slug from public.ecoles where slug like 'ecole-%-test' order by slug;

rollback;

-- -------------------------------------------------------------
-- POUR TESTER LE SUPER-ADMIN (qui doit voir les DEUX écoles) :
-- relance ce script en remplaçant la ligne du badge (étape 2) par :
--   set local "request.jwt.claims" = '{"ecole_id":null,"user_role":"super_admin"}';
-- Résultat attendu alors : DEUX lignes (École A ET École B).
-- -------------------------------------------------------------
