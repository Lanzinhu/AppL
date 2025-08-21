// lib/db/index.ts
import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Reusa conexões HTTP (ótimo para Next em dev/SSR)
neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL não está definida. Use a URL do pooler do Neon com ?sslmode=require."
  );
}

// --- Globals para hot-reload do Next (sem conflito de tipos) ---
declare global {
  // eslint-disable-next-line no-var
  var __neonSql: NeonQueryFunction<false, false> | undefined;
  // eslint-disable-next-line no-var
  var __drizzleDb: NeonHttpDatabase<typeof schema> | undefined;
}

// Cliente HTTP do Neon tipado com <false,false>
const _sql = neon(connectionString) as NeonQueryFunction<false, false>;
export const sql: NeonQueryFunction<false, false> =
  globalThis.__neonSql ?? _sql;

if (process.env.NODE_ENV !== "production") {
  globalThis.__neonSql = sql;
}

// Instância do Drizzle usando o driver HTTP do Neon
export const db: NeonHttpDatabase<typeof schema> =
  globalThis.__drizzleDb ?? drizzle(sql, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis.__drizzleDb = db;
}

// Tipos e re-export
export type DB = typeof db;
export { schema };
