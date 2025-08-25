CREATE TABLE "assistants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"persona_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_unique_persona_name_per_user";--> statement-breakpoint
ALTER TABLE "assistants" ADD CONSTRAINT "assistants_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistants" ADD CONSTRAINT "assistants_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unique_assistant_per_user" ON "assistants" USING btree ("user_id","persona_id","model_id");