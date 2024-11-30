alter table "public"."productions" add column "show_directives" boolean not null default true;

alter table "public"."turns" add column "is_directive" boolean default true;


