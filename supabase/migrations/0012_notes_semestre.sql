-- =============================================================
-- Migration 0012 — Le semestre d'une note
-- =============================================================
-- Au Sénégal, l'année est généralement découpée en 2 SEMESTRES. Jusqu'ici une
-- note n'appartenait à aucune période : le bulletin montrait donc TOUTES les
-- notes de l'année en vrac. On ajoute une colonne `semestre` (1 ou 2) que le
-- professeur choisit à la saisie. Le bulletin pourra alors filtrer par semestre.
--
-- Les notes déjà saisies n'ont pas de semestre : la valeur par défaut (1) les
-- range dans le 1er semestre. L'admin/le prof pourra les corriger si besoin.
-- =============================================================

alter table public.notes
  add column semestre smallint not null default 1
    check (semestre in (1, 2));

-- On filtrera souvent par (élève, semestre) pour le bulletin.
create index notes_eleve_semestre_idx on public.notes (eleve_id, semestre);
