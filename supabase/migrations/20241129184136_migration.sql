create policy "ALL for users (own folder) e5fxk7_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'persona_avatars'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "ALL for users (own folder) e5fxk7_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'persona_avatars'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "ALL for users (own folder) e5fxk7_2"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'persona_avatars'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));


create policy "ALL for users (own folder) e5fxk7_3"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'persona_avatars'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



