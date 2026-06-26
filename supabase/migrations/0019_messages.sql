-- =============================================================
-- Migration 0019 — La messagerie (conversations 1-à-1)
-- =============================================================
-- Des messages simples entre deux personnes de la MÊME école. Pas de temps
-- réel : on lit/écrit quand on charge la page. Un message a un expéditeur, un
-- destinataire, un contenu, et un indicateur « lu ».
--
-- Qui écrit à qui (règle appliquée côté écran via la liste des destinataires
-- proposés) : parent/élève ↔ professeurs + admin. La sécurité ci-dessous
-- garantit l'essentiel : on ne peut écrire qu'à quelqu'un de SA propre école,
-- et on ne lit que les messages où l'on est expéditeur OU destinataire.
-- =============================================================

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  ecole_id         uuid not null references public.ecoles(id) on delete cascade,
  expediteur_id    uuid not null references public.profils(id) on delete cascade,
  destinataire_id  uuid not null references public.profils(id) on delete cascade,
  contenu          text not null check (char_length(contenu) between 1 and 2000),
  lu               boolean not null default false,
  created_at       timestamptz not null default now()
);

create index messages_ecole_id_idx on public.messages (ecole_id);
create index messages_expediteur_idx on public.messages (expediteur_id);
create index messages_destinataire_idx on public.messages (destinataire_id);

-- ----- Sécurité (RLS) ---------------------------------------
alter table public.messages enable row level security;

-- Lecture : super-admin partout ; sinon, dans sa propre école, on lit
-- seulement les messages où l'on est expéditeur ou destinataire.
create policy "messages_select"
  on public.messages
  for select
  to authenticated
  using (
    public.auth_role() = 'super_admin'
    or (
      ecole_id = public.auth_ecole_id()
      and (expediteur_id = auth.uid() or destinataire_id = auth.uid())
    )
  );

-- Envoi : on n'écrit qu'en son propre nom (expediteur = soi), dans son école,
-- et à un destinataire qui appartient à la même école.
create policy "messages_insert"
  on public.messages
  for insert
  to authenticated
  with check (
    ecole_id = public.auth_ecole_id()
    and expediteur_id = auth.uid()
    and exists (
      select 1 from public.profils p
      where p.id = destinataire_id
        and p.ecole_id = public.auth_ecole_id()
    )
  );

-- Marquer comme lu : seul le destinataire peut mettre à jour la ligne
-- (en pratique : passer « lu » à vrai sur les messages qu'il reçoit).
create policy "messages_update_lu"
  on public.messages
  for update
  to authenticated
  using (
    ecole_id = public.auth_ecole_id()
    and destinataire_id = auth.uid()
  )
  with check (
    ecole_id = public.auth_ecole_id()
    and destinataire_id = auth.uid()
  );
