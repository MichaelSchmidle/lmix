CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"api_endpoint" text NOT NULL,
	"api_key" text,
	"model_id" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"universal_truth" text,
	"internal_truth" text,
	"external_truth" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_one_default_model_per_user" ON "models" USING btree ("user_id") WHERE "models"."is_default" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unique_model_per_user" ON "models" USING btree ("user_id","model_id","api_endpoint");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unique_persona_name_per_user" ON "personas" USING btree ("user_id","name");