import { NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";

export async function POST() {
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        error: "DATABASE_URL is not set in environment variables.",
        tip: "Please configure your Neon PostgreSQL DATABASE_URL in .env.local",
      },
      { status: 400 }
    );
  }

  try {
    await initDatabase();
    const sql = getDb();
    const usersCount = await sql`SELECT count(*)::int as c FROM users;`;
    const projectsCount = await sql`SELECT count(*)::int as c FROM projects;`;
    const tasksCount = await sql`SELECT count(*)::int as c FROM tasks;`;
    const attendanceCount = await sql`SELECT count(*)::int as c FROM attendance;`;

    return NextResponse.json({
      success: true,
      message: "Neon PostgreSQL database initialized and seeded successfully.",
      counts: {
        users: usersCount[0]?.c || 0,
        projects: projectsCount[0]?.c || 0,
        tasks: tasksCount[0]?.c || 0,
        attendance: attendanceCount[0]?.c || 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database initialization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

