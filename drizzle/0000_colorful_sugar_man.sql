/* =========================
   ENUMs (cria só se faltar)
   ========================= */
DO $do$
BEGIN
  CREATE TYPE "public"."location_type" AS ENUM('RECEIVING','STOCK','PRODUCTION','QUALITY','SHIPPING','VIRTUAL');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  CREATE TYPE "public"."lot_status" AS ENUM('FREE','QUARANTINE','BLOCKED','CONSUMED');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  CREATE TYPE "public"."move_reason" AS ENUM('PURCHASE','SALE','PRODUCTION','ADJUSTMENT','TRANSFER','RETURN','QUALITY','OTHER');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  CREATE TYPE "public"."move_type" AS ENUM('IN','OUT','TRANSFER');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  CREATE TYPE "public"."partner_type" AS ENUM('CUSTOMER','SUPPLIER','BOTH');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  CREATE TYPE "public"."role" AS ENUM('ADMIN','INVENTORY','SALES','PURCHASES','MANUFACTURING','FINANCE','QUALITY');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint


/* =========================
   Tabelas base (IF NOT EXISTS)
   ========================= */
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(120),
  "email" varchar(190) NOT NULL UNIQUE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "roles" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" "role" NOT NULL UNIQUE,
  "description" text
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id" uuid NOT NULL,
  "role_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "units" (
  "id" serial PRIMARY KEY NOT NULL
  -- colunas serão ajustadas abaixo
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "product_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL
  -- colunas serão ajustadas abaixo
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "partners" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(180) NOT NULL,
  "type" "partner_type" DEFAULT 'BOTH' NOT NULL,
  "tax_id" varchar(32),
  "email" varchar(190),
  "phone" varchar(40),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "locations" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(32) NOT NULL,
  "name" varchar(120) NOT NULL,
  "type" "location_type" NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "sku" varchar(64) NOT NULL,
  "name" varchar(180) NOT NULL,
  "category_id" integer,
  "uom_id" integer NOT NULL,
  "barcode" varchar(64),
  "track_by_lot" boolean DEFAULT true NOT NULL,
  "shelf_life_days" integer,
  "standard_cost" numeric(14,4) DEFAULT '0' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "lots" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL,
  "code" varchar(64) NOT NULL,
  "mfg_date" timestamp,
  "exp_date" timestamp,
  "status" "lot_status" DEFAULT 'FREE' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "stock_moves" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL,
  "lot_id" integer,
  "uom_id" integer NOT NULL,
  "qty" numeric(14,6) NOT NULL,
  "move_type" "move_type" NOT NULL,
  "reason" "move_reason" DEFAULT 'OTHER' NOT NULL,
  "from_location_id" integer,
  "to_location_id" integer,
  "partner_id" integer,
  "document_ref" varchar(128),
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

/* Opcional/útil: Tabela TASKS para app/tasks */
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(200) NOT NULL,
  "completed" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint


/* =========================
   FKs (idempotentes)
   ========================= */
