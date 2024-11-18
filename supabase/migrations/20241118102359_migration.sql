alter table "public"."relationships" drop constraint "relationships_persona1_uuid_fkey";

alter table "public"."relationships" drop constraint "relationships_persona2_uuid_fkey";

drop index if exists "public"."relationships_persona1_uuid_idx";

drop index if exists "public"."relationships_persona2_uuid_idx";

create table "public"."relationship_personas" (
    "uuid" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_uuid" uuid not null,
    "relationship_uuid" uuid not null,
    "persona_uuid" uuid not null
);


alter table "public"."relationship_personas" enable row level security;

alter table "public"."relationships" drop column "description";

alter table "public"."relationships" drop column "persona1_uuid";

alter table "public"."relationships" drop column "persona2_uuid";

alter table "public"."relationships" add column "private_description" text;

alter table "public"."relationships" add column "public_description" text;

CREATE UNIQUE INDEX relationship_members_pkey ON public.relationship_personas USING btree (uuid);

alter table "public"."relationship_personas" add constraint "relationship_members_pkey" PRIMARY KEY using index "relationship_members_pkey";

alter table "public"."relationship_personas" add constraint "relationship_members_persona_uuid_fkey" FOREIGN KEY (persona_uuid) REFERENCES personas(uuid) ON DELETE CASCADE not valid;

alter table "public"."relationship_personas" validate constraint "relationship_members_persona_uuid_fkey";

alter table "public"."relationship_personas" add constraint "relationship_members_relationship_uuid_fkey" FOREIGN KEY (relationship_uuid) REFERENCES relationships(uuid) ON DELETE CASCADE not valid;

alter table "public"."relationship_personas" validate constraint "relationship_members_relationship_uuid_fkey";

alter table "public"."relationship_personas" add constraint "relationship_members_user_uuid_fkey" FOREIGN KEY (user_uuid) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."relationship_personas" validate constraint "relationship_members_user_uuid_fkey";

grant delete on table "public"."relationship_personas" to "anon";

grant insert on table "public"."relationship_personas" to "anon";

grant references on table "public"."relationship_personas" to "anon";

grant select on table "public"."relationship_personas" to "anon";

grant trigger on table "public"."relationship_personas" to "anon";

grant truncate on table "public"."relationship_personas" to "anon";

grant update on table "public"."relationship_personas" to "anon";

grant delete on table "public"."relationship_personas" to "authenticated";

grant insert on table "public"."relationship_personas" to "authenticated";

grant references on table "public"."relationship_personas" to "authenticated";

grant select on table "public"."relationship_personas" to "authenticated";

grant trigger on table "public"."relationship_personas" to "authenticated";

grant truncate on table "public"."relationship_personas" to "authenticated";

grant update on table "public"."relationship_personas" to "authenticated";

grant delete on table "public"."relationship_personas" to "service_role";

grant insert on table "public"."relationship_personas" to "service_role";

grant references on table "public"."relationship_personas" to "service_role";

grant select on table "public"."relationship_personas" to "service_role";

grant trigger on table "public"."relationship_personas" to "service_role";

grant truncate on table "public"."relationship_personas" to "service_role";

grant update on table "public"."relationship_personas" to "service_role";

create policy "ALL for users"
on "public"."relationship_personas"
as permissive
for all
to authenticated
using ((( SELECT auth.uid() AS uid) = user_uuid))
with check ((( SELECT auth.uid() AS uid) = user_uuid));



