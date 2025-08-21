"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

type Priority = "low" | "medium" | "high";

// utils
function parseDateInput(v: FormDataEntryValue | null): Date | null {
  const raw = typeof v === "string" ? v.trim() : "";
  if (!raw) return null;
  // input type="date" => YYYY-MM-DD
  const dt = new Date(`${raw}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function parsePriority(v: FormDataEntryValue | null): Priority {
  const s = (String(v ?? "").toLowerCase().trim() || "medium") as Priority;
  return (["low", "medium", "high"] as const).includes(s) ? s : "medium";
}
function normTagsCsv(v: FormDataEntryValue | null) {
  return String(v ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(","); // csv
}
function toIds(fd: FormData | { getAll: (k: string) => any[] }) {
  const raw = (fd as FormData).getAll?.("ids") ?? [];
  const flat = raw
    .flatMap((v: any) => (typeof v === "string" ? v.split(",") : []))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  return Array.from(new Set(flat));
}

export async function addTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const priority = parsePriority(formData.get("priority"));
  const dueAt = parseDateInput(formData.get("dueAt"));
  const tagsCsv = normTagsCsv(formData.get("tags"));

  await db.insert(tasks).values({
    title,
    completed: false,
    createdAt: new Date(),
    priority,
    dueAt: dueAt ?? null,
    tagsCsv: tagsCsv || null,
  });

  revalidatePath("/tasks");
}

export async function toggleTask(id: number) {
  await db
    .update(tasks)
    .set({ completed: sql<boolean>`NOT ${tasks.completed}` })
    .where(eq(tasks.id, id));
  revalidatePath("/tasks");
}

export async function deleteTask(id: number) {
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath("/tasks");
}

export async function updateTaskTitle(formData: FormData) {
  const id = Number(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;

  await db.update(tasks).set({ title }).where(eq(tasks.id, id));
  revalidatePath("/tasks");
}

export async function updateTaskDetails(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  const priority = parsePriority(formData.get("priority"));
  const dueAt = parseDateInput(formData.get("dueAt"));
  const tagsCsv = normTagsCsv(formData.get("tags"));

  await db
    .update(tasks)
    .set({
      priority,
      dueAt: dueAt ?? null,
      tagsCsv: tagsCsv || null,
    })
    .where(eq(tasks.id, id));

  revalidatePath("/tasks");
}

export async function bulkComplete(formData: FormData) {
  const ids = toIds(formData);
  if (!ids.length) return;
  await db.update(tasks).set({ completed: true }).where(inArray(tasks.id, ids));
  revalidatePath("/tasks");
}

export async function bulkDelete(formData: FormData) {
  const ids = toIds(formData);
  if (!ids.length) return;
  await db.delete(tasks).where(inArray(tasks.id, ids));
  revalidatePath("/tasks");
}

export async function clearCompleted() {
  await db.delete(tasks).where(eq(tasks.completed, true));
  revalidatePath("/tasks");
}

export async function toggleAll(formData: FormData) {
  const action = String(formData.get("complete") ?? "true");
  const makeComplete = action === "true";
  await db.update(tasks).set({ completed: makeComplete }).where(sql`true`);
  revalidatePath("/tasks");
}
