-- =============================================================
-- Migration 0014 — Correctif de la fonction stats_classe_eleve
-- =============================================================
-- La version 0013 plantait avec « column reference "rang" is ambiguous » :
-- la colonne de SORTIE de la fonction s'appelle `rang`, et la sous-requête
-- `select rang from classees` ne disait pas laquelle des deux on voulait.
-- Correctif : on préfixe chaque colonne par l'alias de table (c.rang, etc.).
-- Le reste de la logique est identique.
-- =============================================================

create or replace function public.stats_classe_eleve(
  p_eleve_id uuid,
  p_semestre smallint
)
returns table (
  moyenne_eleve  numeric,
  rang           integer,
  effectif       integer,
  moyenne_classe numeric,
  moyenne_max    numeric,
  moyenne_min    numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classe_id uuid;
  v_ecole_id  uuid;
begin
  -- Classe et école de l'élève visé.
  select classe_id, ecole_id into v_classe_id, v_ecole_id
  from public.profils
  where id = p_eleve_id and role = 'eleve';

  -- Pas de classe => pas de statistiques.
  if v_classe_id is null then
    return;
  end if;

  -- Autorisation : élève lui-même, parent de l'élève, admin de l'école, super-admin.
  if not (
    auth.uid() = p_eleve_id
    or public.auth_role() = 'super_admin'
    or (public.auth_role() = 'admin_ecole' and public.auth_ecole_id() = v_ecole_id)
    or exists (
      select 1 from public.parents_eleves pe
      where pe.eleve_id = p_eleve_id and pe.parent_id = auth.uid()
    )
  ) then
    raise exception 'Accès non autorisé aux statistiques de classe.';
  end if;

  return query
  with
  -- Moyenne de chaque (élève, matière) du semestre = moyenne simple des notes.
  moy_matiere as (
    select n.eleve_id, a.matiere_id, avg(n.valeur)::numeric as moy
    from public.notes n
    join public.affectations a on a.id = n.affectation_id
    where n.semestre = p_semestre
      and n.eleve_id in (
        select id from public.profils
        where classe_id = v_classe_id and role = 'eleve'
      )
    group by n.eleve_id, a.matiere_id
  ),
  -- Moyenne générale de chaque élève = somme(moy × coef) / somme(coef).
  moy_generale as (
    select mm.eleve_id,
           sum(mm.moy * m.coefficient_defaut)
             / nullif(sum(m.coefficient_defaut), 0) as moyenne
    from moy_matiere mm
    join public.matieres m on m.id = mm.matiere_id
    group by mm.eleve_id
  ),
  -- Classement (les ex æquo partagent le même rang).
  classees as (
    select eleve_id, moyenne,
           rank() over (order by moyenne desc) as rang
    from moy_generale
  )
  select
    (select round(c.moyenne, 2) from classees c where c.eleve_id = p_eleve_id),
    (select c.rang::int         from classees c where c.eleve_id = p_eleve_id),
    (select count(*)::int       from classees c),
    (select round(avg(c.moyenne), 2) from classees c),
    (select round(max(c.moyenne), 2) from classees c),
    (select round(min(c.moyenne), 2) from classees c);
end;
$$;
