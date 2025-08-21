import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { units, categories } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const url = process.env.DATABASE_URL_DIRECT;
  if (!url) throw new Error("DATABASE_URL_DIRECT não está definida.");

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool);

  // UNIDADES (upsert por name)
  const defaultUnits = [
    { name: "Unidade", abbreviation: "UN", description: "Unidade" },
    { name: "Caixa", abbreviation: "CX", description: "Caixa" },
    { name: "Frasco", abbreviation: "FR", description: "Frasco" },
    { name: "Litro", abbreviation: "L", description: "Litros" },
    { name: "Quilo", abbreviation: "KG", description: "Quilos" },
  ];

  for (const u of defaultUnits) {
    // se existe, atualiza; senão, insere
    const found = await db
      .select()
      .from(units)
      .where(eq(units.name, u.name))
      .limit(1);

    if (found.length) {
      await db
        .update(units)
        .set({
          abbreviation: u.abbreviation,
          description: u.description,
          updatedAt: new Date(),
        })
        .where(eq(units.id, found[0].id));
    } else {
      await db.insert(units).values(u);
    }
  }

  // CATEGORIAS (upsert por name)
  const defaultCategories = [
    { name: "Higiene", color: "sky", description: "Produtos de higiene" },
    { name: "Limpeza", color: "emerald", description: "Produtos de limpeza" },
    { name: "Perfumaria", color: "fuchsia", description: "Perfumaria" },
    { name: "Acessórios", color: "amber", description: "Acessórios" },
  ];

  for (const c of defaultCategories) {
    const found = await db
      .select()
      .from(categories)
      .where(eq(categories.name, c.name))
      .limit(1);

    if (found.length) {
      await db
        .update(categories)
        .set({
          color: c.color,
          description: c.description,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, found[0].id));
    } else {
      await db.insert(categories).values(c);
    }
  }

  await pool.end();
  console.log("✅ Seed concluído");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});






