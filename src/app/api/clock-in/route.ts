import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { UserClockInState } from "@/context/TeamFlowContext";

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
      SELECT user_id, is_clocked_in, clock_in_timestamp, clock_in_time_string, clock_out_time_string, elapsed_seconds
      FROM clock_in_status;
    `;

    const clockInData: Record<string, UserClockInState> = { ...DEFAULT_CLOCK_IN_DATA };

    rows.forEach((r) => {
      clockInData[r.user_id as string] = {
        isClockedIn: Boolean(r.is_clocked_in),
        clockInTimestamp: r.clock_in_timestamp ? Number(r.clock_in_timestamp) : null,
        clockInTimeString: (r.clock_in_time_string as string) || null,
        clockOutTimeString: (r.clock_out_time_string as string) || null,
        elapsedSeconds: Number(r.elapsed_seconds || 0),
      };
    });

    return NextResponse.json({ clockInData, source: "database" });
  } catch (error) {
    console.error("GET /api/clock-in error:", error);
    return NextResponse.json({ clockInData: DEFAULT_CLOCK_IN_DATA, source: "fallback_error" });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const { userId, isClockedIn, clockInTimestamp, clockInTimeString, clockOutTimeString, elapsedSeconds } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      INSERT INTO clock_in_status (
        user_id, is_clocked_in, clock_in_timestamp, clock_in_time_string, clock_out_time_string, elapsed_seconds, updated_at
      )
      VALUES (
        ${userId},
        ${Boolean(isClockedIn)},
        ${clockInTimestamp ? Number(clockInTimestamp) : null},
        ${clockInTimeString || null},
        ${clockOutTimeString || null},
        ${Number(elapsedSeconds || 0)},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id) DO UPDATE SET
        is_clocked_in = EXCLUDED.is_clocked_in,
        clock_in_timestamp = EXCLUDED.clock_in_timestamp,
        clock_in_time_string = EXCLUDED.clock_in_time_string,
        clock_out_time_string = EXCLUDED.clock_out_time_string,
        elapsed_seconds = EXCLUDED.elapsed_seconds,
        updated_at = CURRENT_TIMESTAMP;
    `;

    return NextResponse.json({ success: true, userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update clock-in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

