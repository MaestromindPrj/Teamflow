import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";

export interface TechStackItem {
  id: string;
  name: string;
  projectCount?: number;
}

const DEFAULT_TECH_STACKS: TechStackItem[] = [
  { id: "tech-react", name: "React" },
  { id: "tech-next-js", name: "Next.js" },
  { id: "tech-typescript", name: "TypeScript" },
  { id: "tech-node-js", name: "Node.js" },
  { id: "tech-python", name: "Python" },
  { id: "tech-postgresql", name: "PostgreSQL" },
  { id: "tech-tailwind-css", name: "Tailwind CSS" },
  { id: "tech-flutter", name: "Flutter" },
  { id: "tech-docker", name: "Docker" },
  { id: "tech-aws", name: "AWS" },
  { id: "tech-figma", name: "Figma" },
  { id: "tech-graphql", name: "GraphQL" },
  { id: "tech-mongodb", name: "MongoDB" },
];

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ techStacks: DEFAULT_TECH_STACKS, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();

    const rows = await sql`
      SELECT id, name
      FROM tech_stacks
      ORDER BY name ASC;
    `;

    const techStacks: TechStackItem[] = rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
    }));

    return NextResponse.json({ techStacks, source: "database" });
  } catch (error) {
    console.error("GET /api/tech-stacks error:", error);
    return NextResponse.json({ techStacks: DEFAULT_TECH_STACKS, source: "fallback_error" });
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
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const sql = getDb();

    // Check if technology stack with this name already exists (case-insensitive)
    const existing = await sql`
      SELECT id, name FROM tech_stacks WHERE LOWER(name) = LOWER(${name}) LIMIT 1;
    `;
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        techStack: { id: existing[0].id as string, name: existing[0].name as string },
      });
    }

    const id = body.id || `tech-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    await sql`
      INSERT INTO tech_stacks (id, name)
      VALUES (${id}, ${name})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `;

    return NextResponse.json({
      success: true,
      techStack: { id, name },
    });
  } catch (error) {
    console.error("POST /api/tech-stacks error:", error);
    const message = error instanceof Error ? error.message : "Failed to save tech stack";
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
    const id = (body.id || "").trim();
    const name = (body.name || "").trim();

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      UPDATE tech_stacks
      SET name = ${name}
      WHERE id = ${id};
    `;

    return NextResponse.json({
      success: true,
      techStack: { id, name },
    });
  } catch (error) {
    console.error("PUT /api/tech-stacks error:", error);
    const message = error instanceof Error ? error.message : "Failed to update tech stack";
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
    await sql`DELETE FROM tech_stacks WHERE id = ${id};`;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/tech-stacks error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete tech stack";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
