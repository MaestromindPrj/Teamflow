import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { INITIAL_PROJECTS, Project } from "@/data/teamflowData";

function resolveDefaultTechStack(category: string, currentTechStack?: unknown): string[] {
  if (Array.isArray(currentTechStack) && currentTechStack.length > 0) {
    return currentTechStack as string[];
  }
  const cat = (category || "").toLowerCase();
  if (cat.includes("web")) return ["React", "Next.js", "TypeScript", "Tailwind CSS"];
  if (cat.includes("mobile")) return ["Flutter", "Node.js", "PostgreSQL", "Docker"];
  if (cat.includes("cloud") || cat.includes("data")) return ["Python", "AWS", "PostgreSQL", "Docker"];
  if (cat.includes("design")) return ["Figma", "React", "TypeScript", "Tailwind CSS"];
  return ["React", "TypeScript", "Node.js", "PostgreSQL"];
}

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ projects: INITIAL_PROJECTS, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, code, project_manager_id, team_lead_id, team_member_ids, status, priority, start_date, deadline, category, budget, tech_stack, attachments
      FROM projects
      ORDER BY id ASC;
    `;

    const projects: Project[] = rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      code: r.code as string,
      projectManagerId: (r.project_manager_id as string) || "",
      teamLeadId: (r.team_lead_id as string) || "",
      teamMemberIds: (r.team_member_ids as string[]) || [],
      status: (r.status as Project["status"]) || "In Progress",
      priority: (r.priority as Project["priority"]) || "Medium",
      startDate: (r.start_date as string) || "",
      deadline: (r.deadline as string) || "",
      category: (r.category as string) || "General",
      budget: (r.budget as string) || "",
      techStack: resolveDefaultTechStack(r.category as string, r.tech_stack),
      attachments: (r.attachments as any) || [],
    }));

    return NextResponse.json({ projects, source: "database" });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ projects: INITIAL_PROJECTS, source: "fallback_error" });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const {
      name,
      code,
      description,
      projectManagerId,
      teamLeadId,
      teamMemberIds,
      priority,
      deadline,
      category,
      budget,
      status,
      techStack,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const id = body.id || `proj-${Date.now()}`;
    const fallbackCode = (code || `PRJ-${Math.floor(10 + Math.random() * 90)}`).toUpperCase();
    const finalMembers = Array.from(new Set([...(teamMemberIds || []), teamLeadId].filter(Boolean)));
    const startDate = body.startDate || new Date().toISOString().split("T")[0];
    const finalTechStack = resolveDefaultTechStack(category || "General", techStack);

    const sql = getDb();
    await sql`
      INSERT INTO projects (
        id, name, code, project_manager_id, team_lead_id, team_member_ids,
        status, priority, start_date, deadline, category, budget, tech_stack
      )
      VALUES (
        ${id},
        ${name},
        ${fallbackCode},
        ${projectManagerId || ""},
        ${teamLeadId || ""},
        ${JSON.stringify(finalMembers)}::jsonb,
        ${status || "In Progress"},
        ${priority || "Medium"},
        ${startDate},
        ${deadline || ""},
        ${category || "General"},
        ${budget || "₹50,000"},
        ${JSON.stringify(finalTechStack)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        project_manager_id = EXCLUDED.project_manager_id,
        team_lead_id = EXCLUDED.team_lead_id,
        team_member_ids = EXCLUDED.team_member_ids,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        deadline = EXCLUDED.deadline,
        category = EXCLUDED.category,
        budget = EXCLUDED.budget,
        tech_stack = EXCLUDED.tech_stack;
    `;

    const newProject: Project = {
      id,
      name,
      code: fallbackCode,
      projectManagerId: projectManagerId || "",
      teamLeadId: teamLeadId || "",
      teamMemberIds: finalMembers,
      status: status || "In Progress",
      priority: priority || "Medium",
      startDate,
      deadline: deadline || "",
      category: category || "General",
      budget: budget || "₹50,000",
      techStack: Array.isArray(techStack) ? techStack : [],
    };

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

