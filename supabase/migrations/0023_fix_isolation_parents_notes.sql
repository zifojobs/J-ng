-- =============================================================
-- Migration 0023 — Renforcement de l'isolation parent ↔ enfant
-- =============================================================
-- Corrige une faille d'isolation inter-école (audit — Finding 1) :
--
--   1) L'écriture d'un lien parent↔enfant (`parents_eleves`) ne vérifiait
--      que `ecole_id = mon école`, PAS que le parent et l'élève désignés
--      appartiennent bien à cette école. Un admin pouvait donc, en fournissant
--      l'UUID d'un élève d'une autre école, créer un lien inter-école.
--
--   2) La règle qui laisse un parent lire les notes de ses enfants n'avait
--      AUCUN contrôle d'école : le lien piégé ci-dessus aurait alors exposé
--      les notes d'un élève d'une autre école.
--
-- On rejoue les deux policies en ajoutant les contrôles manquants.
-- (Rejouable sans risque : on supprime avant de recréer.)
-- =============================================================


-- ----- 1) Écriture des liens parent↔enfant ------------------
-- L'admin ne peut lier que des profils (parent ET élève) de SA propre école.

drop policy if exists "parents_eleves_admin_write" on public.parents_eleves;

create policy "parents_eleves_admin_write"
  on public.parents_eleves
  for all
  to authenticated
  using (
    public.auth_role() = 'super_admin'
    or (public.auth_role() = 'admin_ecole' and ecole_id = public.auth_ecole_id())
  )
  with check (
    public.auth_role() = 'super_admin'
    or (
      public.auth_role() = 'admin_ecole'
      and ecole_id = public.auth_ecole_id()
      -- Le parent désigné appartient bien à mon école.
      and exists (
        select 1 from public.profils p
        where p.id = parent_id
          and p.ecole_id = public.auth_ecole_id()
          and p.role = 'parent'
      )
      -- L'élève désigné appartient bien à mon école.
      and exists (
        select 1 from public.profils e
        where e.id = eleve_id
          and e.ecole_id = public.auth_ecole_id()
          and e.role = 'eleve'
      )
    )
  );


-- ----- 2) Lecture des notes par le parent -------------------
-- On ajoute le contrôle d'école : sur la note ET sur le lien parent↔enfant.

drop policy if exists "notes_select_parent" on public.notes;

create policy "notes_select_parent"
  on public.notes
  for select
  to authenticated
  using (
    public.auth_role() = 'parent'
    and notes.ecole_id = public.auth_ecole_id()
    and exists (
      select 1 from public.parents_eleves pe
      where pe.eleve_id = notes.eleve_id
        and pe.parent_id = auth.uid()
        and pe.ecole_id = public.auth_ecole_id()
    )
  );
