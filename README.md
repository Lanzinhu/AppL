# Tasker — Next.js + PostgreSQL (Neon/Supabase) + Drizzle

## Como usar
1. Renomeie `.env.example` para `.env` e cole sua `DATABASE_URL` do Neon/Supabase (com `?sslmode=require`). Opcional: adicione `DATABASE_URL_DIRECT` (sem pooler) para migrações.
2. Instale deps:
   ```bash
   npm i
   ```
3. Gere e aplique migrações:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:studio # opcional
   ```
4. Inicie:
   ```bash
   npm run dev
   ```
5. Acesse http://localhost:3000 → **Ir para tarefas**.

Estrutura principal:
```
app/            # App Router (SSR + Server Actions)
lib/db/         # Conexão e schema (Drizzle)
scripts/        # Migrações
drizzle.config.ts
.env.example
```
