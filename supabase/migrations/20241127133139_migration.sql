alter table "public"."turns" add column "assistant_uuid" uuid;

CREATE INDEX idx_production_persona_evolutions_persona ON public.production_persona_evolutions USING btree (persona_uuid);

CREATE INDEX idx_production_persona_evolutions_production ON public.production_persona_evolutions USING btree (production_uuid);

CREATE INDEX idx_production_persona_evolutions_user ON public.production_persona_evolutions USING btree (user_uuid);

CREATE INDEX idx_turns_assistant_uuid ON public.turns USING btree (assistant_uuid);

alter table "public"."turns" add constraint "turns_assistant_uuid_fkey" FOREIGN KEY (assistant_uuid) REFERENCES assistants(uuid) ON DELETE SET NULL not valid;

alter table "public"."turns" validate constraint "turns_assistant_uuid_fkey";


