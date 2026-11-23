-- Doodl gameplay refinement — matches applied Supabase migration 20261123204117.
-- Run only after the initial Doodl migration. Kept in git for reproducibility.
alter table public.rounds add column if not exists quick_started_at timestamptz;
alter table public.rounds drop constraint if exists rounds_theme_index_check;
alter table public.rounds add constraint rounds_theme_index_check check(theme_index between 0 and 11);

create table if not exists public.drawing_sessions (
 round_id uuid not null references public.rounds(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(),
 duration_seconds integer not null check(duration_seconds in (300,420,600)),
 primary key(round_id,user_id)
);
alter table public.drawing_sessions enable row level security;
grant select on public.drawing_sessions to authenticated;

-- round_phase
CREATE OR REPLACE FUNCTION public.round_phase(p_round_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t record; opening timestamptz; voting timestamptz; reveal timestamptz;
begin
 select r.day, r.quick_started_at, c.timezone, c.id as circle_id, c.player_count into t
 from public.rounds r join public.circles c on c.id=r.circle_id where r.id=p_round_id;
 if t is null or not public.is_circle_member(t.circle_id) then return 'none'; end if;
 if t.quick_started_at is not null then
   if now() < t.quick_started_at + interval '10 minutes' then return 'drawing'; end if;
   if t.player_count=3 and now() < t.quick_started_at + interval '15 minutes' then return 'voting'; end if;
   return 'revealed';
 end if;
 opening := (t.day::timestamp + interval '7 hours') at time zone t.timezone;
 voting  := (t.day::timestamp + interval '19 hours') at time zone t.timezone;
 reveal  := ((t.day+1)::timestamp + interval '7 hours') at time zone t.timezone;
 return case when now()<opening then 'upcoming'
             when now()<voting then 'drawing'
             when t.player_count=3 and now()<reveal then 'voting'
             else 'revealed' end;
end; $function$


-- ensure_daily_round
CREATE OR REPLACE FUNCTION public.ensure_daily_round(p_circle_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t text; local_now timestamp; round_day date; rid uuid; theme_idx integer;
        player record; next_index integer;
begin
 if not public.is_circle_member(p_circle_id) then raise exception 'Not in this circle'; end if;
 -- Prevent concurrent callers from assigning the same sub-prompt to two players.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_circle_id::text,0));
 select timezone into t from public.circles where id=p_circle_id;
 local_now := now() at time zone t;
 round_day := (local_now - interval '7 hours')::date;
 theme_idx := (((round_day - date '2020-01-01') % 12) + 12) % 12;
 insert into public.rounds(circle_id,day,theme_index)
 values(p_circle_id,round_day,theme_idx)
 on conflict(circle_id,day) do update set day=excluded.day
 returning id into rid;
 for player in
   select m.user_id from public.circle_members m
   where m.circle_id=p_circle_id
   and not exists(select 1 from public.round_parts rp where rp.round_id=rid and rp.user_id=m.user_id)
   order by m.joined_at,m.user_id
 loop
   select idx into next_index
   from pg_catalog.generate_series(0,4) as idx
   where not exists(select 1 from public.round_parts rp where rp.round_id=rid and rp.prompt_index=idx)
   order by idx limit 1;
   if next_index is not null then
     insert into public.round_parts(round_id,user_id,prompt_index) values(rid,player.user_id,next_index)
     on conflict(round_id,user_id) do nothing;
   end if;
 end loop;
 return rid;
end; $function$


-- start_drawing_session
CREATE OR REPLACE FUNCTION public.start_drawing_session(p_round_id uuid, p_duration_seconds integer)
 RETURNS TABLE(deadline timestamp with time zone, duration_seconds integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if p_duration_seconds not in (300,420,600) then raise exception 'Choose 5, 7, or 10 minutes'; end if;
 if public.round_phase(p_round_id)<>'drawing' then raise exception 'Drawing is not open'; end if;
 if not exists(select 1 from public.round_parts rp where rp.round_id=p_round_id and rp.user_id=auth.uid())
 then raise exception 'No assigned prompt'; end if;
 insert into public.drawing_sessions(round_id,user_id,duration_seconds)
 values(p_round_id,auth.uid(),p_duration_seconds)
 on conflict(round_id,user_id) do nothing;
 return query select ds.started_at+ds.duration_seconds*interval '1 second',ds.duration_seconds
 from public.drawing_sessions ds where ds.round_id=p_round_id and ds.user_id=auth.uid();
end; $function$


-- can_submit
CREATE OR REPLACE FUNCTION public.can_submit(p_round uuid, p_path text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select exists(
  select 1 from public.rounds r join public.drawing_sessions ds
   on ds.round_id=r.id and ds.user_id=(select auth.uid())
  where r.id=p_round and public.is_circle_member(r.circle_id)
    and public.round_phase(r.id)='drawing'
    and now()<=ds.started_at+ds.duration_seconds*interval '1 second'+interval '30 seconds'
    and exists(select 1 from public.round_parts rp where rp.round_id=r.id and rp.user_id=(select auth.uid()))
    and p_path like r.circle_id::text||'/'||r.id::text||'/'||(select auth.uid())::text||'/%'
 );
$function$


-- activate_quick_round
CREATE OR REPLACE FUNCTION public.activate_quick_round(p_circle_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare rid uuid; count_members integer; capacity integer;
begin
 if not exists(select 1 from public.circles where id=p_circle_id and owner_id=auth.uid())
 then raise exception 'Only the circle creator can start a quick round'; end if;
 select c.player_count,count(m.user_id) into capacity,count_members
 from public.circles c left join public.circle_members m on m.circle_id=c.id
 where c.id=p_circle_id group by c.player_count;
 if count_members<>capacity then raise exception 'Wait until all players have joined'; end if;
 rid:=public.ensure_daily_round(p_circle_id);
 if exists(select 1 from public.submissions where round_id=rid) then
   raise exception 'This round already has artwork'; end if;
 if exists(select 1 from public.rounds where id=rid and quick_started_at is not null) then
   raise exception 'A quick round has already started today'; end if;
 update public.rounds set quick_started_at=now() where id=rid;
 return rid;
end; $function$


-- cast_vote
CREATE OR REPLACE FUNCTION public.cast_vote(p_round_id uuid, p_submission_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare target_user uuid; circle_size integer;
begin
 if public.round_phase(p_round_id)<>'voting' then raise exception 'Voting is closed'; end if;
 select c.player_count into circle_size
 from public.rounds r join public.circles c on c.id=r.circle_id where r.id=p_round_id;
 if circle_size<>3 then raise exception 'Voting is only available in a trio'; end if;
 select s.user_id into target_user from public.submissions s
 where s.id=p_submission_id and s.round_id=p_round_id;
 if target_user is null then raise exception 'Drawing unavailable'; end if;
 if target_user=auth.uid() then raise exception 'Cannot vote for yourself'; end if;
 insert into public.votes(round_id,voter_id,submission_id)
 values(p_round_id,auth.uid(),p_submission_id)
 on conflict(round_id,voter_id) do update
 set submission_id=excluded.submission_id,cast_at=now();
end; $function$


-- can_read_art
CREATE OR REPLACE FUNCTION public.can_read_art(p_path text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select exists(
  select 1 from public.submissions s join public.rounds r on r.id=s.round_id
  where s.storage_path=p_path and public.is_circle_member(r.circle_id)
  and (s.user_id=(select auth.uid()) or public.round_phase(r.id) in ('voting','revealed'))
 );
$function$


-- can_export_round
CREATE OR REPLACE FUNCTION public.can_export_round(p_round_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select exists (
   select 1 from public.rounds r where r.id=p_round_id
     and public.is_circle_member(r.circle_id) and public.round_phase(r.id)='revealed'
     and exists(select 1 from public.submissions s where s.round_id=r.id)
     and not exists(
       select 1 from public.submissions s where s.round_id=r.id
       and not exists(select 1 from public.share_consents sc
         where sc.round_id=r.id and sc.user_id=s.user_id and sc.approved=true)
     )
 );
$function$


drop policy if exists "comments_create" on public.comments;
create policy "comments_create" on public.comments for insert to authenticated
with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (submissions s
     JOIN rounds r ON ((r.id = s.round_id)))
  WHERE ((s.id = comments.submission_id) AND is_circle_member(r.circle_id) AND (round_phase(r.id) = ANY (ARRAY['voting'::text, 'revealed'::text])))))));

drop policy if exists "comments_view" on public.comments;
create policy "comments_view" on public.comments for select to authenticated
using ((EXISTS ( SELECT 1
   FROM (submissions s
     JOIN rounds r ON ((r.id = s.round_id)))
  WHERE ((s.id = comments.submission_id) AND is_circle_member(r.circle_id) AND (round_phase(r.id) = ANY (ARRAY['voting'::text, 'revealed'::text]))))));

drop policy if exists "drawing_session_read_self" on public.drawing_sessions;
create policy "drawing_session_read_self" on public.drawing_sessions for select to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));

drop policy if exists "share_consent_insert" on public.share_consents;
create policy "share_consent_insert" on public.share_consents for insert to authenticated
with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (submissions s
     JOIN rounds r ON ((r.id = s.round_id)))
  WHERE ((s.round_id = share_consents.round_id) AND (s.user_id = auth.uid()) AND is_circle_member(r.circle_id) AND (round_phase(r.id) = 'revealed'::text))))));

