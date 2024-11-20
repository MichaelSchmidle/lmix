create table "public"."turns" (
    "uuid" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_uuid" uuid not null,
    "production_uuid" uuid not null,
    "parent_turn_uuid" uuid,
    "message" jsonb not null
);


alter table "public"."turns" enable row level security;

CREATE UNIQUE INDEX turns_pkey ON public.turns USING btree (uuid);

alter table "public"."turns" add constraint "turns_pkey" PRIMARY KEY using index "turns_pkey";

alter table "public"."turns" add constraint "turns_parent_turn_uuid_fkey" FOREIGN KEY (parent_turn_uuid) REFERENCES turns(uuid) ON DELETE CASCADE not valid;

alter table "public"."turns" validate constraint "turns_parent_turn_uuid_fkey";

alter table "public"."turns" add constraint "turns_production_uuid_fkey" FOREIGN KEY (production_uuid) REFERENCES productions(uuid) ON DELETE CASCADE not valid;

alter table "public"."turns" validate constraint "turns_production_uuid_fkey";

alter table "public"."turns" add constraint "turns_user_uuid_fkey" FOREIGN KEY (user_uuid) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."turns" validate constraint "turns_user_uuid_fkey";

grant delete on table "public"."turns" to "anon";

grant insert on table "public"."turns" to "anon";

grant references on table "public"."turns" to "anon";

grant select on table "public"."turns" to "anon";

grant trigger on table "public"."turns" to "anon";

grant truncate on table "public"."turns" to "anon";

grant update on table "public"."turns" to "anon";

grant delete on table "public"."turns" to "authenticated";

grant insert on table "public"."turns" to "authenticated";

grant references on table "public"."turns" to "authenticated";

grant select on table "public"."turns" to "authenticated";

grant trigger on table "public"."turns" to "authenticated";

grant truncate on table "public"."turns" to "authenticated";

grant update on table "public"."turns" to "authenticated";

grant delete on table "public"."turns" to "service_role";

grant insert on table "public"."turns" to "service_role";

grant references on table "public"."turns" to "service_role";

grant select on table "public"."turns" to "service_role";

grant trigger on table "public"."turns" to "service_role";

grant truncate on table "public"."turns" to "service_role";

grant update on table "public"."turns" to "service_role";


