-- =============================================================
-- Migration 0024 — Moyenne « à la sénégalaise » dans stats_classe_eleve
-- =============================================================
-- Le bulletin calcule désormais la moyenne d'une matière comme :
--   (moyenne des devoirs + note de composition) / 2
-- (si l'un des deux manque, on prend celui qui existe).
-- Cette fonction — qui donne le rang et les moyennes de la classe —
-- doit appliquer la MÊME formule, sinon le rang affiché sur le
-- bulletin ne correspondrait plus à la moyenne affichée.
-- Seul le bloc `moy_matiere` change ; le reste est identique à 0014.
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
  -- Moyenne de chaque (élève, matière) du semestre :
  -- (moyenne des devoirs + moyenne des compositions) / 2,
  -- ou celle qui existe si l'autre manque.
  moy_matiere as (
    select t.eleve_id, t.matiere_id,
           case
             when t.moy_dev is not null and t.moy_comp is not null
               then (t.moy_dev + t.moy_comp) / 2
             else coalesce(t.moy_dev, t.moy_comp)
           end as moy
    from (
      select n.eleve_id, a.matiere_id,
             avg(n.valeur) filter (where n.type = 'devoir')::numeric      as moy_dev,
             avg(n.valeur) filter (where n.type = 'composition')::numeric as moy_comp
      from public.notes n
      join public.affectations a on a.id = n.affectation_id
      where n.semestre = p_semestre
        and n.eleve_id in (
          select id from public.profils
          where classe_id = v_classe_id and role = 'eleve'
        )
      group by n.eleve_id, a.matiere_id
    ) t
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
