-- =============================================================
-- Migration 0006 — Rattacher un élève à sa classe
-- =============================================================
-- Un élève (profil de rôle 'eleve') appartient à UNE classe.
-- On ajoute une colonne classe_id sur profils, qui pointe vers une classe.
-- Si la classe est supprimée, l'élève n'est pas supprimé : son classe_id
-- repasse simplement à vide (on delete set null).
-- =============================================================

alter table public.profils
  add column classe_id uuid references public.classes(id) on delete set null;

-- Index pour retrouver vite tous les élèves d'une classe.
create index profils_classe_id_idx on public.profils (classe_id);
