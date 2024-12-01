drop policy "ALL for users" on "public"."production_persona_evolutions";

revoke delete on table "public"."production_persona_evolutions" from "anon";

revoke insert on table "public"."production_persona_evolutions" from "anon";

revoke references on table "public"."production_persona_evolutions" from "anon";

revoke select on table "public"."production_persona_evolutions" from "anon";

revoke trigger on table "public"."production_persona_evolutions" from "anon";

revoke truncate on table "public"."production_persona_evolutions" from "anon";

revoke update on table "public"."production_persona_evolutions" from "anon";

revoke delete on table "public"."production_persona_evolutions" from "authenticated";

revoke insert on table "public"."production_persona_evolutions" from "authenticated";

revoke references on table "public"."production_persona_evolutions" from "authenticated";

revoke select on table "public"."production_persona_evolutions" from "authenticated";

revoke trigger on table "public"."production_persona_evolutions" from "authenticated";

revoke truncate on table "public"."production_persona_evolutions" from "authenticated";

revoke update on table "public"."production_persona_evolutions" from "authenticated";

revoke delete on table "public"."production_persona_evolutions" from "service_role";

revoke insert on table "public"."production_persona_evolutions" from "service_role";

revoke references on table "public"."production_persona_evolutions" from "service_role";

revoke select on table "public"."production_persona_evolutions" from "service_role";

revoke trigger on table "public"."production_persona_evolutions" from "service_role";

revoke truncate on table "public"."production_persona_evolutions" from "service_role";

revoke update on table "public"."production_persona_evolutions" from "service_role";

alter table "public"."production_persona_evolutions" drop constraint "production_persona_evolutions_persona_uuid_fkey";

alter table "public"."production_persona_evolutions" drop constraint "production_persona_evolutions_prouction_uuid_fkey";

alter table "public"."production_persona_evolutions" drop constraint "production_persona_evolutions_unique";

alter table "public"."production_persona_evolutions" drop constraint "production_persona_evolutions_user_uuid_fkey";

alter table "public"."production_assistants" drop constraint "production_assistants_assistant_uuid_fkey";

alter table "public"."production_persona_evolutions" drop constraint "production_persona_evolutions_pkey";

drop index if exists "public"."idx_production_persona_evolutions_persona";

drop index if exists "public"."idx_production_persona_evolutions_production";

drop index if exists "public"."idx_production_persona_evolutions_user";

drop index if exists "public"."production_persona_evolutions_pkey";

drop index if exists "public"."production_persona_evolutions_unique";

drop table "public"."production_persona_evolutions";

alter table "public"."turns" alter column "is_directive" set default false;

alter table "public"."production_assistants" add constraint "production_assistants_assistant_uuid_fkey" FOREIGN KEY (assistant_uuid) REFERENCES assistants(uuid) ON DELETE CASCADE not valid;

alter table "public"."production_assistants" validate constraint "production_assistants_assistant_uuid_fkey";


