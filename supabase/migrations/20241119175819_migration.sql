SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."assistants" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "model_uuid" "uuid" NOT NULL,
    "persona_uuid" "uuid" NOT NULL
);

ALTER TABLE "public"."assistants" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."models" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "id" "text" NOT NULL,
    "api_endpoint" "text" NOT NULL,
    "api_key" "text"
);

ALTER TABLE "public"."models" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."personas" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "self_perception" "text",
    "public_perception" "text",
    "private_knowledge" "text",
    "public_knowledge" "text"
);

ALTER TABLE "public"."personas" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."production_assistants" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "production_uuid" "uuid" NOT NULL,
    "assistant_uuid" "uuid" NOT NULL
);

ALTER TABLE "public"."production_assistants" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."production_personas" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "production_uuid" "uuid" NOT NULL,
    "persona_uuid" "uuid" NOT NULL
);

ALTER TABLE "public"."production_personas" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."production_relations" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "production_uuid" "uuid" NOT NULL,
    "relation_uuid" "uuid" NOT NULL
);

ALTER TABLE "public"."production_relations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."productions" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "name" "text",
    "world_uuid" "uuid",
    "scenario_uuid" "uuid"
);

ALTER TABLE "public"."productions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."relation_personas" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "relation_uuid" "uuid" NOT NULL,
    "persona_uuid" "uuid" NOT NULL
);

ALTER TABLE "public"."relation_personas" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."relations" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "private_description" "text",
    "public_description" "text",
    "name" "text"
);

ALTER TABLE "public"."relations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."scenarios" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);

ALTER TABLE "public"."scenarios" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."worlds" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_uuid" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);

ALTER TABLE "public"."worlds" OWNER TO "postgres";

ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."production_assistants"
    ADD CONSTRAINT "production_assistants_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."production_personas"
    ADD CONSTRAINT "production_personas_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."production_relations"
    ADD CONSTRAINT "production_relations_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."productions"
    ADD CONSTRAINT "productions_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."relation_personas"
    ADD CONSTRAINT "relation_personas_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."relations"
    ADD CONSTRAINT "relations_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."scenarios"
    ADD CONSTRAINT "scenarios_pkey" PRIMARY KEY ("uuid");
    
ALTER TABLE ONLY "public"."worlds"
    ADD CONSTRAINT "worlds_pkey" PRIMARY KEY ("uuid");
    
CREATE INDEX "idx_assistants_model_uuid" ON "public"."assistants" USING "btree" ("model_uuid");

CREATE INDEX "idx_assistants_persona_uuid" ON "public"."assistants" USING "btree" ("persona_uuid");

CREATE INDEX "idx_assistants_user_uuid" ON "public"."assistants" USING "btree" ("user_uuid");

CREATE INDEX "idx_models_user_uuid" ON "public"."models" USING "btree" ("user_uuid");

CREATE INDEX "idx_personas_user_uuid" ON "public"."personas" USING "btree" ("user_uuid");

CREATE INDEX "idx_production_assistants_assistant_uuid" ON "public"."production_assistants" USING "btree" ("assistant_uuid");

CREATE INDEX "idx_production_assistants_production_uuid" ON "public"."production_assistants" USING "btree" ("production_uuid");

CREATE INDEX "idx_production_assistants_user_uuid" ON "public"."production_assistants" USING "btree" ("user_uuid");

CREATE INDEX "idx_production_personas_persona_uuid" ON "public"."production_personas" USING "btree" ("persona_uuid");

CREATE INDEX "idx_production_personas_production_uuid" ON "public"."production_personas" USING "btree" ("production_uuid");

CREATE INDEX "idx_production_personas_user_uuid" ON "public"."production_personas" USING "btree" ("user_uuid");

CREATE INDEX "idx_production_relations_production_uuid" ON "public"."production_relations" USING "btree" ("production_uuid");

CREATE INDEX "idx_production_relations_relation_uuid" ON "public"."production_relations" USING "btree" ("relation_uuid");

CREATE INDEX "idx_production_relations_user_uuid" ON "public"."production_relations" USING "btree" ("user_uuid");

CREATE INDEX "idx_productions_scenario_uuid" ON "public"."productions" USING "btree" ("scenario_uuid");

CREATE INDEX "idx_productions_user_uuid" ON "public"."productions" USING "btree" ("user_uuid");

CREATE INDEX "idx_productions_world_uuid" ON "public"."productions" USING "btree" ("world_uuid");

CREATE INDEX "idx_relation_personas_persona_uuid" ON "public"."relation_personas" USING "btree" ("persona_uuid");

CREATE INDEX "idx_relation_personas_relation_uuid" ON "public"."relation_personas" USING "btree" ("relation_uuid");

CREATE INDEX "idx_relation_personas_user_uuid" ON "public"."relation_personas" USING "btree" ("user_uuid");

CREATE INDEX "idx_relations_user_uuid" ON "public"."relations" USING "btree" ("user_uuid");

CREATE INDEX "idx_scenarios_user_uuid" ON "public"."scenarios" USING "btree" ("user_uuid");

CREATE INDEX "idx_worlds_user_uuid" ON "public"."worlds" USING "btree" ("user_uuid");

ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_model_id_fkey" FOREIGN KEY ("model_uuid") REFERENCES "public"."models"("uuid") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_persona_id_fkey" FOREIGN KEY ("persona_uuid") REFERENCES "public"."personas"("uuid") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_user_id_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_user_id_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_user_id_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."production_assistants"
    ADD CONSTRAINT "production_assistants_assistant_uuid_fkey" FOREIGN KEY ("assistant_uuid") REFERENCES "public"."assistants"("uuid") ON DELETE SET NULL;
    