drop policy if exists "share_consent_update" on public.share_consents;
create policy "share_consent_update" on public.share_consents for update to authenticated
using ((user_id = auth.uid()))
with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (submissions s
     JOIN rounds r ON ((r.id = s.round_id)))
  WHERE ((s.round_id = share_consents.round_id) AND (s.user_id = auth.uid()) AND is_circle_member(r.circle_id) AND (round_phase(r.id) = 'revealed'::text))))));

drop policy if exists "drawings_view" on public.submissions;
create policy "drawings_view" on public.submissions for select to authenticated
using ((EXISTS ( SELECT 1
   FROM rounds r
  WHERE ((r.id = submissions.round_id) AND is_circle_member(r.circle_id) AND ((submissions.user_id = auth.uid()) OR (round_phase(r.id) = ANY (ARRAY['voting'::text, 'revealed'::text])))))));

drop policy if exists "votes_view" on public.votes;
create policy "votes_view" on public.votes for select to authenticated
using ((EXISTS ( SELECT 1
   FROM rounds r
  WHERE ((r.id = votes.round_id) AND is_circle_member(r.circle_id) AND ((votes.voter_id = auth.uid()) OR (round_phase(r.id) = 'revealed'::text))))));

drop policy if exists "doodl_art_read" on storage.objects;
create policy "doodl_art_read" on storage.objects for select to authenticated
using (((bucket_id = 'doodl-art'::text) AND can_read_art(name)));

revoke execute on function public.start_drawing_session(uuid,integer), public.activate_quick_round(uuid),public.can_export_round(uuid),public.can_read_art(text) from public,anon;
grant execute on function public.start_drawing_session(uuid,integer), public.activate_quick_round(uuid),public.can_export_round(uuid),public.can_read_art(text) to authenticated;
