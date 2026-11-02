import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { DEFAULT_PROJECT_CATEGORIES, ProjectCategory } from "@/data/teamflowData";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ categories: DEFAULT_PROJECT_CATEGORIES, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();

    // Query categories with live project counts
    const rows = await sql`
      SELECT 
        c.id, 
        c.name, 
        c.description,
        COUNT(p.id)::int as project_count
      FROM project_categories c
      LEFT JOIN projects p ON LOWER(p.category) = LOWER(c.name)
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY c.created_at ASC;
    `;

    const categories: ProjectCategory[] = rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string) || "",
      projectCount: Number(r.project_count || 0),
    }));

    return NextResponse.json({ categories, source: "database" });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ categories: DEFAULT_PROJECT_CATEGORIES, source: "fallback_error" });
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
    const description = (body.description || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const id = body.id || `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const sql = getDb();

    await sql`
      INSERT INTO project_categories (id, name, description)
      VALUES (${id}, ${name}, ${description})
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description;
    `;

    return NextResponse.json({
      success: true,
      category: { id, name, description, projectCount: 0 },
    });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    const message = error instanceof Error ? error.message : "Failed to create category";
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
    const { id, name, oldName, description } = body;

    const trimmedName = (name || "").trim();
    if (!id || !trimmedName) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      UPDATE project_categories
      SET 
        name = ${trimmedName},
        description = ${description !== undefined ? description : ""}
      WHERE id = ${id};
    `;

    // Cascade update to projects if category was renamed
    if (oldName && oldName.trim().toLowerCase() !== trimmedName.toLowerCase()) {
      await sql`
        UPDATE projects
        SET category = ${trimmedName}
        WHERE LOWER(category) = LOWER(${oldName.trim()});
      `;
    }

    return NextResponse.json({
      success: true,
      category: { id, name: trimmedName, description },
    });
  } catch (error) {
    console.error("PUT /api/categories error:", error);
    const message = error instanceof Error ? error.message : "Failed to update category";
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
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM project_categories WHERE id = ${id};`;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/categories error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

