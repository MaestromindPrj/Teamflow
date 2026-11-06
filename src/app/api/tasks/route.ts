import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { INITIAL_TASKS_DATA, Task } from "@/data/teamflowData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assignedTo = searchParams.get("assignedTo");

  if (!isDbConfigured()) {
    let result = INITIAL_TASKS_DATA;
    if (projectId) result = result.filter((t) => t.projectId === projectId);
    if (assignedTo) result = result.filter((t) => t.assignedTo === assignedTo);
    return NextResponse.json({ tasks: result, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();

    let rows;
    if (projectId && assignedTo) {
      rows = await sql`
        SELECT id, project_id, title, description, assigned_to, assigned_by, priority, status, deadline, progress, attachments, activity
        FROM tasks
        WHERE project_id = ${projectId} AND assigned_to = ${assignedTo}
        ORDER BY id ASC;
      `;
    } else if (projectId) {
      rows = await sql`
        SELECT id, project_id, title, description, assigned_to, assigned_by, priority, status, deadline, progress, attachments, activity
        FROM tasks
        WHERE project_id = ${projectId}
        ORDER BY id ASC;
      `;
    } else if (assignedTo) {
      rows = await sql`
        SELECT id, project_id, title, description, assigned_to, assigned_by, priority, status, deadline, progress, attachments, activity
        FROM tasks
        WHERE assigned_to = ${assignedTo}
        ORDER BY id ASC;
      `;
    } else {
      rows = await sql`
        SELECT id, project_id, title, description, assigned_to, assigned_by, priority, status, deadline, progress, attachments, activity
        FROM tasks
        ORDER BY id ASC;
      `;
    }

    const tasks: Task[] = rows.map((r) => ({
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
    }));

    return NextResponse.json({ tasks, source: "database" });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks", tasks: [], source: "error" }, { status: 500 });
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
      projectId,
      title,
      description,
      assignedTo,
      assignedBy,
      priority,
      status,
      deadline,
      progress,
      attachments,
      activity,
    } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: "Missing required fields (title, projectId)" }, { status: 400 });
    }

    const id = body.id || `task-${Date.now()}`;
    const taskStatus = status || "To Do";
    const taskProgress = progress !== undefined ? progress : taskStatus === "Completed" ? 100 : taskStatus === "Review" ? 90 : 15;
    const initialActivity = activity || [
      {
        id: `act-${Date.now()}`,
        title: `Task created`,
        detail: `Created and assigned to ${assignedTo || "team member"}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    ];

    const sql = getDb();
    const taskDiscussion = body.discussion || [];
    await sql`
      INSERT INTO tasks (
        id, project_id, title, description, assigned_to, assigned_by, priority, status, deadline, progress, attachments, activity, discussion
      )
      VALUES (
        ${id},
        ${projectId},
        ${title},
        ${description || ""},
        ${assignedTo || ""},
        ${assignedBy || ""},
        ${priority || "Medium"},
        ${taskStatus},
        ${deadline || ""},
        ${taskProgress},
        ${JSON.stringify(attachments || [])}::jsonb,
        ${JSON.stringify(initialActivity)}::jsonb,
        ${JSON.stringify(taskDiscussion)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        project_id = EXCLUDED.project_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        assigned_to = EXCLUDED.assigned_to,
        assigned_by = EXCLUDED.assigned_by,
        priority = EXCLUDED.priority,
        status = EXCLUDED.status,
        deadline = EXCLUDED.deadline,
        progress = EXCLUDED.progress,
        attachments = EXCLUDED.attachments,
        activity = EXCLUDED.activity,
        discussion = COALESCE(EXCLUDED.discussion, tasks.discussion);
    `;

    const newTask: Task = {
      id,
      projectId,
      title,
      description: description || "",
      assignedTo: assignedTo || "",
      assignedBy: assignedBy || "",
      priority: priority || "Medium",
      status: taskStatus,
      deadline: deadline || "",
      progress: taskProgress,
      attachments: attachments || [],
      activity: initialActivity,
      discussion: taskDiscussion,
    };

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

