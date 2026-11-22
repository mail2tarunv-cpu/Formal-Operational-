-- Doodl database v1. Prepared for a dedicated Supabase project.
-- This migration is NOT applied automatically. Do not run it in unrelated apps.
create extension if not exists pgcrypto;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 32),
 avatar_path text,
 created_at timestamptz not null default now()
);
create table public.circles (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 48),
 invite_code text not null unique default upper(encode(gen_random_bytes(8),'hex')),
 kind text not null check(kind in ('group','duo')),
 timezone text not null default 'America/New_York',
 owner_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table public.circle_members (
 circle_id uuid not null references public.circles(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(circle_id,user_id)
);
create index circle_members_user_idx on public.circle_members(user_id);
create table public.rounds (
 id uuid primary key default gen_random_uuid(),
 circle_id uuid not null references public.circles(id) on delete cascade,
 day date not null,
 theme_index integer not null check(theme_index between 0 and 2),
 created_at timestamptz not null default now(),
 unique(circle_id,day)
);
create index rounds_group_day_idx on public.rounds(circle_id,day desc);
create table public.round_parts (
 round_id uuid not null references public.rounds(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 prompt_index integer not null check(prompt_index between 0 and 7),
 primary key(round_id,user_id)
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(),
 round_id uuid not null references public.rounds(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 storage_path text not null,
 submitted_at timestamptz not null default now(),
 unique(round_id,user_id)
);
create index submissions_round_idx on public.submissions(round_id);
create table public.comments (
 id uuid primary key default gen_random_uuid(),
 submission_id uuid not null references public.submissions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 350),
 created_at timestamptz not null default now()
);
create index comments_submission_idx on public.comments(submission_id,created_at);
create table public.messages (
 id uuid primary key default gen_random_uuid(),
 circle_id uuid not null references public.circles(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 800),
 created_at timestamptz not null default now()
);
create index messages_circle_idx on public.messages(circle_id,created_at desc);
create table public.votes (
 round_id uuid not null references public.rounds(id) on delete cascade,
 voter_id uuid not null references auth.users(id) on delete cascade,
 submission_id uuid not null references public.submissions(id) on delete cascade,
 cast_at timestamptz not null default now(),
 primary key(round_id,voter_id)
);
create index votes_submission_idx on public.votes(submission_id);
create table public.user_blocks (
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id),
 check(blocker_id<>blocked_id)
);
create table public.reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id),
 target_id uuid not null,
 category text not null check(category in ('message','comment','profile','drawing')),
 reason text not null check(char_length(reason) between 4 and 500),
 created_at timestamptz not null default now()
);

