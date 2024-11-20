CREATE INDEX idx_turns_parent_turn_uuid ON public.turns USING btree (parent_turn_uuid);

CREATE INDEX idx_turns_production_uuid ON public.turns USING btree (production_uuid);

CREATE INDEX idx_turns_user_uuid ON public.turns USING btree (user_uuid);

create policy "ALL for users"
on "public"."turns"
as permissive
for all
to authenticated
using ((( SELECT auth.uid() AS uid) = user_uuid))
with check ((( SELECT auth.uid() AS uid) = user_uuid));



