import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";

export interface OfficeLeave {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  declaredById?: string;
  declaredByName?: string;
  declaredByRole?: "ceo" | "project_manager" | string;
  createdAt?: string;
}

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ officeLeaves: [], source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, title, date, end_date, declared_by_id, declared_by_name, declared_by_role, created_at
      FROM office_leaves
      ORDER BY date ASC;
    `;

    const officeLeaves: OfficeLeave[] = rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      date: r.date as string,
      endDate: (r.end_date as string) || undefined,
      declaredById: (r.declared_by_id as string) || undefined,
      declaredByName: (r.declared_by_name as string) || undefined,
      declaredByRole: (r.declared_by_role as string) || undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    }));

    return NextResponse.json({ officeLeaves, source: "database" });
  } catch (error) {
    console.error("GET /api/office-leaves error:", error);
    return NextResponse.json({ error: "Failed to fetch office leaves", officeLeaves: [], source: "error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const title = (body.title || "").trim();
    const date = (body.date || "").trim();
    const endDate = (body.endDate || date).trim();
    const declaredById = body.declaredById || null;
    const declaredByName = body.declaredByName || null;
    const declaredByRole = body.declaredByRole || null;

    if (!title || !date) {
      return NextResponse.json({ error: "Title and Date are required" }, { status: 400 });
    }

    const id = body.id || `off-leave-${date}-${Date.now()}`;
    const sql = getDb();

    await sql`
      INSERT INTO office_leaves (id, title, date, end_date, declared_by_id, declared_by_name, declared_by_role)
      VALUES (${id}, ${title}, ${date}, ${endDate}, ${declaredById}, ${declaredByName}, ${declaredByRole})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        date = EXCLUDED.date,
        end_date = EXCLUDED.end_date,
        declared_by_id = EXCLUDED.declared_by_id,
        declared_by_name = EXCLUDED.declared_by_name,
        declared_by_role = EXCLUDED.declared_by_role;
    `;

    return NextResponse.json({
      success: true,
      officeLeave: {
        id,
        title,
        date,
        endDate,
        declaredById: declaredById || undefined,
        declaredByName: declaredByName || undefined,
        declaredByRole: declaredByRole || undefined,
      },
    });
  } catch (error) {
    console.error("POST /api/office-leaves error:", error);
    const message = error instanceof Error ? error.message : "Failed to save office leave";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await initDatabase();
    const sql = getDb();
    await sql`DELETE FROM office_leaves WHERE id = ${id};`;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/office-leaves error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete office leave";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

