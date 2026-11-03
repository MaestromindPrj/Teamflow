import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { UserClockInState } from "@/context/TeamFlowContext";

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

const DEFAULT_CLOCK_IN_DATA: Record<string, UserClockInState> = {
  "u-ceo-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
  },
  "u-pm-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
  },
  "u-pm-2": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
  },
  "u-emp-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
  },
  "u-emp-2": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
  },
  "u-emp-3": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
  },
  "u-emp-4": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
  },
  "u-emp-5": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
  },
};

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ clockInData: DEFAULT_CLOCK_IN_DATA, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT user_id, is_clocked_in, clock_in_timestamp, clock_in_time_string, clock_out_time_string, elapsed_seconds, clock_in_date, sessions, last_heartbeat, updated_at
      FROM clock_in_status;
    `;

    const clockInData: Record<string, UserClockInState> = { ...DEFAULT_CLOCK_IN_DATA };
    const now = Date.now();
    const STALE_HEARTBEAT_THRESHOLD_MS = 120_000; // 2 minutes without heartbeat

    for (const r of rows) {
      let isClockedIn = Boolean(r.is_clocked_in);
      let clockInTimestamp = r.clock_in_timestamp ? Number(r.clock_in_timestamp) : null;
      let clockInTimeString = (r.clock_in_time_string as string) || null;
      let clockOutTimeString = (r.clock_out_time_string as string) || null;
      let elapsedSeconds = Number(r.elapsed_seconds || 0);
      let sessions = Array.isArray(r.sessions) ? r.sessions : undefined;
      const clockInDate = (r.clock_in_date as string) || undefined;
      const lastHeartbeat = r.last_heartbeat ? Number(r.last_heartbeat) : null;

      // Reaping check: If marked clocked-in, but application has been inactive/closed for > 2 mins
      if (isClockedIn && clockInTimestamp) {
        const lastActivity = lastHeartbeat || (r.updated_at ? new Date(r.updated_at).getTime() : clockInTimestamp);
        const gap = now - lastActivity;

        if (gap > STALE_HEARTBEAT_THRESHOLD_MS) {
          // Auto-close abandoned session at lastActivity timestamp
          const targetTimestamp = Math.max(clockInTimestamp, lastActivity);
          const sessionSeconds = Math.max(1, Math.floor((targetTimestamp - clockInTimestamp) / 1000));
          const totalElapsed = elapsedSeconds + sessionSeconds;
          const outDateObj = new Date(targetTimestamp);
          const autoOutTimeStr = outDateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          const formattedDuration = formatSecondsToDuration(totalElapsed);
          const sessionDuration = formatSecondsToDuration(sessionSeconds);

          const curSessions = Array.isArray(sessions) ? [...sessions] : [];
          if (curSessions.length > 0) {
            const lastIdx = curSessions.length - 1;
            curSessions[lastIdx] = {
              ...curSessions[lastIdx],
              clockOut: autoOutTimeStr,
              duration: sessionDuration,
              elapsedSeconds: sessionSeconds,
            };
          } else {
            curSessions.push({
              sessionNumber: 1,
              clockIn: clockInTimeString || autoOutTimeStr,
              clockOut: autoOutTimeStr,
              duration: formattedDuration,
              elapsedSeconds: totalElapsed,
            });
          }

          // Persist the auto-clock-out
          try {
            await sql`
              UPDATE clock_in_status
              SET is_clocked_in = false,
                  clock_in_timestamp = NULL,
                  clock_out_time_string = ${autoOutTimeStr},
                  elapsed_seconds = ${totalElapsed},
                  sessions = ${JSON.stringify(curSessions)}::jsonb,
                  last_heartbeat = NULL,
                  updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ${r.user_id};
            `;

            const targetDate = clockInDate || getLocalDateString(outDateObj);
            await sql`
              UPDATE attendance
              SET clock_out = ${autoOutTimeStr},
                  duration = ${formattedDuration},
                  status = 'Checked Out',
                  sessions = ${JSON.stringify(curSessions)}::jsonb
              WHERE user_id = ${r.user_id} AND date = ${targetDate};
            `;
          } catch (reapErr) {
            console.warn("Failed to reap stale session for", r.user_id, reapErr);
          }

          isClockedIn = false;
          clockInTimestamp = null;
          clockOutTimeString = autoOutTimeStr;
          elapsedSeconds = totalElapsed;
          sessions = curSessions;
        }
      }

      clockInData[r.user_id as string] = {
        isClockedIn,
        clockInTimestamp,
        clockInTimeString,
        clockOutTimeString,
        elapsedSeconds,
        clockInDate,
        sessions,
        lastHeartbeat,
      };
    }

    return NextResponse.json({ clockInData, source: "database" });
  } catch (error) {
    console.error("GET /api/clock-in error:", error);
    return NextResponse.json({ clockInData: DEFAULT_CLOCK_IN_DATA, source: "fallback_error" });
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
      userId,
      isClockedIn,
      clockInTimestamp,
      clockInTimeString,
      clockOutTimeString,
      elapsedSeconds,
      clockInDate,
      sessions,
      lastHeartbeat,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const heartbeatVal = isClockedIn
      ? Number(lastHeartbeat || Date.now())
      : null;

    const sql = getDb();
    await sql`
      INSERT INTO clock_in_status (
        user_id, is_clocked_in, clock_in_timestamp, clock_in_time_string, clock_out_time_string, elapsed_seconds, clock_in_date, sessions, last_heartbeat, updated_at
      )
      VALUES (
        ${userId},
        ${Boolean(isClockedIn)},
        ${clockInTimestamp ? Number(clockInTimestamp) : null},
        ${clockInTimeString || null},
        ${clockOutTimeString || null},
        ${Number(elapsedSeconds || 0)},
        ${clockInDate || null},
        ${JSON.stringify(sessions || [])}::jsonb,
        ${heartbeatVal},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id) DO UPDATE SET
        is_clocked_in = EXCLUDED.is_clocked_in,
        clock_in_timestamp = EXCLUDED.clock_in_timestamp,
        clock_in_time_string = EXCLUDED.clock_in_time_string,
        clock_out_time_string = EXCLUDED.clock_out_time_string,
        elapsed_seconds = EXCLUDED.elapsed_seconds,
        clock_in_date = EXCLUDED.clock_in_date,
        sessions = EXCLUDED.sessions,
        last_heartbeat = EXCLUDED.last_heartbeat,
        updated_at = CURRENT_TIMESTAMP;
    `;

    return NextResponse.json({ success: true, userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update clock-in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
