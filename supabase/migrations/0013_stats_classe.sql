-- =============================================================
-- Migration 0013 — Rang de l'élève et moyenne de la classe
-- =============================================================
-- Pour afficher « 3ᵉ sur 28 » et la moyenne de la classe sur un bulletin, il
-- faut comparer un élève à TOUS les autres de sa classe. Or la sécurité (RLS)
-- interdit à un élève de lire les notes des autres. On crée donc une fonction
-- `security definer` : elle calcule tout côté serveur et ne renvoie QUE des
-- chiffres agrégés (moyenne de classe, rang, effectif, plus forte / plus faible
-- moyenne). Elle ne révèle jamais les notes individuelles d'autrui.
--
-- Accès verrouillé : seul l'élève lui-même, un de ses parents, l'admin de
-- l'école ou le super-admin peut obtenir ces statistiques.
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
    (select round(moyenne, 2) from classees where eleve_id = p_eleve_id),
    (select rang::int        from classees where eleve_id = p_eleve_id),
    (select count(*)::int    from classees),
    (select round(avg(moyenne), 2) from classees),
    (select round(max(moyenne), 2) from classees),
    (select round(min(moyenne), 2) from classees);
end;
$$;

-- Les utilisateurs connectés peuvent appeler la fonction (qui vérifie elle-même
-- les droits ci-dessus).
grant execute on function public.stats_classe_eleve(uuid, smallint) to authenticated;
