import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function main() {
  const url = process.env.DATABASE_URL_DIRECT;
  if (!url) throw new Error("DATABASE_URL_DIRECT não está definida.");

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("✅ Migrações aplicadas com sucesso");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
