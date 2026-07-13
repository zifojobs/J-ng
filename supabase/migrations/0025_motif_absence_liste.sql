-- =============================================================
-- Migration 0025 — Motif d'absence : liste fermée (protection des données)
-- =============================================================
-- Avant : `motif` était un texte libre (jusqu'à 500 caractères), où un parent
-- pouvait écrire une donnée de santé détaillée (« hospitalisé pour… »).
-- Les données de santé relèvent du régime lourd d'« autorisation » de la CDP.
--
-- Après : `motif` ne peut valoir que l'une de trois catégories, sans détail :
--   'Familial', 'Médical', 'Autre'  (ou vide).
-- Jàng reste ainsi dans le régime simple de « déclaration ».
-- Voir docs/declaration-cdp.md (décision D3).
--
-- À lancer à la main dans le SQL Editor de Supabase (copier-coller + Run).
-- =============================================================

-- ----- 1) Normaliser les anciennes valeurs libres -----------
-- Tout motif existant qui n'entre pas dans la nouvelle liste devient 'Autre'
-- (on ne perd pas l'information « justifiée » ; on retire juste le détail libre).
update public.absences
  set motif = 'Autre'
  where motif is not null
    and motif not in ('Familial', 'Médical', 'Autre');

-- ----- 2) Remplacer l'ancienne contrainte de longueur -------
alter table public.absences
  drop constraint if exists absences_motif_check;

alter table public.absences
  add constraint absences_motif_check
  check (motif is null or motif in ('Familial', 'Médical', 'Autre'));
