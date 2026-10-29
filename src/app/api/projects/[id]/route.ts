import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { Project } from "@/data/teamflowData";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, code, description, project_manager_id, team_lead_id, team_member_ids, status, priority, start_date, deadline, category, budget
      FROM projects
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const r = rows[0];
    const project: Project = {
      id: r.id as string,
      name: r.name as string,
      code: r.code as string,
      description: (r.description as string) || "",
      projectManagerId: (r.project_manager_id as string) || "",
      teamLeadId: (r.team_lead_id as string) || "",
      teamMemberIds: (r.team_member_ids as string[]) || [],
      status: (r.status as Project["status"]) || "In Progress",
      priority: (r.priority as Project["priority"]) || "Medium",
      startDate: (r.start_date as string) || "",
      deadline: (r.deadline as string) || "",
      category: (r.category as string) || "General",
      budget: (r.budget as string) || "",
    };

    return NextResponse.json({ project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 });
  }

  try {
    await initDatabase();
    const updates = await req.json();
    const sql = getDb();

    // Fetch existing
    const existing = await sql`SELECT * FROM projects WHERE id = ${id} LIMIT 1;`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const current = existing[0];
    const name = updates.name !== undefined ? updates.name : current.name;
    const description = updates.description !== undefined ? updates.description : current.description;
    const projectManagerId = updates.projectManagerId !== undefined ? updates.projectManagerId : current.project_manager_id;
    const teamLeadId = updates.teamLeadId !== undefined ? updates.teamLeadId : current.team_lead_id;
    let teamMemberIds = updates.teamMemberIds !== undefined ? updates.teamMemberIds : current.team_member_ids;
    if (teamLeadId && !teamMemberIds.includes(teamLeadId)) {
      teamMemberIds = [...teamMemberIds, teamLeadId];
    }
    const status = updates.status !== undefined ? updates.status : current.status;
    const priority = updates.priority !== undefined ? updates.priority : current.priority;
    const deadline = updates.deadline !== undefined ? updates.deadline : current.deadline;
    const category = updates.category !== undefined ? updates.category : current.category;
    const budget = updates.budget !== undefined ? updates.budget : current.budget;

    await sql`
      UPDATE projects SET
        name = ${name},
        description = ${description},
        project_manager_id = ${projectManagerId},
        team_lead_id = ${teamLeadId},
        team_member_ids = ${JSON.stringify(teamMemberIds)}::jsonb,
        status = ${status},
        priority = ${priority},
        deadline = ${deadline},
        category = ${category},
        budget = ${budget}
      WHERE id = ${id};
    `;

    return NextResponse.json({ success: true, message: "Project updated" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 });
  }

  try {
    await initDatabase();
    const sql = getDb();
    // Delete project and related tasks
    await sql`DELETE FROM tasks WHERE project_id = ${id};`;
    await sql`DELETE FROM projects WHERE id = ${id};`;

    return NextResponse.json({ success: true, message: `Project ${id} deleted` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

