import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { INITIAL_USERS, User } from "@/data/teamflowData";
import { hashPassword, generateInitialPassword } from "@/lib/auth";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ users: INITIAL_USERS, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, full_name, email, role, job_title, avatar, phone, employee_id, bio
      FROM users
      ORDER BY id ASC;
    `;

    const users: User[] = rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      fullName: r.full_name as string,
      email: r.email as string,
      role: r.role as "ceo" | "project_manager" | "employer",
      jobTitle: (r.job_title as string) || (r.role === "ceo" ? "Chief Executive Officer" : r.role === "project_manager" ? "Project Manager" : "Software Developer"),
      avatar: (r.avatar as string) || "",
      phone: (r.phone as string) || "",
      employeeId: (r.employee_id as string) || "",
      bio: (r.bio as string) || undefined,
    }));

    return NextResponse.json({ users, source: "database" });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ users: INITIAL_USERS, source: "fallback_error" });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const { id, name, fullName, email, role, jobTitle, avatar, phone, employeeId, bio } = body;

    if (!id || !email || !fullName) {
      return NextResponse.json({ error: "Missing required fields (id, email, fullName)" }, { status: 400 });
    }

    const initialPassword = body.password || body.initialPassword || generateInitialPassword();
    const passwordHash = hashPassword(initialPassword);

    const sql = getDb();
    await sql`
      INSERT INTO users (id, name, full_name, email, role, job_title, avatar, phone, employee_id, bio, password_hash, initial_password)
      VALUES (${id}, ${name || fullName.split(" ")[0]}, ${fullName}, ${email}, ${role || "employer"}, ${jobTitle || ""}, ${avatar || ""}, ${phone || ""}, ${employeeId || ""}, ${bio || null}, ${passwordHash}, ${initialPassword})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        job_title = EXCLUDED.job_title,
        avatar = EXCLUDED.avatar,
        phone = EXCLUDED.phone,
        employee_id = EXCLUDED.employee_id,
        bio = COALESCE(EXCLUDED.bio, users.bio),
        password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash),
        initial_password = COALESCE(users.initial_password, EXCLUDED.initial_password);
    `;

    return NextResponse.json({
      success: true,
      user: body,
      initialPassword,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create/update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === "u-ceo-1") {
      return NextResponse.json({ error: "The primary CEO account cannot be deleted." }, { status: 403 });
    }

    await initDatabase();
    const sql = getDb();
    await sql`DELETE FROM users WHERE id = ${userId};`;

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