-- Helpers never trust editable JWT user_metadata for authorization.
create function public.is_circle_member(p_circle_id uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select (select auth.uid()) is not null
    and exists(select 1 from public.circle_members m
               where m.circle_id=p_circle_id and m.user_id=(select auth.uid()));
$$;
create function public.shares_circle(p_user_id uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select (select auth.uid()) is not null
    and exists(select 1 from public.circle_members mine
               join public.circle_members theirs on mine.circle_id=theirs.circle_id
               where mine.user_id=(select auth.uid()) and theirs.user_id=p_user_id);
$$;
create function public.round_phase(p_round_id uuid)
returns text language plpgsql stable security definer
set search_path = '' as $$
declare t record; opening timestamptz; voting timestamptz; reveal timestamptz;
begin
 select r.day,c.timezone,c.id as circle_id into t
 from public.rounds r join public.circles c on c.id=r.circle_id where r.id=p_round_id;
 if t is null or not public.is_circle_member(t.circle_id) then return 'none'; end if;
 opening := (t.day::timestamp + interval '7 hours') at time zone t.timezone;
 voting  := (t.day::timestamp + interval '19 hours') at time zone t.timezone;
 reveal  := ((t.day+1)::timestamp + interval '7 hours') at time zone t.timezone;
 return case when now()<opening then 'upcoming'
             when now()<voting then 'drawing'
             when now()<reveal then 'voting'
             else 'revealed' end;
end;
$$;
create function public.can_submit(p_round uuid, p_path text)
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists(
    select 1 from public.rounds r
    where r.id=p_round and public.is_circle_member(r.circle_id)
      and public.round_phase(r.id)='drawing'
      and exists(select 1 from public.round_parts rp where rp.round_id=r.id
                        and rp.user_id=(select auth.uid()))
      and p_path like r.circle_id::text||'/'||r.id::text||'/'||(select auth.uid())::text||'/%'
  );
$$;
create function public.can_store_art(p_name text)
returns boolean language plpgsql stable security definer
set search_path = '' as $$
declare r uuid; u uuid;
begin
  if (select auth.uid()) is null then return false; end if;
  if split_part(p_name,'/',3)<>(select auth.uid())::text then return false; end if;
  if split_part(p_name,'/',2) !~* '^[0-9a-f-]{36}$' then return false; end if;
  r:=split_part(p_name,'/',2)::uuid;
  return public.can_submit(r,p_name);
exception when others then return false;
end;
$$;

-- Only the owner can create a group. Membership is created atomically.
create function public.create_circle(p_name text,p_kind text,p_timezone text)
returns uuid language plpgsql volatile security definer
set search_path = '' as $$
declare cid uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if char_length(btrim(p_name)) not between 2 and 48 then raise exception 'Name must be 2–48 characters'; end if;
 if p_kind not in ('group','duo') then raise exception 'Invalid circle type'; end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then
   raise exception 'Unknown timezone'; end if;
 insert into public.circles(name,kind,timezone,owner_id)
 values(btrim(p_name),p_kind,p_timezone,auth.uid()) returning id into cid;
 insert into public.circle_members(circle_id,user_id) values(cid,auth.uid());
 return cid;
end;
$$;
create function public.join_circle(p_code text)
returns uuid language plpgsql volatile security definer
set search_path = '' as $$
declare cid uuid; k text; member_count integer;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select c.id,c.kind into cid,k from public.circles c
 where c.invite_code=upper(btrim(p_code)) for update;
 if cid is null then raise exception 'Invalid invite code'; end if;
 if public.is_circle_member(cid) then return cid; end if;
 select count(*) into member_count from public.circle_members where circle_id=cid;
 if (k='duo' and member_count>=2) or member_count>=8 then
   raise exception 'This circle is full'; end if;
 insert into public.circle_members(circle_id,user_id) values(cid,auth.uid());
 return cid;
end;
$$;
create function public.ensure_daily_round(p_circle_id uuid)
returns uuid language plpgsql volatile security definer
set search_path = '' as $$
declare t text; local_now timestamp; round_day date; rid uuid; index integer;
begin
 if not public.is_circle_member(p_circle_id) then raise exception 'Not in this circle'; end if;
 select timezone into t from public.circles where id=p_circle_id;
 local_now := now() at time zone t;
 round_day := (local_now - interval '7 hours')::date;
 index := (((round_day - date '2020-01-01') % 3) + 3) % 3;
 insert into public.rounds(circle_id,day,theme_index)
 values(p_circle_id,round_day,index)
 on conflict(circle_id,day) do update set day=excluded.day
 returning id into rid;
 -- A late join gets an assignment without changing any existing ones.
 insert into public.round_parts(round_id,user_id,prompt_index)
 select rid,m.user_id,((row_number() over(order by m.joined_at,m.user_id)-1)::integer % 5)
 from public.circle_members m where m.circle_id=p_circle_id
 on conflict(round_id,user_id) do nothing;
 return rid;
end;
$$;
create function public.cast_vote(p_round_id uuid,p_submission_id uuid)
returns void language plpgsql volatile security definer
set search_path = '' as $$
declare target_user uuid;
begin
 if public.round_phase(p_round_id)<>'voting' then raise exception 'Voting is closed'; end if;
 select s.user_id into target_user from public.submissions s
 where s.id=p_submission_id and s.round_id=p_round_id;
 if target_user is null then raise exception 'Drawing unavailable'; end if;
 if target_user=auth.uid() then raise exception 'Cannot vote for yourself'; end if;
 insert into public.votes(round_id,voter_id,submission_id)
 values(p_round_id,auth.uid(),p_submission_id)
 on conflict(round_id,voter_id) do update
 set submission_id=excluded.submission_id,cast_at=now();
end;
$$;
create function public.get_leaderboard(p_circle_id uuid)
returns table(user_id uuid,points bigint)
language sql stable security definer
set search_path = '' as $$
 select m.user_id,
   case when public.is_circle_member(p_circle_id)
      then coalesce(sum(case when public.round_phase(v.round_id)='revealed' then 10 else 0 end),0)::bigint
      else 0 end as points
 from public.circle_members m
 left join public.submissions s on s.user_id=m.user_id
   and s.round_id in (select r.id from public.rounds r where r.circle_id=p_circle_id)
 left join public.votes v on v.submission_id=s.id
 where m.circle_id=p_circle_id and public.is_circle_member(p_circle_id)
 group by m.user_id order by points desc,m.user_id;
$$;
create function public.leave_circle(p_circle_id uuid)
returns void language plpgsql volatile security definer
set search_path = '' as $$
begin
 if not public.is_circle_member(p_circle_id) then return; end if;
 if exists(select 1 from public.circles where id=p_circle_id and owner_id=auth.uid()) then
   raise exception 'Circle owner must delete the circle'; end if;
 delete from public.circle_members where circle_id=p_circle_id and user_id=auth.uid();
end;
$$;
create function public.delete_circle(p_circle_id uuid)
returns void language plpgsql volatile security definer
set search_path = '' as $$
begin
 if not exists(select 1 from public.circles where id=p_circle_id and owner_id=auth.uid()) then
   raise exception 'Only the circle owner can delete it'; end if;
 delete from public.circles where id=p_circle_id;
end;
$$;

-- New users can create profiles only for themselves.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,display_name)
 values(new.id,'Artist '||substring(new.id::text from 1 for 6))
 on conflict(id) do nothing;
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Fine-grained RLS. No table is publicly writable.
alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.rounds enable row level security;
alter table public.round_parts enable row level security;
alter table public.submissions enable row level security;
alter table public.comments enable row level security;
alter table public.messages enable row level security;
alter table public.votes enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;

create policy profiles_view on public.profiles for select to authenticated
using(id=auth.uid() or public.shares_circle(id));
create policy profiles_update on public.profiles for update to authenticated
using(id=auth.uid()) with check(id=auth.uid());
create policy circles_view on public.circles for select to authenticated
using(public.is_circle_member(id));
create policy members_view on public.circle_members for select to authenticated
using(public.is_circle_member(circle_id));
create policy rounds_view on public.rounds for select to authenticated
using(public.is_circle_member(circle_id));
create policy parts_view on public.round_parts for select to authenticated
using(exists(select 1 from public.rounds r where r.id=round_id and public.is_circle_member(r.circle_id)));
create policy drawings_view on public.submissions for select to authenticated
using(exists(select 1 from public.rounds r where r.id=round_id and public.is_circle_member(r.circle_id)));
create policy drawings_create on public.submissions for insert to authenticated
with check(user_id=auth.uid() and public.can_submit(round_id,storage_path));
create policy drawings_update on public.submissions for update to authenticated
using(user_id=auth.uid() and public.can_submit(round_id,storage_path))
with check(user_id=auth.uid() and public.can_submit(round_id,storage_path));
create policy comments_view on public.comments for select to authenticated
using(exists(select 1 from public.submissions s join public.rounds r on r.id=s.round_id
 where s.id=submission_id and public.is_circle_member(r.circle_id)));
create policy comments_create on public.comments for insert to authenticated
with check(user_id=auth.uid() and exists(select 1 from public.submissions s join public.rounds r on r.id=s.round_id
 where s.id=submission_id and public.is_circle_member(r.circle_id)));
create policy comments_delete on public.comments for delete to authenticated using(user_id=auth.uid());
create policy chats_view on public.messages for select to authenticated
using(public.is_circle_member(circle_id) and not exists(
 select 1 from public.user_blocks b where b.blocker_id=auth.uid() and b.blocked_id=user_id));
create policy chats_create on public.messages for insert to authenticated
with check(user_id=auth.uid() and public.is_circle_member(circle_id));
create policy chats_delete on public.messages for delete to authenticated using(user_id=auth.uid());
create policy votes_view on public.votes for select to authenticated
using(voter_id=auth.uid() or (public.round_phase(round_id)='revealed'));
create policy blocks_select on public.user_blocks for select to authenticated using(blocker_id=auth.uid());
create policy blocks_insert on public.user_blocks for insert to authenticated with check(blocker_id=auth.uid());
create policy blocks_delete on public.user_blocks for delete to authenticated using(blocker_id=auth.uid());
create policy reports_insert on public.reports for insert to authenticated with check(reporter_id=auth.uid());
create policy reports_select on public.reports for select to authenticated using(reporter_id=auth.uid());

-- Deliberately private artwork: never use a public bucket for teen drawings.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('doodl-art','doodl-art',false,10485760,array['image/png','image/webp'])
on conflict(id) do nothing;
create policy doodl_art_read on storage.objects for select to authenticated
using(bucket_id='doodl-art'
 and split_part(name,'/',1)~*'^[0-9a-f-]{36}$'
 and public.is_circle_member(split_part(name,'/',1)::uuid));
create policy doodl_art_upload on storage.objects for insert to authenticated
with check(bucket_id='doodl-art' and public.can_store_art(name));
create policy doodl_art_delete on storage.objects for delete to authenticated
using(bucket_id='doodl-art' and split_part(name,'/',3)=auth.uid()::text);
-- Upload new versioned filenames instead of overwriting existing blobs.

-- Explicit Data API grants, with RLS still enforced on all exposed tables.
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select,update on public.profiles to authenticated;
grant select on public.circles,public.circle_members,public.rounds,public.round_parts to authenticated;
grant select,insert,update on public.submissions to authenticated;
grant select,insert,delete on public.comments,public.messages,public.user_blocks to authenticated;
grant select on public.votes to authenticated;
grant select,insert on public.reports to authenticated;

-- Functions are caller-scoped; never grant an unauthenticated caller execution.
revoke execute on function public.is_circle_member(uuid) from public,anon;
revoke execute on function public.shares_circle(uuid) from public,anon;
revoke execute on function public.round_phase(uuid) from public,anon;
revoke execute on function public.can_submit(uuid,text) from public,anon;
revoke execute on function public.can_store_art(text) from public,anon;
revoke execute on function public.create_circle(text,text,text) from public,anon;
revoke execute on function public.join_circle(text) from public,anon;
revoke execute on function public.ensure_daily_round(uuid) from public,anon;
revoke execute on function public.cast_vote(uuid,uuid) from public,anon;
revoke execute on function public.get_leaderboard(uuid) from public,anon;
revoke execute on function public.leave_circle(uuid) from public,anon;
revoke execute on function public.delete_circle(uuid) from public,anon;
revoke execute on function public.handle_new_user() from public,anon,authenticated;
grant execute on function public.is_circle_member(uuid), public.shares_circle(uuid),
 public.round_phase(uuid),public.can_submit(uuid,text),public.can_store_art(text),
 public.create_circle(text,text,text), public.join_circle(text),public.ensure_daily_round(uuid),
 public.cast_vote(uuid,uuid),public.get_leaderboard(uuid),public.leave_circle(uuid),
 public.delete_circle(uuid) to authenticated;

-- Optional streaming UI. The subscriber's RLS policies still apply.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.circle_members;


-- Private profile photos. Members can see photos of people in their circles;
-- the owner can see their own photo before joining a circle.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('doodl-avatars','doodl-avatars',false,5242880,
 array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy doodl_avatar_select on storage.objects for select to authenticated
using(bucket_id='doodl-avatars'
 and split_part(name,'/',1) ~* '^[0-9a-f-]{36}$'
 and (split_part(name,'/',1)=auth.uid()::text
      or public.shares_circle(split_part(name,'/',1)::uuid)));
create policy doodl_avatar_insert on storage.objects for insert to authenticated
with check(bucket_id='doodl-avatars' and split_part(name,'/',1)=auth.uid()::text);
create policy doodl_avatar_delete on storage.objects for delete to authenticated
using(bucket_id='doodl-avatars' and split_part(name,'/',1)=auth.uid()::text);

-- Sharing a combined artwork requires consent from each participating artist.
create table public.share_consents (
 round_id uuid not null references public.rounds(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 approved boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(round_id,user_id)
);
alter table public.share_consents enable row level security;
create policy share_consent_read on public.share_consents for select to authenticated
using(exists(select 1 from public.rounds r
 where r.id=round_id and public.is_circle_member(r.circle_id)));
create policy share_consent_insert on public.share_consents for insert to authenticated
with check(user_id=auth.uid()
 and exists(select 1 from public.round_parts p where p.round_id=round_id and p.user_id=auth.uid())
 and exists(select 1 from public.rounds r where r.id=round_id and public.is_circle_member(r.circle_id)));
create policy share_consent_update on public.share_consents for update to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update on public.share_consents to authenticated;
alter publication supabase_realtime add table public.share_consents;


-- Per-device, opt-in web push subscriptions, never exposed to other users.
create table public.push_subscriptions(
 endpoint text primary key check(char_length(endpoint) between 10 and 2048),
 user_id uuid not null references auth.users(id) on delete cascade,
 p256dh text not null,
 auth text not null,
 timezone text not null default 'America/New_York',
 last_sent_slot text,
 created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
create policy push_read_self on public.push_subscriptions for select to authenticated using(user_id=auth.uid());
create policy push_insert_self on public.push_subscriptions for insert to authenticated with check(user_id=auth.uid());
create policy push_update_self on public.push_subscriptions for update to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy push_delete_self on public.push_subscriptions for delete to authenticated using(user_id=auth.uid());
grant select,insert,update,delete on public.push_subscriptions to authenticated;
