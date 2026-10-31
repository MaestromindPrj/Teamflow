import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { INITIAL_ATTENDANCE_DATA, AttendanceRecord } from "@/data/teamflowData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const date = searchParams.get("date");

  if (!isDbConfigured()) {
    let result = INITIAL_ATTENDANCE_DATA;
    if (userId) result = result.filter((a) => a.userId === userId);
    if (date) result = result.filter((a) => a.date === date);
    return NextResponse.json({ attendance: result, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    let rows;

    if (userId && date) {
      rows = await sql`
        SELECT id, user_id, user_name, user_role, department, date, clock_in, clock_out, duration, status
        FROM attendance
        WHERE user_id = ${userId} AND date = ${date}
        ORDER BY created_at DESC, id ASC;
      `;
    } else if (userId) {
      rows = await sql`
        SELECT id, user_id, user_name, user_role, department, date, clock_in, clock_out, duration, status
        FROM attendance
        WHERE user_id = ${userId}
        ORDER BY created_at DESC, id ASC;
      `;
    } else if (date) {
      rows = await sql`
        SELECT id, user_id, user_name, user_role, department, date, clock_in, clock_out, duration, status
        FROM attendance
        WHERE date = ${date}
        ORDER BY created_at DESC, id ASC;
      `;
    } else {
      rows = await sql`
        SELECT id, user_id, user_name, user_role, department, date, clock_in, clock_out, duration, status
        FROM attendance
        ORDER BY created_at DESC, id ASC;
      `;
    }

    const attendance: AttendanceRecord[] = rows.map((r) => ({
      id: r.id as string,
      userId: r.user_id as string,
      userName: r.user_name as string,
      userRole: (r.user_role as AttendanceRecord["userRole"]) || "employer",
      department: (r.department as string) || "",
      date: r.date as string,
      clockIn: (r.clock_in as string) || "—",
      clockOut: (r.clock_out as string) || "—",
      duration: (r.duration as string) || "0h 0m 0s",
      status: (r.status as AttendanceRecord["status"]) || "Present",
    }));

    return NextResponse.json({ attendance, source: "database" });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ attendance: INITIAL_ATTENDANCE_DATA, source: "fallback_error" });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const { id, userId, userName, userRole, department, date, clockIn, clockOut, duration, status } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "Missing required fields (userId, date)" }, { status: 400 });
    }

    const recordId = id || `att-rec-${Date.now()}`;
    const sql = getDb();

    await sql`
      INSERT INTO attendance (id, user_id, user_name, user_role, department, date, clock_in, clock_out, duration, status)
      VALUES (
        ${recordId},
        ${userId},
        ${userName || ""},
        ${userRole || "employer"},
        ${department || ""},
        ${date},
        ${clockIn || "—"},
        ${clockOut || "—"},
        ${duration || "0h 0m 0s"},
        ${status || "Present"}
      )
      ON CONFLICT (id) DO UPDATE SET
        clock_in = EXCLUDED.clock_in,
        clock_out = EXCLUDED.clock_out,
        duration = EXCLUDED.duration,
        status = EXCLUDED.status;
    `;

    return NextResponse.json({ success: true, id: recordId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

