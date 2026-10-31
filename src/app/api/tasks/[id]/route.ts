import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { Task } from "@/data/teamflowData";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, project_id, title, description, assigned_to, assigned_by, priority, status, deadline, progress, attachments, activity, discussion
      FROM tasks
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const r = rows[0];
    const task: Task = {
      id: r.id as string,
      projectId: r.project_id as string,
      title: r.title as string,
      description: (r.description as string) || "",
      assignedTo: (r.assigned_to as string) || "",
      assignedBy: (r.assigned_by as string) || "",
      priority: (r.priority as Task["priority"]) || "Medium",
      status: (r.status as Task["status"]) || "To Do",
      deadline: (r.deadline as string) || "",
      progress: Number(r.progress || 0),
      attachments: (r.attachments as Task["attachments"]) || [],
      activity: (r.activity as Task["activity"]) || [],
      discussion: (r.discussion as Task["discussion"]) || [],
    };

    return NextResponse.json({ task });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const updates = await req.json();
    const sql = getDb();

    const existing = await sql`SELECT * FROM tasks WHERE id = ${id} LIMIT 1;`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const current = existing[0];
    const title = updates.title !== undefined ? updates.title : current.title;
    const description = updates.description !== undefined ? updates.description : current.description;
    const assignedTo = updates.assignedTo !== undefined ? updates.assignedTo : current.assigned_to;
    const assignedBy = updates.assignedBy !== undefined ? updates.assignedBy : current.assigned_by;
    const priority = updates.priority !== undefined ? updates.priority : current.priority;
    const status = updates.status !== undefined ? updates.status : current.status;
    const deadline = updates.deadline !== undefined ? updates.deadline : current.deadline;

    let progress = updates.progress !== undefined ? updates.progress : current.progress;
    if (updates.status === "Completed") progress = 100;

    let attachments = updates.attachments !== undefined ? updates.attachments : current.attachments;
    let activity = updates.activity !== undefined ? updates.activity : current.activity;
    let discussion = updates.discussion !== undefined ? updates.discussion : (current.discussion || []);

    if (updates.status && updates.status !== current.status && !updates.activity) {
      const newAct = {
        id: `act-${Date.now()}`,
        title: `Status changed to ${updates.status}`,
        detail: updates.updatedByName ? `Updated by ${updates.updatedByName}` : "Task status updated",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
      activity = [newAct, ...(Array.isArray(activity) ? activity : [])];
    }

    await sql`
      UPDATE tasks SET
        title = ${title},
        description = ${description},
        assigned_to = ${assignedTo},
        assigned_by = ${assignedBy},
        priority = ${priority},
        status = ${status},
        deadline = ${deadline},
        progress = ${progress},
        attachments = ${JSON.stringify(attachments || [])}::jsonb,
        activity = ${JSON.stringify(activity || [])}::jsonb,
        discussion = ${JSON.stringify(discussion || [])}::jsonb
      WHERE id = ${id};
    `;

    return NextResponse.json({ success: true, message: "Task updated" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const sql = getDb();
    await sql`DELETE FROM tasks WHERE id = ${id};`;
    return NextResponse.json({ success: true, message: `Task ${id} deleted` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

