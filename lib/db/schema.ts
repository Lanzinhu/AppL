// lib/db/schema.ts
import {
  pgTable, serial, text, varchar, boolean, integer, numeric,
  timestamp, uuid, pgEnum, uniqueIndex, index, primaryKey
} from "drizzle-orm/pg-core";

/* ========= Enums ========= */
export const roleEnum         = pgEnum("role", ["ADMIN","INVENTORY","SALES","PURCHASES","MANUFACTURING","FINANCE","QUALITY"]);
export const partnerTypeEnum  = pgEnum("partner_type", ["CUSTOMER","SUPPLIER","BOTH"]);
export const locationTypeEnum = pgEnum("location_type", ["RECEIVING","STOCK","PRODUCTION","QUALITY","SHIPPING","VIRTUAL"]);
export const lotStatusEnum    = pgEnum("lot_status", ["FREE","QUARANTINE","BLOCKED","CONSUMED"]);
export const moveTypeEnum     = pgEnum("move_type", ["IN","OUT","TRANSFER"]);
export const moveReasonEnum   = pgEnum("move_reason", ["PURCHASE","SALE","PRODUCTION","ADJUSTMENT","TRANSFER","RETURN","QUALITY","OTHER"]);

/* ========= Usuários / RBAC ========= */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }),
  email: varchar("email", { length: 190 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: roleEnum("name").notNull().unique(),
  description: text("description"),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    roleId: integer("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId] }),
  })
);

/* ========= Cadastros ========= */
// UNIDADES
export const units = pgTable(
  "units",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),                 // ex: Frasco, Litro
    abbreviation: varchar("abbreviation", { length: 16 }).notNull(), // ex: FR, L, KG, CX
    description: varchar("description", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    abbrUq: uniqueIndex("units_abbreviation_uq").on(t.abbreviation),
    nameUq: uniqueIndex("units_name_uq").on(t.name),
  })
);

// CATEGORIAS DE PRODUTO
export const productCategories = pgTable(
  "product_categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    color: varchar("color", { length: 12 }), // "emerald", "#00A884", etc.
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    nameUq: uniqueIndex("product_categories_name_uq").on(t.name),
  })
);

// Alias usado nas páginas (/settings)
export { productCategories as categories };

export const partners = pgTable(
  "partners",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    type: partnerTypeEnum("type").notNull().default("BOTH"),
    taxId: varchar("tax_id", { length: 32 }), // CNPJ/CPF
    email: varchar("email", { length: 190 }),
    phone: varchar("phone", { length: 40 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    nameIdx: index("partners_name_idx").on(t.name),
  })
);

/* ========= Produtos ========= */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    sku: varchar("sku", { length: 64 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    categoryId: integer("category_id").references(() => productCategories.id, { onDelete: "set null" }),
    uomId: integer("uom_id").references(() => units.id, { onDelete: "restrict" }).notNull(),
    barcode: varchar("barcode", { length: 64 }),
    trackByLot: boolean("track_by_lot").notNull().default(true),
    shelfLifeDays: integer("shelf_life_days"),
    standardCost: numeric("standard_cost", { precision: 14, scale: 4 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    skuUq: uniqueIndex("products_sku_uq").on(t.sku),
    nameIdx: index("products_name_idx").on(t.name),
  })
);

/* ========= Locais de Estoque ========= */
export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),  // ex: RECEB, ESTOQ, PROD, QUALI, EXPED
    name: varchar("name", { length: 120 }).notNull(),
    type: locationTypeEnum("type").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => ({
    codeUq: uniqueIndex("locations_code_uq").on(t.code),
  })
);

/* ========= Lotes ========= */
export const lots = pgTable(
  "lots",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    code: varchar("code", { length: 64 }).notNull(), // ex: L240801
    mfgDate: timestamp("mfg_date"),
    expDate: timestamp("exp_date"),
    status: lotStatusEnum("status").notNull().default("FREE"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uq: uniqueIndex("lots_product_code_uq").on(t.productId, t.code),
    codeIdx: index("lots_code_idx").on(t.code),
  })
);

/* ========= Movimentos de Estoque (ledger) ========= */
export const stockMoves = pgTable(
  "stock_moves",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "restrict" }).notNull(),
    lotId: integer("lot_id").references(() => lots.id, { onDelete: "set null" }), // null se não rastreia por lote
    uomId: integer("uom_id").references(() => units.id, { onDelete: "restrict" }).notNull(),
    qty: numeric("qty", { precision: 14, scale: 6 }).notNull(), // + entrada, - saída
    moveType: moveTypeEnum("move_type").notNull(),
    reason: moveReasonEnum("reason").notNull().default("OTHER"),
    fromLocationId: integer("from_location_id").references(() => locations.id, { onDelete: "set null" }),
    toLocationId: integer("to_location_id").references(() => locations.id, { onDelete: "set null" }),
    partnerId: integer("partner_id").references(() => partners.id, { onDelete: "set null" }),
    documentRef: varchar("document_ref", { length: 128 }), // ex: PO-0001, SO-0005, OP-0012
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    productIdx: index("stock_moves_product_idx").on(t.productId),
    lotIdx: index("stock_moves_lot_idx").on(t.lotId),
    locIdx: index("stock_moves_loc_idx").on(t.fromLocationId, t.toLocationId),
    docIdx: index("stock_moves_doc_idx").on(t.documentRef),
  })
);

/* ========= Tasks (para app/tasks) ========= */
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    createdIdx: index("tasks_created_idx").on(t.createdAt),
    completedIdx: index("tasks_completed_idx").on(t.completed),
  })
);
