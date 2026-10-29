import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { INITIAL_USERS, User } from "@/data/teamflowData";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ users: INITIAL_USERS, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, full_name, email, role, job_title, department, avatar, phone, location, employee_id
      FROM users
      ORDER BY id ASC;
    `;

    const users: User[] = rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      fullName: r.full_name as string,
      email: r.email as string,
      role: r.role as "ceo" | "project_manager" | "employer",
      jobTitle: r.job_title as string,
      department: r.department as string,
      avatar: r.avatar as string,
      phone: r.phone as string,
      location: r.location as string,
      employeeId: r.employee_id as string,
    }));

    return NextResponse.json({ users, source: "database" });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ users: INITIAL_USERS, source: "fallback_error" });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const { id, name, fullName, email, role, jobTitle, department, avatar, phone, location, employeeId } = body;

    if (!id || !email || !fullName) {
      return NextResponse.json({ error: "Missing required fields (id, email, fullName)" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      INSERT INTO users (id, name, full_name, email, role, job_title, department, avatar, phone, location, employee_id)
      VALUES (${id}, ${name || fullName.split(" ")[0]}, ${fullName}, ${email}, ${role || "employer"}, ${jobTitle || ""}, ${department || ""}, ${avatar || ""}, ${phone || ""}, ${location || ""}, ${employeeId || ""})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        job_title = EXCLUDED.job_title,
        department = EXCLUDED.department,
        avatar = EXCLUDED.avatar,
        phone = EXCLUDED.phone,
        location = EXCLUDED.location,
        employee_id = EXCLUDED.employee_id;
    `;

    return NextResponse.json({ success: true, user: body });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create/update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

