create table "public"."production_persona_evolutions" (
    "uuid" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_uuid" uuid not null,
    "production_uuid" uuid not null,
    "persona_uuid" uuid not null,
    "self_perception" text,
    "private_knowledge" text,
    "note_to_self" text
);


alter table "public"."production_persona_evolutions" enable row level security;

alter table "public"."turns" add column "sender_persona_name" text not null;

CREATE UNIQUE INDEX production_assistants_production_assistant_unique ON public.production_assistants USING btree (production_uuid, assistant_uuid);

CREATE UNIQUE INDEX production_persona_evolutions_pkey ON public.production_persona_evolutions USING btree (uuid);

CREATE UNIQUE INDEX production_persona_evolutions_unique ON public.production_persona_evolutions USING btree (production_uuid, persona_uuid, created_at);

CREATE UNIQUE INDEX production_personas_production_persona_unique ON public.production_personas USING btree (production_uuid, persona_uuid);

CREATE UNIQUE INDEX production_relations_production_relation_unique ON public.production_relations USING btree (production_uuid, relation_uuid);

CREATE UNIQUE INDEX relation_personas_relation_persona_unique ON public.relation_personas USING btree (relation_uuid, persona_uuid);

CREATE UNIQUE INDEX turns_production_created_unique ON public.turns USING btree (production_uuid, created_at);

alter table "public"."production_persona_evolutions" add constraint "production_persona_evolutions_pkey" PRIMARY KEY using index "production_persona_evolutions_pkey";

alter table "public"."production_assistants" add constraint "production_assistants_production_assistant_unique" UNIQUE using index "production_assistants_production_assistant_unique";

alter table "public"."production_persona_evolutions" add constraint "production_persona_evolutions_persona_uuid_fkey" FOREIGN KEY (persona_uuid) REFERENCES personas(uuid) ON DELETE CASCADE not valid;

alter table "public"."production_persona_evolutions" validate constraint "production_persona_evolutions_persona_uuid_fkey";

alter table "public"."production_persona_evolutions" add constraint "production_persona_evolutions_prouction_uuid_fkey" FOREIGN KEY (production_uuid) REFERENCES productions(uuid) ON DELETE CASCADE not valid;

alter table "public"."production_persona_evolutions" validate constraint "production_persona_evolutions_prouction_uuid_fkey";

alter table "public"."production_persona_evolutions" add constraint "production_persona_evolutions_unique" UNIQUE using index "production_persona_evolutions_unique";

alter table "public"."production_persona_evolutions" add constraint "production_persona_evolutions_user_uuid_fkey" FOREIGN KEY (user_uuid) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."production_persona_evolutions" validate constraint "production_persona_evolutions_user_uuid_fkey";

alter table "public"."production_personas" add constraint "production_personas_production_persona_unique" UNIQUE using index "production_personas_production_persona_unique";

alter table "public"."production_relations" add constraint "production_relations_production_relation_unique" UNIQUE using index "production_relations_production_relation_unique";

alter table "public"."relation_personas" add constraint "relation_personas_relation_persona_unique" UNIQUE using index "relation_personas_relation_persona_unique";

alter table "public"."turns" add constraint "turns_production_created_unique" UNIQUE using index "turns_production_created_unique";

grant delete on table "public"."production_persona_evolutions" to "anon";

grant insert on table "public"."production_persona_evolutions" to "anon";

grant references on table "public"."production_persona_evolutions" to "anon";

grant select on table "public"."production_persona_evolutions" to "anon";

grant trigger on table "public"."production_persona_evolutions" to "anon";

grant truncate on table "public"."production_persona_evolutions" to "anon";

grant update on table "public"."production_persona_evolutions" to "anon";

grant delete on table "public"."production_persona_evolutions" to "authenticated";

grant insert on table "public"."production_persona_evolutions" to "authenticated";

grant references on table "public"."production_persona_evolutions" to "authenticated";

grant select on table "public"."production_persona_evolutions" to "authenticated";

grant trigger on table "public"."production_persona_evolutions" to "authenticated";

grant truncate on table "public"."production_persona_evolutions" to "authenticated";

grant update on table "public"."production_persona_evolutions" to "authenticated";

grant delete on table "public"."production_persona_evolutions" to "service_role";

grant insert on table "public"."production_persona_evolutions" to "service_role";

grant references on table "public"."production_persona_evolutions" to "service_role";

grant select on table "public"."production_persona_evolutions" to "service_role";

grant trigger on table "public"."production_persona_evolutions" to "service_role";

grant truncate on table "public"."production_persona_evolutions" to "service_role";

grant update on table "public"."production_persona_evolutions" to "service_role";