DO $do$
BEGIN
  ALTER TABLE "user_roles"
    ADD CONSTRAINT "user_roles_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "user_roles"
    ADD CONSTRAINT "user_roles_role_id_roles_id_fk"
    FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "products"
    ADD CONSTRAINT "products_category_id_product_categories_id_fk"
    FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "products"
    ADD CONSTRAINT "products_uom_id_units_id_fk"
    FOREIGN KEY ("uom_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "lots"
    ADD CONSTRAINT "lots_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "stock_moves"
    ADD CONSTRAINT "stock_moves_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "stock_moves"
    ADD CONSTRAINT "stock_moves_lot_id_lots_id_fk"
    FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "stock_moves"
    ADD CONSTRAINT "stock_moves_uom_id_units_id_fk"
    FOREIGN KEY ("uom_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "stock_moves"
    ADD CONSTRAINT "stock_moves_from_location_id_locations_id_fk"
    FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "stock_moves"
    ADD CONSTRAINT "stock_moves_to_location_id_locations_id_fk"
    FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "stock_moves"
    ADD CONSTRAINT "stock_moves_partner_id_partners_id_fk"
    FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint

DO $do$
BEGIN
  ALTER TABLE "stock_moves"
    ADD CONSTRAINT "stock_moves_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$do$;
--> statement-breakpoint


/* =========================
   Índices (idempotentes)
   ========================= */
CREATE UNIQUE INDEX IF NOT EXISTS "locations_code_uq"          ON "locations" ("code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lots_product_code_uq"       ON "lots" ("product_id","code");
--> statement-breakpoint
CREATE INDEX       IF NOT EXISTS "lots_code_idx"               ON "lots" ("code");
--> statement-breakpoint
CREATE INDEX       IF NOT EXISTS "partners_name_idx"           ON "partners" ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_categories_name_uq" ON "product_categories" ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_uq"            ON "products" ("sku");
--> statement-breakpoint
CREATE INDEX       IF NOT EXISTS "products_name_idx"           ON "products" ("name");
--> statement-breakpoint
CREATE INDEX       IF NOT EXISTS "stock_moves_product_idx"     ON "stock_moves" ("product_id");
--> statement-breakpoint
CREATE INDEX       IF NOT EXISTS "stock_moves_lot_idx"         ON "stock_moves" ("lot_id");
--> statement-breakpoint
CREATE INDEX       IF NOT EXISTS "stock_moves_loc_idx"         ON "stock_moves" ("from_location_id","to_location_id");
--> statement-breakpoint
CREATE INDEX       IF NOT EXISTS "stock_moves_doc_idx"         ON "stock_moves" ("document_ref");
--> statement-breakpoint


/* =========================
   Ajustes para alinhar ao schema atual
   ========================= */

-- product_categories: novas colunas
DO $do$
BEGIN
  ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "color"       varchar(12);
  ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "description" text;
  ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "created_at"  timestamptz DEFAULT now() NOT NULL;
  ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "updated_at"  timestamptz DEFAULT now() NOT NULL;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END
$do$;
--> statement-breakpoint

-- units: adicionar colunas novas
DO $do$
BEGIN
  ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "name"         varchar(50);
  ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "abbreviation" varchar(16);
  ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "description"  varchar(120);
  ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "created_at"   timestamptz DEFAULT now() NOT NULL;
  ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "updated_at"   timestamptz DEFAULT now() NOT NULL;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END
$do$;
--> statement-breakpoint

-- units: migra dados de code -> abbreviation (se ambas existirem)
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='abbreviation')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='code') THEN
    EXECUTE 'UPDATE "units" SET "abbreviation" = COALESCE("abbreviation","code") WHERE "abbreviation" IS NULL';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN undefined_column THEN
    NULL;
END
$do$;
--> statement-breakpoint

-- units: preenche name a partir da abbreviation (se necessário)
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='name')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='abbreviation') THEN
    EXECUTE $SQL$
      UPDATE "units"
      SET "name" = COALESCE(
        "name",
        CASE
          WHEN COALESCE("abbreviation",'')='UN' THEN 'Unidade'
          WHEN COALESCE("abbreviation",'')='CX' THEN 'Caixa'
          WHEN COALESCE("abbreviation",'')='FR' THEN 'Frasco'
          WHEN COALESCE("abbreviation",'')='L'  THEN 'Litro'
          WHEN COALESCE("abbreviation",'')='KG' THEN 'Quilo'
          ELSE 'Unidade'
        END
      )
      WHERE "name" IS NULL
    $SQL$;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN undefined_column THEN
    NULL;
END
$do$;
--> statement-breakpoint

-- units: NOT NULL apenas se colunas existirem
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='name') THEN
    EXECUTE 'ALTER TABLE "units" ALTER COLUMN "name" SET NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='abbreviation') THEN
    EXECUTE 'ALTER TABLE "units" ALTER COLUMN "abbreviation" SET NOT NULL';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN undefined_column THEN
    NULL;
END
$do$;
--> statement-breakpoint

-- units: drop índice antigo e cria novos
DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='units_code_uq'
  ) THEN
    EXECUTE 'DROP INDEX "public"."units_code_uq"';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='abbreviation') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "units_abbreviation_uq" ON "units" ("abbreviation")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='name') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "units_name_uq" ON "units" ("name")';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END
$do$;
--> statement-breakpoint

-- units: remove coluna antiga code, se existir
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='code') THEN
    EXECUTE 'ALTER TABLE "units" DROP COLUMN "code"';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN undefined_column THEN
    NULL;
END
$do$;
--> statement-breakpoint
