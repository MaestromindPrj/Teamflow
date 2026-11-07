import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";

function formatSecondsToDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    let body: { userId?: string; timestamp?: number; reason?: string } = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const { userId, timestamp, reason = "tab_closed" } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await initDatabase();
    const sql = getDb();

    const rows = await sql`
      SELECT user_id, is_clocked_in, clock_in_timestamp, clock_in_time_string, clock_out_time_string, elapsed_seconds, clock_in_date, sessions
      FROM clock_in_status
      WHERE user_id = ${userId};
    `;

    if (rows.length === 0 || !rows[0].is_clocked_in) {
      return NextResponse.json({
        success: true,
        message: "User was already clocked out",
        userId,
      });
    }

    const row = rows[0];
    const clockInTimestamp = Number(row.clock_in_timestamp || Date.now());
    const targetTimestamp = Number(timestamp) && Number(timestamp) >= clockInTimestamp
      ? Number(timestamp)
      : Date.now();

    const sessionSeconds = Math.max(1, Math.floor((targetTimestamp - clockInTimestamp) / 1000));
    const totalElapsed = Number(row.elapsed_seconds || 0) + sessionSeconds;

    const clockOutDateObj = new Date(targetTimestamp);
    const clockOutTimeString = clockOutDateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const formattedDuration = formatSecondsToDuration(totalElapsed);
    const sessionDuration = formatSecondsToDuration(sessionSeconds);

    const existingSessions = Array.isArray(row.sessions) ? [...row.sessions] : [];
    let updatedSessions: Array<{
      sessionNumber: number;
      clockIn: string;
      clockOut: string | null;
      duration?: string;
      elapsedSeconds?: number;
    }>;

    if (existingSessions.length > 0) {
      updatedSessions = existingSessions.map((s, idx) => {
        if (idx === existingSessions.length - 1) {
          return {
            ...s,
            clockOut: clockOutTimeString,
            duration: sessionDuration,
            elapsedSeconds: sessionSeconds,
          };
        }
        return s;
      });
    } else {
      updatedSessions = [
        {
          sessionNumber: 1,
          clockIn: (row.clock_in_time_string as string) || clockOutTimeString,
          clockOut: clockOutTimeString,
          duration: formattedDuration,
          elapsedSeconds: totalElapsed,
        },
      ];
    }

    const clockInDate = (row.clock_in_date as string) || getLocalDateString(clockOutDateObj);

    // Update clock_in_status
    await sql`
      UPDATE clock_in_status
      SET is_clocked_in = false,
          clock_in_timestamp = NULL,
          clock_out_time_string = ${clockOutTimeString},
          elapsed_seconds = ${totalElapsed},
          sessions = ${JSON.stringify(updatedSessions)}::jsonb,
          last_heartbeat = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId};
    `;

    // Update attendance record for today
    await sql`
      UPDATE attendance
      SET clock_out = ${clockOutTimeString},
          duration = ${formattedDuration},
          status = 'Checked Out',
          sessions = ${JSON.stringify(updatedSessions)}::jsonb
      WHERE user_id = ${userId} AND date = ${clockInDate};
    `;

    return NextResponse.json({
      success: true,
      userId,
      reason,
      clockOutTimeString,
      duration: formattedDuration,
      totalElapsed,
      sessions: updatedSessions,
      clockInDate,
    });
  } catch (error: unknown) {
    console.error("POST /api/clock-in/auto-out error:", error);
    const message = error instanceof Error ? error.message : "Auto clock-out failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
