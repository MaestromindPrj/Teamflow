import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";

export interface RewardLedgerEntry {
  id: string;
  userId: string;
  points: number;
  action: string;
  reason: string;
  awardedById?: string;
  awardedByName?: string;
  date: string;
}

const DEFAULT_MOCK_LEDGER: RewardLedgerEntry[] = [];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!isDbConfigured()) {
    let list = DEFAULT_MOCK_LEDGER;
    if (userId) list = list.filter((r) => r.userId === userId);
    return NextResponse.json({ ledger: list, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    let rows;

    if (userId) {
      rows = await sql`
        SELECT id, user_id, points, action, reason, awarded_by_id, awarded_by_name, date
        FROM rewards_ledger
        WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC;
      `;
    } else {
      rows = await sql`
        SELECT id, user_id, points, action, reason, awarded_by_id, awarded_by_name, date
        FROM rewards_ledger
        ORDER BY created_at DESC, id DESC;
      `;
    }

    const ledger: RewardLedgerEntry[] = rows.map((r) => ({
      id: r.id as string,
      userId: r.user_id as string,
      points: Number(r.points) || 0,
      action: r.action as string,
      reason: r.reason as string,
      awardedById: (r.awarded_by_id as string) || undefined,
      awardedByName: (r.awarded_by_name as string) || undefined,
      date: r.date as string,
    }));

    return NextResponse.json({ ledger, source: "database" });
  } catch (error) {
    console.error("GET /api/rewards error:", error);
    let fallback = DEFAULT_MOCK_LEDGER;
    if (userId) fallback = fallback.filter((r) => r.userId === userId);
    return NextResponse.json({ ledger: fallback, source: "fallback_error" });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const { userId, points, action, reason, awardedById, awardedByName, date } = body;

    if (!userId || !points || !action || !reason) {
      return NextResponse.json(
        { error: "Missing required fields (userId, points, action, reason)" },
        { status: 400 }
      );
    }

    const recordId = body.id || `rw-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const formattedDate = date || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const numericPoints = Math.max(1, Number(points) || 50);

    const sql = getDb();
    await sql`
      INSERT INTO rewards_ledger (id, user_id, points, action, reason, awarded_by_id, awarded_by_name, date)
      VALUES (
        ${recordId},
        ${userId},
        ${numericPoints},
        ${action},
        ${reason},
        ${awardedById || null},
        ${awardedByName || null},
        ${formattedDate}
      );
    `;

    const newEntry: RewardLedgerEntry = {
      id: recordId,
      userId,
      points: numericPoints,
      action,
      reason,
      awardedById,
      awardedByName,
      date: formattedDate,
    };

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record reward";
    console.error("POST /api/rewards error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