ALTER TABLE ONLY "public"."production_assistants"
    ADD CONSTRAINT "production_assistants_production_uuid_fkey" FOREIGN KEY ("production_uuid") REFERENCES "public"."productions"("uuid") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."production_assistants"
    ADD CONSTRAINT "production_assistants_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."production_personas"
    ADD CONSTRAINT "production_personas_persona_uuid_fkey" FOREIGN KEY ("persona_uuid") REFERENCES "public"."personas"("uuid") ON DELETE SET NULL;
    
ALTER TABLE ONLY "public"."production_personas"
    ADD CONSTRAINT "production_personas_production_uuid_fkey" FOREIGN KEY ("production_uuid") REFERENCES "public"."productions"("uuid") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."production_personas"
    ADD CONSTRAINT "production_personas_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."production_relations"
    ADD CONSTRAINT "production_relations_relation_uuid_fkey" FOREIGN KEY ("relation_uuid") REFERENCES "public"."relations"("uuid") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."production_relations"
    ADD CONSTRAINT "production_relations_production_uuid_fkey" FOREIGN KEY ("production_uuid") REFERENCES "public"."productions"("uuid") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."production_relations"
    ADD CONSTRAINT "production_relations_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."productions"
    ADD CONSTRAINT "productions_scenario_uuid_fkey" FOREIGN KEY ("scenario_uuid") REFERENCES "public"."scenarios"("uuid") ON DELETE SET NULL;
    
ALTER TABLE ONLY "public"."productions"
    ADD CONSTRAINT "productions_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."productions"
    ADD CONSTRAINT "productions_world_uuid_fkey" FOREIGN KEY ("world_uuid") REFERENCES "public"."worlds"("uuid") ON DELETE SET NULL;
    
ALTER TABLE ONLY "public"."relation_personas"
    ADD CONSTRAINT "relation_personas_persona_uuid_fkey" FOREIGN KEY ("persona_uuid") REFERENCES "public"."personas"("uuid") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."relation_personas"
    ADD CONSTRAINT "relation_personas_relation_uuid_fkey" FOREIGN KEY ("relation_uuid") REFERENCES "public"."relations"("uuid") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."relation_personas"
    ADD CONSTRAINT "relation_personas_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."relations"
    ADD CONSTRAINT "relations_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."scenarios"
    ADD CONSTRAINT "scenarios_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
ALTER TABLE ONLY "public"."worlds"
    ADD CONSTRAINT "worlds_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    
CREATE POLICY "ALL for users" ON "public"."assistants" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."models" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."personas" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."production_assistants" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."production_personas" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."production_relations" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."productions" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."relation_personas" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."relations" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."scenarios" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

CREATE POLICY "ALL for users" ON "public"."worlds" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_uuid"));

ALTER TABLE "public"."assistants" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."models" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."personas" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."production_assistants" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."production_personas" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."production_relations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."productions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."relation_personas" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."relations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."scenarios" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."worlds" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "public"."assistants" TO "anon";
GRANT ALL ON TABLE "public"."assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."assistants" TO "service_role";

GRANT ALL ON TABLE "public"."models" TO "anon";
GRANT ALL ON TABLE "public"."models" TO "authenticated";
GRANT ALL ON TABLE "public"."models" TO "service_role";

GRANT ALL ON TABLE "public"."personas" TO "anon";
GRANT ALL ON TABLE "public"."personas" TO "authenticated";
GRANT ALL ON TABLE "public"."personas" TO "service_role";

GRANT ALL ON TABLE "public"."production_assistants" TO "anon";
GRANT ALL ON TABLE "public"."production_assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."production_assistants" TO "service_role";

GRANT ALL ON TABLE "public"."production_personas" TO "anon";
GRANT ALL ON TABLE "public"."production_personas" TO "authenticated";
GRANT ALL ON TABLE "public"."production_personas" TO "service_role";

GRANT ALL ON TABLE "public"."production_relations" TO "anon";
GRANT ALL ON TABLE "public"."production_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."production_relations" TO "service_role";

GRANT ALL ON TABLE "public"."productions" TO "anon";
GRANT ALL ON TABLE "public"."productions" TO "authenticated";
GRANT ALL ON TABLE "public"."productions" TO "service_role";

GRANT ALL ON TABLE "public"."relation_personas" TO "anon";
GRANT ALL ON TABLE "public"."relation_personas" TO "authenticated";
GRANT ALL ON TABLE "public"."relation_personas" TO "service_role";

GRANT ALL ON TABLE "public"."relations" TO "anon";
GRANT ALL ON TABLE "public"."relations" TO "authenticated";
GRANT ALL ON TABLE "public"."relations" TO "service_role";

GRANT ALL ON TABLE "public"."scenarios" TO "anon";
GRANT ALL ON TABLE "public"."scenarios" TO "authenticated";
GRANT ALL ON TABLE "public"."scenarios" TO "service_role";

GRANT ALL ON TABLE "public"."worlds" TO "anon";
GRANT ALL ON TABLE "public"."worlds" TO "authenticated";
GRANT ALL ON TABLE "public"."worlds" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
--
-- Dumped schema changes for auth and storage
--
