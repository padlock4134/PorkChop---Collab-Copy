

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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."cooking_experience_level" AS ENUM (
    'new_to_cooking',
    'home_cook',
    'kitchen_confident'
);


ALTER TYPE "public"."cooking_experience_level" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_user_xp"("user_id" "uuid", "xp_amount" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into user_xp (user_id, xp)
    values (user_id, xp_amount)
  on conflict (user_id)
    do update set xp = user_xp.xp + xp_amount;
end;
$$;


ALTER FUNCTION "public"."increment_user_xp"("user_id" "uuid", "xp_amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists(
    select 1 from profiles where id = uid and username = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text",
    "prompt" "text",
    "response" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."ai_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "buyer_id" "uuid",
    "product_id" "uuid",
    "quantity" integer DEFAULT 1,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."marketplace_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "image" "text",
    "price" numeric(10,2),
    "tags" "text"[],
    "available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."marketplace_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_sellers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "display_name" "text",
    "bio" "text",
    "avatar" "text",
    "rating" numeric(2,1)
);


ALTER TABLE "public"."marketplace_sellers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "message" "text",
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "username" "text",
    "bio" "text",
    "avatar_url" "text",
    "dietary" "jsonb",
    "cuisine" "jsonb",
    "trial_ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "xp" integer DEFAULT 0 NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "agreed_to_tos" boolean DEFAULT false NOT NULL,
    "tos_agreed_at" timestamp without time zone,
    "chat_count" integer DEFAULT 0 NOT NULL,
    "last_chat_date" "date"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" "text" NOT NULL,
    "awarded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_cookbook" (
    "user_id" "uuid" NOT NULL,
    "recipes" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_cookbook" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_kitchen" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "ingredients" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."user_kitchen" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "experience_level" "public"."cooking_experience_level" DEFAULT 'new_to_cooking'::"public"."cooking_experience_level",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_shopping_list" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "items" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."user_shopping_list" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan" "text",
    "status" "text",
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_xp" (
    "user_id" "uuid" NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."user_xp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_id" "text" NOT NULL,
    "external_tenant_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_challenge_claims" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "challenge_id" "text" NOT NULL,
    "week_number" integer NOT NULL,
    "proof_photo" "text",
    "claimed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."weekly_challenge_claims" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."weekly_challenge_claims_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."weekly_challenge_claims_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."weekly_challenge_claims_id_seq" OWNED BY "public"."weekly_challenge_claims"."id";



CREATE TABLE IF NOT EXISTS "public"."xp_activity_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "activity" "text" NOT NULL,
    "xp_awarded" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."xp_activity_log" OWNER TO "postgres";


ALTER TABLE ONLY "public"."weekly_challenge_claims" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."weekly_challenge_claims_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_logs"
    ADD CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_products"
    ADD CONSTRAINT "marketplace_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_sellers"
    ADD CONSTRAINT "marketplace_sellers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."user_cookbook"
    ADD CONSTRAINT "user_cookbook_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_kitchen"
    ADD CONSTRAINT "user_kitchen_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_kitchen"
    ADD CONSTRAINT "user_kitchen_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_shopping_list"
    ADD CONSTRAINT "user_shopping_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_xp"
    ADD CONSTRAINT "user_xp_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_external_id_key" UNIQUE ("external_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_challenge_claims"
    ADD CONSTRAINT "weekly_challenge_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_challenge_claims"
    ADD CONSTRAINT "weekly_challenge_claims_user_id_week_number_key" UNIQUE ("user_id", "week_number");



ALTER TABLE ONLY "public"."xp_activity_log"
    ADD CONSTRAINT "xp_activity_log_pkey" PRIMARY KEY ("id");



CREATE INDEX "ai_logs_user_id_idx" ON "public"."ai_logs" USING "btree" ("user_id");



CREATE INDEX "idx_user_badges_badge_id" ON "public"."user_badges" USING "btree" ("badge_id");



CREATE INDEX "idx_user_badges_user_id" ON "public"."user_badges" USING "btree" ("user_id");



CREATE INDEX "idx_user_subscriptions_user_id" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_users_external_tenant_id" ON "public"."users" USING "btree" ("external_tenant_id");



CREATE INDEX "marketplace_orders_buyer_id_idx" ON "public"."marketplace_orders" USING "btree" ("buyer_id");



CREATE INDEX "marketplace_products_seller_id_idx" ON "public"."marketplace_products" USING "btree" ("seller_id");



CREATE INDEX "notifications_user_id_idx" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "user_kitchen_user_id_idx" ON "public"."user_kitchen" USING "btree" ("user_id");



CREATE INDEX "user_shopping_list_user_id_idx" ON "public"."user_shopping_list" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."marketplace_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."marketplace_products" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."user_kitchen" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."user_shopping_list" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_user_cookbook_updated_at" BEFORE UPDATE ON "public"."user_cookbook" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ai_logs"
    ADD CONSTRAINT "ai_logs_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_buyer_id_fkey1" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."marketplace_products"("id");



ALTER TABLE ONLY "public"."marketplace_products"
    ADD CONSTRAINT "marketplace_products_seller_id_fkey1" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."marketplace_sellers"
    ADD CONSTRAINT "marketplace_sellers_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey1" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_cookbook"
    ADD CONSTRAINT "user_cookbook_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_kitchen"
    ADD CONSTRAINT "user_kitchen_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_shopping_list"
    ADD CONSTRAINT "user_shopping_list_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_xp"
    ADD CONSTRAINT "user_xp_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_challenge_claims"
    ADD CONSTRAINT "weekly_challenge_claims_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xp_activity_log"
    ADD CONSTRAINT "xp_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



CREATE POLICY "Allow users to insert their own claims" ON "public"."weekly_challenge_claims" FOR INSERT WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Allow users to manage their own claims" ON "public"."weekly_challenge_claims" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Allow users to select their own XP" ON "public"."user_xp" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Allow users to select their own claims" ON "public"."weekly_challenge_claims" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Allow users to update their own XP" ON "public"."user_xp" FOR UPDATE USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Anyone can insert into profiles" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view products" ON "public"."marketplace_products" FOR SELECT USING (true);



CREATE POLICY "Buyers can create orders" ON "public"."marketplace_orders" FOR INSERT WITH CHECK (("buyer_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Buyers can update their orders" ON "public"."marketplace_orders" FOR UPDATE USING (("buyer_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Buyers can view their orders" ON "public"."marketplace_orders" FOR SELECT USING (("buyer_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Sellers can manage their products" ON "public"."marketplace_products" USING (("seller_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Sellers can manage their profile" ON "public"."marketplace_sellers" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "User or system can insert profile" ON "public"."profiles" FOR INSERT WITH CHECK ((("id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))) OR (("auth"."jwt"() ->> 'sub'::"text") IS NULL)));



CREATE POLICY "User or trigger can insert profile" ON "public"."profiles" FOR INSERT WITH CHECK ((("id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))) OR (("auth"."jwt"() ->> 'sub'::"text") IS NULL)));



CREATE POLICY "Users can insert own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert own record" ON "public"."users" FOR INSERT WITH CHECK (("external_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can insert their AI logs" ON "public"."ai_logs" FOR INSERT WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert their notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert their own kitchen" ON "public"."user_kitchen" FOR INSERT WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert their own shopping list" ON "public"."user_shopping_list" FOR INSERT WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert their subscription" ON "public"."user_subscriptions" FOR INSERT WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can manage their own cookbook" ON "public"."user_cookbook" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text"))))) WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can read own preferences" ON "public"."user_preferences" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update own preferences" ON "public"."user_preferences" FOR UPDATE USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update own record" ON "public"."users" FOR UPDATE USING (("external_id" = ("auth"."jwt"() ->> 'sub'::"text"))) WITH CHECK (("external_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can update their notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update their own kitchen" ON "public"."user_kitchen" FOR UPDATE USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update their own shopping list" ON "public"."user_shopping_list" FOR UPDATE USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update their subscription" ON "public"."user_subscriptions" FOR UPDATE USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view own record" ON "public"."users" FOR SELECT USING (("external_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can view sellers" ON "public"."marketplace_sellers" FOR SELECT USING (true);



CREATE POLICY "Users can view their AI logs" ON "public"."ai_logs" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view their notifications" ON "public"."notifications" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view their own kitchen" ON "public"."user_kitchen" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view their own shopping list" ON "public"."user_shopping_list" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view their subscription" ON "public"."user_subscriptions" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."external_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



ALTER TABLE "public"."ai_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_sellers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_cookbook" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_kitchen" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_shopping_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_xp" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_challenge_claims" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_user_xp"("user_id" "uuid", "xp_amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_user_xp"("user_id" "uuid", "xp_amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_user_xp"("user_id" "uuid", "xp_amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."ai_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_logs" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_orders" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_orders" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_products" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_products" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_products" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_sellers" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_sellers" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_sellers" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_cookbook" TO "anon";
GRANT ALL ON TABLE "public"."user_cookbook" TO "authenticated";
GRANT ALL ON TABLE "public"."user_cookbook" TO "service_role";



GRANT ALL ON TABLE "public"."user_kitchen" TO "anon";
GRANT ALL ON TABLE "public"."user_kitchen" TO "authenticated";
GRANT ALL ON TABLE "public"."user_kitchen" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_shopping_list" TO "anon";
GRANT ALL ON TABLE "public"."user_shopping_list" TO "authenticated";
GRANT ALL ON TABLE "public"."user_shopping_list" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_xp" TO "anon";
GRANT ALL ON TABLE "public"."user_xp" TO "authenticated";
GRANT ALL ON TABLE "public"."user_xp" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_challenge_claims" TO "anon";
GRANT ALL ON TABLE "public"."weekly_challenge_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_challenge_claims" TO "service_role";



GRANT ALL ON SEQUENCE "public"."weekly_challenge_claims_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."weekly_challenge_claims_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."weekly_challenge_claims_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."xp_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."xp_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."xp_activity_log" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
