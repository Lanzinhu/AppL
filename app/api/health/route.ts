// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const ping = await db.execute(sql`select 1 as ok`);
    const rows = (ping as any)?.rows ?? [];
    return NextResponse.json({
      ok: true,
      db: 'connected',
      ping: rows[0]?.ok === 1
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
