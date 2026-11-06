import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";

export interface JobRoleItem {
  id: string;
  name: string;
}

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ jobRoles: [], departments: [], source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, name
      FROM job_roles
      ORDER BY name ASC;
    `;

    const jobRoles: JobRoleItem[] = rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
    }));

    return NextResponse.json({ jobRoles, departments: jobRoles, source: "database" });
  } catch (error) {
    console.error("GET /api/job-roles error:", error);
    return NextResponse.json({ error: "Failed to fetch job roles", jobRoles: [], departments: [], source: "error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const name = (body.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Job role name is required" }, { status: 400 });
    }

    const id = body.id || `role-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const sql = getDb();

    await sql`
      INSERT INTO job_roles (id, name)
      VALUES (${id}, ${name})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `;

    return NextResponse.json({
      success: true,
      jobRole: { id, name },
      department: { id, name },
    });
  } catch (error) {
    console.error("POST /api/job-roles error:", error);
    const message = error instanceof Error ? error.message : "Failed to create job role";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const { id, name, oldName } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      UPDATE job_roles
      SET name = ${name}
      WHERE id = ${id};
    `;

    if (oldName && oldName !== name) {
      await sql`
        UPDATE users
        SET job_title = ${name}
        WHERE job_title = ${oldName};
      `;
    }

    return NextResponse.json({
      success: true,
      jobRole: { id, name },
      department: { id, name },
    });
  } catch (error) {
    console.error("PUT /api/job-roles error:", error);
    const message = error instanceof Error ? error.message : "Failed to update job role";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Job role id is required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM job_roles WHERE id = ${id};`;

    return NextResponse.json({ success: true, message: `Job role ${id} deleted` });
  } catch (error) {
    console.error("DELETE /api/job-roles error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete job role";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

