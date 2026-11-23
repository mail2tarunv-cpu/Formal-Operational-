-- Doodl privacy refinement. Applied to the dedicated project as version 20261123210620.
CREATE OR REPLACE FUNCTION public.leave_circle(p_circle_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not public.is_circle_member(p_circle_id) then return; end if;
 if exists(select 1 from public.circles where id=p_circle_id and owner_id=auth.uid()) then
  raise exception 'Circle owner must delete the circle';
 end if;
 -- A departed artist must not remain opted into future collage exports.
 update public.share_consents sc set approved=false,updated_at=now()
 where sc.user_id=auth.uid()
 and exists(select 1 from public.rounds r where r.id=sc.round_id and r.circle_id=p_circle_id);
 delete from public.circle_members where circle_id=p_circle_id and user_id=auth.uid();
end; $function$

