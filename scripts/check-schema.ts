import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL_DIRECT!;
  const pool = new Pool({ connectionString: url, max: 1 });

  const q = `
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name IN ('product_categories','units')
    ORDER BY table_name, ordinal_position;
  `;
  const { rows } = await pool.query(q);
  console.table(rows);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
