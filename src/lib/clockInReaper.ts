import { getDb } from "@/lib/db";

// 2 minutes threshold (8 missed 15s heartbeats) - indicates laptop shutdown, sleep, or closed browser
export const STALE_HEARTBEAT_THRESHOLD_MS = 2 * 60 * 1000;

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

export async function reapStaleClockInSessions(sql: ReturnType<typeof getDb>): Promise<number> {
  const now = Date.now();
  let reapedCount = 0;

  try {
    const rows = await sql`
      SELECT user_id, is_clocked_in, clock_in_timestamp, clock_in_time_string, clock_out_time_string, elapsed_seconds, clock_in_date, sessions, last_heartbeat, updated_at
      FROM clock_in_status
      WHERE is_clocked_in = true;
    `;

    for (const r of rows) {
      const clockInTimestamp = r.clock_in_timestamp ? Number(r.clock_in_timestamp) : null;
      if (!clockInTimestamp) continue;

      const lastHeartbeat = r.last_heartbeat ? Number(r.last_heartbeat) : null;
      const lastActivity = lastHeartbeat || (r.updated_at ? new Date(r.updated_at).getTime() : clockInTimestamp);
      const gap = now - lastActivity;

      if (gap > STALE_HEARTBEAT_THRESHOLD_MS) {
        // Auto-close abandoned session at the exact last confirmed activity timestamp (shutdown / sleep time)
        const targetTimestamp = Math.max(clockInTimestamp, lastActivity);
        const sessionSeconds = Math.max(1, Math.floor((targetTimestamp - clockInTimestamp) / 1000));
        const totalElapsed = Number(r.elapsed_seconds || 0) + sessionSeconds;
        const outDateObj = new Date(targetTimestamp);
        const autoOutTimeStr = outDateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const formattedDuration = formatSecondsToDuration(totalElapsed);
        const sessionDuration = formatSecondsToDuration(sessionSeconds);

        const curSessions = Array.isArray(r.sessions) ? [...r.sessions] : [];
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
            clockIn: (r.clock_in_time_string as string) || autoOutTimeStr,
            clockOut: autoOutTimeStr,
            duration: formattedDuration,
            elapsedSeconds: totalElapsed,
          });
        }

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

          const targetDate = (r.clock_in_date as string) || getLocalDateString(outDateObj);
          await sql`
            UPDATE attendance
            SET clock_out = ${autoOutTimeStr},
                duration = ${formattedDuration},
                status = 'Checked Out',
                sessions = ${JSON.stringify(curSessions)}::jsonb
            WHERE user_id = ${r.user_id} AND date = ${targetDate};
          `;
          reapedCount++;
        } catch (reapErr) {
          console.warn("Failed to reap stale session for", r.user_id, reapErr);
        }
      }
    }
  } catch (err) {
    console.warn("Error running reapStaleClockInSessions:", err);
  }

  return reapedCount;
}
