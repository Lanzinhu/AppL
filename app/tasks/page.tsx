import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { and, desc, ilike, eq, sql } from "drizzle-orm";
import {
  addTask,
  toggleTask,
  deleteTask,
  updateTaskTitle,
  updateTaskDetails,
  bulkComplete,
  bulkDelete,
  clearCompleted,
  toggleAll,
} from "./actions";

export const dynamic = "force-dynamic";

type Filter = "all" | "active" | "completed";
type Sort = "recent" | "alpha" | "due" | "priority";
type Prio = "all" | "low" | "medium" | "high";
type Due = "all" | "overdue" | "today" | "week";

function parseParams(searchParams: { [k: string]: string | string[] | undefined }) {
  const q = (searchParams.q as string) ?? "";
  const filter = ((searchParams.filter as string) ?? "all") as Filter;
  const sort = ((searchParams.sort as string) ?? "recent") as Sort;
  const prio = ((searchParams.prio as string) ?? "all") as Prio;
  const due = ((searchParams.due as string) ?? "all") as Due;
  const tag = (searchParams.tag as string) ?? "";
  return { q, filter, sort, prio, due, tag };
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: { [k: string]: string | string[] | undefined };
}) {
  const { q, filter, sort, prio, due, tag } = parseParams(searchParams ?? {});

  // WHERE dinâmico
  const where: any[] = [];
  if (q) where.push(ilike(tasks.title, `%${q}%`));
  if (filter === "active") where.push(eq(tasks.completed, false));
  if (filter === "completed") where.push(eq(tasks.completed, true));
  if (prio !== "all") where.push(eq(tasks.priority, prio));

  // filtros de vencimento (lado do DB pra paginar bem)
  if (due !== "all") {
    if (due === "overdue") where.push(sql`(${tasks.dueAt}) IS NOT NULL AND ${tasks.dueAt} < now()`);
    if (due === "today") where.push(sql`date(${tasks.dueAt}) = current_date`);
    if (due === "week")
      where.push(
        sql`(${tasks.dueAt}) IS NOT NULL AND date(${tasks.dueAt}) <= (current_date + interval '7 days')`,
      );
  }

  // filtro por tag (CSV simples): usa ilike com separadores para evitar falsos-positivos
  if (tag) {
    const like = `%${tag}%`;
    where.push(
      sql`(${tasks.tagsCsv} IS NOT NULL) AND (
           ${tasks.tagsCsv} ILIKE ${like}
         )`,
    );
  }

  // ORDER BY
  const orderBy =
    sort === "alpha"
      ? tasks.title
      : sort === "due"
      ? // tarefas sem dueAt por último
        sql`(CASE WHEN ${tasks.dueAt} IS NULL THEN 1 ELSE 0 END), ${tasks.dueAt} ASC`
      : sort === "priority"
      ? // high > medium > low
        sql`(CASE ${tasks.priority}
                WHEN 'high' THEN 1
                WHEN 'medium' THEN 2
                ELSE 3
             END) ASC, ${tasks.createdAt} DESC`
      : // recent
        desc(tasks.createdAt);

  const rows = await db
    .select()
    .from(tasks)
    .where(where.length ? and(...where) : sql`true`)
    .orderBy(orderBy as any);

  const counts = await db
    .select({
      total: sql<number>`count(*)`,
      done: sql<number>`count(*) filter (where ${tasks.completed} = true)`,
    })
    .from(tasks);

  const total = Number(counts[0]?.total ?? 0);
  const done = Number(counts[0]?.done ?? 0);
  const remaining = Math.max(total - done, 0);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <span className="text-sm text-gray-500">
          {remaining} abertas · {done} concluídas · {total} no total
        </span>
        <form action={toggleAll} className="ml-auto flex items-center gap-2">
          <input type="hidden" name="complete" value={remaining > 0 ? "true" : "false"} />
          <button
            className="rounded border px-3 py-1.5 hover:bg-gray-50"
            title={remaining > 0 ? "Concluir todas" : "Reabrir todas"}
          >
            {remaining > 0 ? "Concluir todas" : "Reabrir todas"}
          </button>
        </form>
        <form action={clearCompleted}>
          <button className="rounded border px-3 py-1.5 hover:bg-gray-50">Limpar concluídas</button>
        </form>
      </header>

      {/* Criar tarefa */}
      <form action={addTask} className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          type="text"
          name="title"
          placeholder="Nova tarefa…"
          className="md:col-span-2 rounded border px-3 py-2"
          required
        />
        <select name="priority" defaultValue="medium" className="rounded border px-3 py-2">
          <option value="low">Prioridade: Baixa</option>
          <option value="medium">Prioridade: Média</option>
          <option value="high">Prioridade: Alta</option>
        </select>
        <input type="date" name="dueAt" className="rounded border px-3 py-2" />
        <input
          type="text"
          name="tags"
          placeholder="tags (ex.: pessoal, urgente)"
          className="md:col-span-2 rounded border px-3 py-2"
        />
        <div className="md:col-span-2 flex justify-end">
          <button className="rounded bg-black text-white px-4 py-2">Adicionar</button>
        </div>
      </form>

      {/* Busca e filtros */}
      <form method="get" className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <input
          type="text"
          name="q"
          placeholder="Buscar por título…"
          defaultValue={q}
          className="md:col-span-2 rounded border px-3 py-2"
        />
        <select name="filter" defaultValue={filter} className="rounded border px-3 py-2">
          <option value="all">Todas</option>
          <option value="active">Ativas</option>
          <option value="completed">Concluídas</option>
        </select>
        <select name="prio" defaultValue={prio} className="rounded border px-3 py-2">
          <option value="all">Prioridade: Todas</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
        <select name="due" defaultValue={due} className="rounded border px-3 py-2">
          <option value="all">Vencimento: Todas</option>
          <option value="overdue">Atrasadas</option>
          <option value="today">Hoje</option>
          <option value="week">Até 7 dias</option>
        </select>
        <input
          type="text"
          name="tag"
          placeholder="Filtrar por tag (ex.: urgente)"
          defaultValue={tag}
          className="rounded border px-3 py-2"
        />
        <select name="sort" defaultValue={sort} className="rounded border px-3 py-2">
          <option value="recent">Ordenar: Recentes</option>
          <option value="alpha">A–Z</option>
          <option value="due">Por vencimento</option>
          <option value="priority">Por prioridade</option>
        </select>
        <div className="md:col-span-6 flex justify-end">
          <button className="rounded border px-3 py-2 hover:bg-gray-50">Aplicar</button>
        </div>
      </form>

      {/* Ações em massa + Lista */}
      <form action={bulkComplete} className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            formAction={bulkComplete}
            className="rounded border px-3 py-1.5 hover:bg-gray-50"
            title="Marcar selecionadas como concluídas"
          >
            Concluir selecionadas
          </button>
          <button
            formAction={bulkDelete}
            className="rounded border px-3 py-1.5 hover:bg-red-50"
            title="Excluir selecionadas"
          >
            Excluir selecionadas
          </button>
        </div>

        <ul className="space-y-2">
          {rows.map((t) => {
            const overdue = t.dueAt ? t.dueAt < new Date() && !t.completed : false;
            return (
              <li
                key={t.id}
                className={`flex flex-col gap-2 rounded border px-3 py-2 md:flex-row md:items-center ${
                  overdue ? "border-red-300 bg-red-50/40" : ""
                }`}
              >
                {/* seleção para bulk + toggle */}
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="ids" value={t.id} className="size-4" />
                  <form action={toggleTask.bind(null, t.id)}>
                    <button type="submit" className="rounded border px-2 py-1">
                      {t.completed ? "✅" : "⬜️"}
                    </button>
                  </form>
                </label>

                {/* título (summary edita) */}
                <div className="flex-1">
                  <details>
                    <summary
                      className={`cursor-pointer list-none marker:hidden select-none ${
                        t.completed ? "line-through opacity-60" : ""
                      }`}
                      title="Clique para editar"
                    >
                      <span className="font-medium">{t.title}</span>{" "}
                      <span className="text-xs text-gray-500">
                        {t.priority === "high" ? "· Alta" : t.priority === "low" ? "· Baixa" : "· Média"}
                        {t.dueAt ? ` · vence ${t.dueAt.toLocaleDateString()}` : ""}
                        {t.tagsCsv ? ` · ${t.tagsCsv}` : ""}
                      </span>
                    </summary>

                    {/* editar título */}
                    <form action={updateTaskTitle} className="mt-2 flex gap-2">
                      <input type="hidden" name="id" value={t.id} />
                      <input name="title" defaultValue={t.title} className="flex-1 rounded border px-3 py-1.5" required />
                      <button className="rounded border px-3 py-1.5 hover:bg-gray-50">Salvar título</button>
                    </form>

                    {/* editar detalhes */}
                    <form action={updateTaskDetails} className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input type="hidden" name="id" value={t.id} />
                      <select name="priority" defaultValue={t.priority} className="rounded border px-3 py-2">
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                      <input
                        type="date"
                        name="dueAt"
                        defaultValue={t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 10) : ""}
                        className="rounded border px-3 py-2"
                      />
                      <input
                        type="text"
                        name="tags"
                        defaultValue={t.tagsCsv ?? ""}
                        placeholder="tags separadas por vírgula"
                        className="md:col-span-2 rounded border px-3 py-2"
                      />
                      <div className="md:col-span-4 flex justify-end">
                        <button className="rounded border px-3 py-1.5 hover:bg-gray-50">Salvar detalhes</button>
                      </div>
                    </form>
                  </details>
                </div>

                {/* excluir individual */}
                <form action={deleteTask.bind(null, t.id)} className="md:ml-auto">
                  <button
                    type="submit"
                    className="rounded border px-2 py-1 hover:bg-red-50"
                    title="Excluir"
                  >
                    Excluir
                  </button>
                </form>
              </li>
            );
          })}

          {rows.length === 0 && (
            <li className="text-sm text-gray-500">Nenhuma tarefa encontrada.</li>
          )}
        </ul>
      </form>
    </main>
  );
}
