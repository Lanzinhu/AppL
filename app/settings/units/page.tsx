// app/settings/page.tsx
import { db } from "@/lib/db";
import { categories, units } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";

/** ========= Validators ========= */
const unitSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50),
  abbreviation: z.string().min(1, "Sigla é obrigatória").max(10),
  description: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(60),
  color: z.string().optional(),
  description: z.string().optional(),
});

/** ========= Server Actions: Units ========= */
export async function createUnit(formData: FormData) {
  "use server";
  const parsed = unitSchema.parse({
    name: String(formData.get("name") || ""),
    abbreviation: String(formData.get("abbreviation") || ""),
    description: String(formData.get("description") || ""),
  });

  // upsert por "name"
  const existing = await db
    .select()
    .from(units)
    .where(eq(units.name, parsed.name))
    .limit(1);

  if (existing.length) {
    await db
      .update(units)
      .set({
        abbreviation: parsed.abbreviation,
        description: parsed.description,
        updatedAt: new Date(),
      })
      .where(eq(units.id, existing[0].id));
  } else {
    await db.insert(units).values(parsed);
  }

  revalidatePath("/settings");
}

export async function updateUnit(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const parsed = unitSchema.parse({
    name: String(formData.get("name") || ""),
    abbreviation: String(formData.get("abbreviation") || ""),
    description: String(formData.get("description") || ""),
  });

  await db
    .update(units)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(units.id, id));

  revalidatePath("/settings");
}

export async function deleteUnit(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  await db.delete(units).where(eq(units.id, id));
  revalidatePath("/settings");
}

/** ========= Server Actions: Categories ========= */
export async function createCategory(formData: FormData) {
  "use server";
  const parsed = categorySchema.parse({
    name: String(formData.get("name") || ""),
    color: String(formData.get("color") || ""),
    description: String(formData.get("description") || ""),
  });

  const existing = await db
    .select()
    .from(categories)
    .where(eq(categories.name, parsed.name))
    .limit(1);

  if (existing.length) {
    await db
      .update(categories)
      .set({
        color: parsed.color,
        description: parsed.description,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, existing[0].id));
  } else {
    await db.insert(categories).values(parsed);
  }

  revalidatePath("/settings");
}

export async function updateCategory(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const parsed = categorySchema.parse({
    name: String(formData.get("name") || ""),
    color: String(formData.get("color") || ""),
    description: String(formData.get("description") || ""),
  });

  await db
    .update(categories)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(categories.id, id));

  revalidatePath("/settings");
}

export async function deleteCategory(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/settings");
}

/** ========= Página ========= */
export default async function SettingsPage() {
  const [unitsData, categoriesData] = await Promise.all([
    db.select().from(units).orderBy(desc(units.createdAt)),
    db.select().from(categories).orderBy(desc(categories.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-10">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* UNIDADES */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Unidades</h2>

        {/* Form criar/atualizar por nome (upsert) */}
        <form action={createUnit} className="grid gap-3 md:grid-cols-4 bg-white/70 rounded-2xl p-4 shadow">
          <input
            name="name"
            placeholder="Nome (ex: Frasco)"
            className="border rounded-lg p-2"
            required
          />
          <input
            name="abbreviation"
            placeholder="Sigla (ex: FR)"
            className="border rounded-lg p-2"
            required
          />
          <input
            name="description"
            placeholder="Descrição (opcional)"
            className="border rounded-lg p-2 md:col-span-1"
          />
          <button className="rounded-xl px-4 py-2 border hover:opacity-80">Salvar</button>
        </form>

        {/* Tabela */}
        <div className="overflow-x-auto rounded-2xl border bg-white/70 shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Sigla</th>
                <th className="text-left p-3">Descrição</th>
                <th className="text-left p-3 w-40">Ações</th>
              </tr>
            </thead>
            <tbody>
              {unitsData.map((u) => {
                const formId = `unit-${u.id}`;
                return (
                  <tr key={u.id} className="border-t align-middle">
                    <td className="p-3">{u.id}</td>
                    <td className="p-3">
                      <input
                        form={formId}
                        name="name"
                        defaultValue={u.name}
                        className="border rounded p-1 w-44"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        form={formId}
                        name="abbreviation"
                        defaultValue={u.abbreviation}
                        className="border rounded p-1 w-24"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        form={formId}
                        name="description"
                        defaultValue={u.description ?? ""}
                        className="border rounded p-1 w-64"
                      />
                    </td>
                    <td className="p-3">
                      <form id={formId} action={updateUnit} className="flex gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <button className="rounded px-3 py-1 border">Atualizar</button>
                      </form>
                      <form action={deleteUnit} className="mt-2">
                        <input type="hidden" name="id" value={u.id} />
                        <button className="rounded px-3 py-1 border hover:bg-red-50">
                          Excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {unitsData.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={5}>
                    Nenhuma unidade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Categorias</h2>

        <form action={createCategory} className="grid gap-3 md:grid-cols-4 bg-white/70 rounded-2xl p-4 shadow">
          <input
            name="name"
            placeholder="Nome (ex: Limpeza)"
            className="border rounded-lg p-2"
            required
          />
          <input
            name="color"
            placeholder='Cor (ex: "emerald" ou "#00A884")'
            className="border rounded-lg p-2"
          />
          <input
            name="description"
            placeholder="Descrição (opcional)"
            className="border rounded-lg p-2 md:col-span-1"
          />
          <button className="rounded-xl px-4 py-2 border hover:opacity-80">Salvar</button>
        </form>

        <div className="overflow-x-auto rounded-2xl border bg-white/70 shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Cor</th>
                <th className="text-left p-3">Descrição</th>
                <th className="text-left p-3 w-40">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categoriesData.map((c) => {
                const formId = `category-${c.id}`;
                return (
                  <tr key={c.id} className="border-t align-middle">
                    <td className="p-3">{c.id}</td>
                    <td className="p-3">
                      <input
                        form={formId}
                        name="name"
                        defaultValue={c.name}
                        className="border rounded p-1 w-48"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        form={formId}
                        name="color"
                        defaultValue={c.color ?? ""}
                        className="border rounded p-1 w-32"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        form={formId}
                        name="description"
                        defaultValue={c.description ?? ""}
                        className="border rounded p-1 w-64"
                      />
                    </td>
                    <td className="p-3">
                      <form id={formId} action={updateCategory} className="flex gap-2">
                        <input type="hidden" name="id" value={c.id} />
                        <button className="rounded px-3 py-1 border">Atualizar</button>
                      </form>
                      <form action={deleteCategory} className="mt-2">
                        <input type="hidden" name="id" value={c.id} />
                        <button className="rounded px-3 py-1 border hover:bg-red-50">
                          Excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {categoriesData.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={5}>
                    Nenhuma categoria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
