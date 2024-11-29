alter table "public"."personas" drop column "private_knowledge";

alter table "public"."personas" drop column "public_knowledge";

alter table "public"."personas" drop column "public_perception";

alter table "public"."personas" drop column "self_perception";

alter table "public"."personas" add column "external" text;

alter table "public"."personas" add column "internal" text;

alter table "public"."personas" add column "universal" text;

alter table "public"."relations" drop column "private_description";

alter table "public"."relations" drop column "public_description";

alter table "public"."relations" add column "external" text;

alter table "public"."relations" add column "internal" text;

alter table "public"."relations" add column "universal" text;


