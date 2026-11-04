import { NextRequest, NextResponse } from "next/server";
import { getDb, initDatabase, isDbConfigured } from "@/lib/db";
import { LeaveRequest } from "@/data/teamflowData";

function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, "0");
    const d = String(curr.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates.length > 0 ? dates : [startStr];
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ leaveRequests: [], source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let rows;
    if (userId) {
      rows = await sql`
        SELECT id, user_id, user_name, user_role, start_date, end_date, leave_type, reason, status, applied_by_id, applied_by_name, reviewed_by_id, reviewed_by_name, reviewed_by_role, created_at
        FROM leave_requests
        WHERE user_id = ${userId}
        ORDER BY created_at DESC;
      `;
    } else {
      rows = await sql`
        SELECT id, user_id, user_name, user_role, start_date, end_date, leave_type, reason, status, applied_by_id, applied_by_name, reviewed_by_id, reviewed_by_name, reviewed_by_role, created_at
        FROM leave_requests
        ORDER BY created_at DESC;
      `;
    }

    const leaveRequests: LeaveRequest[] = rows.map((r) => ({
      id: r.id as string,
      userId: r.user_id as string,
      userName: r.user_name as string,
      userRole: r.user_role as LeaveRequest["userRole"],
      startDate: r.start_date as string,
      endDate: r.end_date as string,
      leaveType: r.leave_type as string,
      reason: (r.reason as string) || undefined,
      status: (r.status as LeaveRequest["status"]) || "Pending",
      appliedById: r.applied_by_id as string,
      appliedByName: r.applied_by_name as string,
      reviewedById: (r.reviewed_by_id as string) || undefined,
      reviewedByName: (r.reviewed_by_name as string) || undefined,
      reviewedByRole: (r.reviewed_by_role as "ceo" | "project_manager") || undefined,
      createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : undefined,
    }));

    return NextResponse.json({ leaveRequests, source: "database" });
  } catch (error: unknown) {
    console.error("GET /api/leaves error:", error);
    return NextResponse.json({ leaveRequests: [], source: "error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const {
      userId,
      userName,
      userRole,
      startDate,
      endDate,
      leaveType,
      reason,
      status = "Pending",
      appliedById,
      appliedByName,
      reviewedById,
      reviewedByName,
      reviewedByRole,
    } = body;

    if (!userId || !startDate || !leaveType) {
      return NextResponse.json({ error: "Missing required fields (userId, startDate, leaveType)" }, { status: 400 });
    }

    const sql = getDb();
    const requestId = `leave-${Date.now()}-${userId}`;
    const finalEndDate = endDate || startDate;
    const leaveStatus = status === "Approved" ? "Approved" : "Pending";
    const todayStr = getTodayString();

    await sql`
      INSERT INTO leave_requests (
        id, user_id, user_name, user_role, start_date, end_date, leave_type, reason, status, applied_by_id, applied_by_name, reviewed_by_id, reviewed_by_name, reviewed_by_role
      ) VALUES (
        ${requestId},
        ${userId},
        ${userName || ""},
        ${userRole || "employer"},
        ${startDate},
        ${finalEndDate},
        ${leaveType},
        ${reason || ""},
        ${leaveStatus},
        ${appliedById || userId},
        ${appliedByName || userName || ""},
        ${reviewedById || (leaveStatus === "Approved" ? appliedById : null)},
        ${reviewedByName || (leaveStatus === "Approved" ? appliedByName : null)},
        ${reviewedByRole || null}
      );
    `;

    // If marked as Approved (e.g. by CEO/PM or direct approval), write attendance records
    if (leaveStatus === "Approved") {
      const dates = getDatesInRange(startDate, finalEndDate);
      for (const date of dates) {
        const attId = `att-${userId}-${date}`;
        await sql`
          INSERT INTO attendance (
            id, user_id, user_name, user_role, date, clock_in, clock_out, duration, status, sessions, leave_type, leave_reason
          ) VALUES (
            ${attId},
            ${userId},
            ${userName || ""},
            ${userRole || "employer"},
            ${date},
            '—',
            '—',
            '—',
            'Leave',
            '[]'::jsonb,
            ${leaveType},
            ${reason || ""}
          )
          ON CONFLICT (id) DO UPDATE SET
            user_name = EXCLUDED.user_name,
            user_role = EXCLUDED.user_role,
            clock_in = '—',
            clock_out = '—',
            duration = '—',
            status = 'Leave',
            sessions = '[]'::jsonb,
            leave_type = EXCLUDED.leave_type,
            leave_reason = EXCLUDED.leave_reason;
        `;

        if (date === todayStr) {
          await sql`
            INSERT INTO clock_in_status (
              user_id, is_clocked_in, clock_in_timestamp, clock_in_time_string, clock_out_time_string, elapsed_seconds, clock_in_date, sessions
            ) VALUES (
              ${userId}, false, NULL, NULL, NULL, 0, ${todayStr}, '[]'::jsonb
            )
            ON CONFLICT (user_id) DO UPDATE SET
              is_clocked_in = false,
              clock_in_timestamp = NULL,
              clock_in_time_string = NULL,
              clock_out_time_string = NULL,
              elapsed_seconds = 0,
              sessions = '[]'::jsonb;
          `;
        }
      }
    }

    const createdRecord: LeaveRequest = {
      id: requestId,
      userId,
      userName: userName || "",
      userRole: userRole || "employer",
      startDate,
      endDate: finalEndDate,
      leaveType,
      reason: reason || undefined,
      status: leaveStatus,
      appliedById: appliedById || userId,
      appliedByName: appliedByName || userName || "",
      reviewedById: reviewedById || (leaveStatus === "Approved" ? appliedById : undefined),
      reviewedByName: reviewedByName || (leaveStatus === "Approved" ? appliedByName : undefined),
      reviewedByRole: (reviewedByRole as "ceo" | "project_manager") || undefined,
    };

    return NextResponse.json({ success: true, leaveRequest: createdRecord });
  } catch (error: unknown) {
    console.error("POST /api/leaves error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit leave request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const { id, status, reviewedById, reviewedByName, reviewedByRole } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields (id, status)" }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT id, user_id, user_name, user_role, start_date, end_date, leave_type, reason
      FROM leave_requests
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const reqData = rows[0];
    const todayStr = getTodayString();

    await sql`
      UPDATE leave_requests
      SET
        status = ${status},
        reviewed_by_id = ${reviewedById || null},
        reviewed_by_name = ${reviewedByName || null},
        reviewed_by_role = ${reviewedByRole || null}
      WHERE id = ${id};
    `;

    if (status === "Approved") {
      const dates = getDatesInRange(reqData.start_date as string, reqData.end_date as string);
      for (const date of dates) {
        const attId = `att-${reqData.user_id}-${date}`;
        await sql`
          INSERT INTO attendance (
            id, user_id, user_name, user_role, date, clock_in, clock_out, duration, status, sessions, leave_type, leave_reason
          ) VALUES (
            ${attId},
            ${reqData.user_id},
            ${reqData.user_name || ""},
            ${reqData.user_role || "employer"},
            ${date},
            '—',
            '—',
            '—',
            'Leave',
            '[]'::jsonb,
            ${reqData.leave_type},
            ${reqData.reason || ""}
          )
          ON CONFLICT (id) DO UPDATE SET
            user_name = EXCLUDED.user_name,
            user_role = EXCLUDED.user_role,
            clock_in = '—',
            clock_out = '—',
            duration = '—',
            status = 'Leave',
            sessions = '[]'::jsonb,
            leave_type = EXCLUDED.leave_type,
            leave_reason = EXCLUDED.leave_reason;
        `;

        if (date === todayStr) {
          await sql`
            INSERT INTO clock_in_status (
              user_id, is_clocked_in, clock_in_timestamp, clock_in_time_string, clock_out_time_string, elapsed_seconds, clock_in_date, sessions
            ) VALUES (
              ${reqData.user_id}, false, NULL, NULL, NULL, 0, ${todayStr}, '[]'::jsonb
            )
            ON CONFLICT (user_id) DO UPDATE SET
              is_clocked_in = false,
              clock_in_timestamp = NULL,
              clock_in_time_string = NULL,
              clock_out_time_string = NULL,
              elapsed_seconds = 0,
              sessions = '[]'::jsonb;
          `;
        }
      }
    }

    return NextResponse.json({ success: true, id, status });
  } catch (error: unknown) {
    console.error("PATCH /api/leaves error:", error);
    const message = error instanceof Error ? error.message : "Failed to update leave request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

