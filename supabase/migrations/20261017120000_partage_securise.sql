-- FreshList : partage sécurisé, collaborateurs visibles et temps réel.
--
-- À appliquer une fois la nouvelle version du site en ligne : l'ancienne
-- version cherchait les comptes directement dans la table `profiles`,
-- ce que la suppression de la règle « Search by email » interdit.

-- ─── 1. Ne plus exposer les emails de tous les utilisateurs ───────────────
-- La règle « Search by email » (using true) permettait à n'importe qui,
-- même sans compte, de lire la liste complète des emails et des prénoms.
drop policy if exists "Search by email" on public.profiles;

-- Recherche d'un compte par email, réservée aux utilisateurs connectés,
-- qui ne renvoie que l'identifiant.
create or replace function public.find_user_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where auth.uid() is not null
    and lower(p.email) = lower(trim(p_email))
  limit 1;
$$;
revoke all on function public.find_user_by_email(text) from public, anon;
grant execute on function public.find_user_by_email(text) to authenticated;

-- ─── 2. Voir les collaborateurs de mes listes ─────────────────────────────
create or replace function public.my_collaborators()
returns table (list_id uuid, user_id uuid, email text, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.list_id, c.user_id, p.email, p.full_name
  from public.list_collaborators c
  join public.lists l on l.id = c.list_id
  left join public.profiles p on p.id = c.user_id
  where l.owner_id = auth.uid()
  order by p.email;
$$;
revoke all on function public.my_collaborators() from public, anon;
grant execute on function public.my_collaborators() to authenticated;

-- ─── 3. Un collaborateur peut quitter une liste partagée ──────────────────
drop policy if exists collab_delete_self on public.list_collaborators;
create policy collab_delete_self on public.list_collaborators
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ─── 4. Fonction de création de profil : durcie ───────────────────────────
-- (déclenchée à l'inscription ; n'a pas à être appelable via l'API)
alter function public.handle_new_user() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ─── 5. Index sur les clés étrangères (requêtes et règles RLS plus rapides) ─
create index if not exists items_list_id_idx on public.items (list_id);
create index if not exists lists_owner_id_idx on public.lists (owner_id);
create index if not exists list_collaborators_user_id_idx on public.list_collaborators (user_id);

-- ─── 6. Temps réel : diffuser les changements aux collaborateurs ──────────
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items') then
    alter publication supabase_realtime add table public.items;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lists') then
    alter publication supabase_realtime add table public.lists;
  end if;
end $$;
