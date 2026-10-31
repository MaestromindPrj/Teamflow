import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";

export interface DepartmentItem {
  id: string;
  name: string;
  createdAt?: string;
}

const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  { id: "dept-ui-ux-designer", name: "UI/UX Designer" },
  { id: "dept-software-developer", name: "Software Developer" },
  { id: "dept-junior-software-developer", name: "Junior Software Developer" },
  { id: "dept-ai-engineer", name: "AI Engineer" },
  { id: "dept-project-manager", name: "Project Manager" },
];

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ departments: DEFAULT_DEPARTMENTS, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, created_at
      FROM departments
      ORDER BY name ASC;
    `;

    const departments: DepartmentItem[] = rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : undefined,
    }));

    return NextResponse.json({ departments, source: "database" });
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json({ departments: DEFAULT_DEPARTMENTS, source: "fallback_error" });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const name = (body.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 });
    }

    const id = body.id || `dept-${Date.now()}`;
    const sql = getDb();

    await sql`
      INSERT INTO departments (id, name)
      VALUES (${id}, ${name})
      ON CONFLICT (name) DO NOTHING;
    `;

    return NextResponse.json({
      success: true,
      department: { id, name },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create department";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const id = body.id;
    const name = (body.name || "").trim();
    const oldName = body.oldName;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      UPDATE departments
      SET name = ${name}
      WHERE id = ${id};
    `;

    if (oldName && oldName !== name) {
      await sql`
        UPDATE users
        SET department = ${name}
        WHERE department = ${oldName};
      `;
    }

    return NextResponse.json({ success: true, department: { id, name } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update department";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Department id is required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM departments WHERE id = ${id};`;

    return NextResponse.json({ success: true, message: `Department ${id} deleted` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete department";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

