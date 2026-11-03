import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, source: "mock" });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await initDatabase();
    const sql = getDb();
    const now = Date.now();

    await sql`
      UPDATE clock_in_status
      SET last_heartbeat = ${now},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND is_clocked_in = true;
    `;

    return NextResponse.json({ success: true, timestamp: now });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Heartbeat error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
