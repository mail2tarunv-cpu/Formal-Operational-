-- Doodl: align drawing clock with the daily 7 PM or quick-round deadline.
-- Applied to Doodl project as migration 20261123210316.

CREATE OR REPLACE FUNCTION public.drawing_deadline(p_round_id uuid)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select least(
    ds.started_at + ds.duration_seconds * interval '1 second',
    case when r.quick_started_at is not null then r.quick_started_at+interval '10 minutes'
         else ((r.day::timestamp + interval '19 hours') at time zone c.timezone) end
 )
 from public.drawing_sessions ds
 join public.rounds r on r.id=ds.round_id
 join public.circles c on c.id=r.circle_id
 where ds.round_id=p_round_id and ds.user_id=auth.uid()
 and public.is_circle_member(c.id)
$function$


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
 return query select public.drawing_deadline(p_round_id),ds.duration_seconds
 from public.drawing_sessions ds where ds.round_id=p_round_id and ds.user_id=auth.uid();
end; $function$


revoke execute on function public.drawing_deadline(uuid) from public,anon;
grant execute on function public.drawing_deadline(uuid) to authenticated;
