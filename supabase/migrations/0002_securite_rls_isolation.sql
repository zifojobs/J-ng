-- =============================================================
-- Migration 0002 — Sécurité : isolation multi-école (RLS)
-- =============================================================
-- Met en place :
--   1) une fonction "hook" qui inscrit ecole_id + role sur le badge (jeton) à la connexion ;
--   2) deux fonctions raccourcies pour lire ces infos du badge dans les règles ;
--   3) les règles de sécurité (RLS) sur `ecoles` et `profils`.
--
-- IMPORTANT : après avoir lancé ce SQL, il faut ACTIVER le hook dans le
-- tableau de bord (Authentication -> Hooks). Voir les instructions données par Claude.
-- =============================================================


-- ----- 1) Le "hook" : écrit ecole_id + role sur le badge ----
-- Cette fonction est appelée automatiquement par Supabase à chaque connexion.
-- NB : on nomme le rôle "user_role" (et non "role") car "role" est déjà réservé.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims      jsonb;
  v_ecole_id  uuid;
  v_role      public.role_utilisateur;
begin
  -- On récupère l'école et le rôle de l'utilisateur qui se connecte.
  select ecole_id, role
    into v_ecole_id, v_role
  from public.profils
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- On ajoute le rôle au badge.
  if v_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role::text));
  else
    claims := jsonb_set(claims, '{user_role}', 'null'::jsonb);
  end if;

  -- On ajoute l'école au badge.
  if v_ecole_id is not null then
    claims := jsonb_set(claims, '{ecole_id}', to_jsonb(v_ecole_id::text));
  else
    claims := jsonb_set(claims, '{ecole_id}', 'null'::jsonb);
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Droits : seul le service d'authentification de Supabase peut utiliser ce hook.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on table public.profils to supabase_auth_admin;

-- Le service d'authentification doit pouvoir lire les profils (pour remplir le badge).
create policy "profils_auth_admin_read"
  on public.profils
  for select
  to supabase_auth_admin
  using (true);


-- ----- 2) Deux raccourcis pour lire le badge ----------------

-- L'école de l'utilisateur connecté (lue sur le badge).
create or replace function public.auth_ecole_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'ecole_id', '')::uuid;
$$;

-- Le rôle de l'utilisateur connecté (lu sur le badge).
create or replace function public.auth_role()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'user_role';
$$;


-- ----- 3) Les règles de sécurité (RLS) ----------------------
-- (La RLS est déjà activée automatiquement ; on le confirme explicitement.)

alter table public.ecoles  enable row level security;
alter table public.profils enable row level security;

-- --- Table `ecoles` ---

-- Lecture : on ne voit que SON école (le super-admin voit tout).
create policy "ecoles_select"
  on public.ecoles
  for select
  to authenticated
  using (
    id = public.auth_ecole_id()
    or public.auth_role() = 'super_admin'
  );

-- Création / modification / suppression d'une école : super-admin uniquement.
create policy "ecoles_super_admin_all"
  on public.ecoles
  for all
  to authenticated
  using ( public.auth_role() = 'super_admin' )
  with check ( public.auth_role() = 'super_admin' );

-- --- Table `profils` ---

-- Lecture : soi-même, OU les profils de sa propre école, OU tout (super-admin).
create policy "profils_select"
  on public.profils
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or ecole_id = public.auth_ecole_id()
    or public.auth_role() = 'super_admin'
  );

-- Écriture : l'admin de la MÊME école, ou le super-admin.
create policy "profils_admin_write"
  on public.profils
  for all
  to authenticated
  using (
    public.auth_role() = 'super_admin'
    or (public.auth_role() = 'admin_ecole' and ecole_id = public.auth_ecole_id())
  )
  with check (
    public.auth_role() = 'super_admin'
    or (public.auth_role() = 'admin_ecole' and ecole_id = public.auth_ecole_id())
  );
