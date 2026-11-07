import { AttendanceRecord } from "@/data/teamflowData";

export interface GroupedAttendanceRow {
  id: string;
  userId: string;
  userName: string;
  userRole: AttendanceRecord["userRole"];
  date: string; // "2026-11-04 - 2026-11-06" or "2026-11-07"
  startDate: string; // for filtering and sorting
  endDate: string;
  isLeaveSpan: boolean;
  leaveDaysCount?: number;
  duration: string;
  status: AttendanceRecord["status"];
  leaveType?: string;
  leaveReason?: string;
  clockIn?: string;
  clockOut?: string;
  sessions?: AttendanceRecord["sessions"];
  originalRecords: AttendanceRecord[];
}

function parseDateUtc(dateStr: string): number {
  const parts = dateStr.split("-").map(Number);
  const y = parts[0] || 2026;
  const m = parts[1] || 1;
  const d = parts[2] || 1;
  return Date.UTC(y, m - 1, d);
}

/**
 * Checks if two dates are continuous (consecutive days or spanning a weekend).
 */
export function areContinuousLeaveDays(prevDateStr: string, nextDateStr: string): boolean {
  const prevTime = parseDateUtc(prevDateStr);
  const nextTime = parseDateUtc(nextDateStr);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((nextTime - prevTime) / dayMs);

  if (diffDays === 1) return true;

  // Over weekend (e.g. Friday to Monday is 3 days gap where Saturday and Sunday are skipped)
  if (diffDays <= 3 && diffDays > 1) {
    let allWeekend = true;
    for (let i = 1; i < diffDays; i++) {
      const intermediate = new Date(prevTime + i * dayMs);
      const dayOfWeek = intermediate.getUTCDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        allWeekend = false;
        break;
      }
    }
    if (allWeekend) return true;
  }

  return false;
}

/**
 * Groups consecutive days of leave into a single row (e.g. "2026-11-04 - 2026-11-06").
 * Non-leave records remain individual daily rows.
 */
export function groupAttendanceRecords(records: AttendanceRecord[]): GroupedAttendanceRow[] {
  if (!Array.isArray(records) || records.length === 0) return [];

  // Group by userId
  const byUser = new Map<string, AttendanceRecord[]>();
  for (const rec of records) {
    const list = byUser.get(rec.userId) || [];
    list.push(rec);
    byUser.set(rec.userId, list);
  }

  const result: GroupedAttendanceRow[] = [];

  for (const [, userRecords] of byUser.entries()) {
    // Non-leave records remain individual daily rows
    const nonLeave = userRecords.filter((r) => r.status !== "Leave");
    for (const r of nonLeave) {
      result.push({
        id: r.id,
        userId: r.userId,
        userName: r.userName,
        userRole: r.userRole,
        date: r.date,
        startDate: r.date,
        endDate: r.date,
        isLeaveSpan: false,
        duration: r.duration || "—",
        status: r.status,
        clockIn: r.clockIn,
        clockOut: r.clockOut,
        sessions: r.sessions,
        leaveType: r.leaveType,
        leaveReason: r.leaveReason,
        originalRecords: [r],
      });
    }

    // Leave records: sort chronologically ascending to group consecutive dates
    const leaveRecs = userRecords.filter((r) => r.status === "Leave");
    leaveRecs.sort((a, b) => a.date.localeCompare(b.date));

    let currentSpan: AttendanceRecord[] = [];

    for (let i = 0; i < leaveRecs.length; i++) {
      const curr = leaveRecs[i];
      if (currentSpan.length === 0) {
        currentSpan.push(curr);
      } else {
        const lastInSpan = currentSpan[currentSpan.length - 1];
        if (areContinuousLeaveDays(lastInSpan.date, curr.date)) {
          currentSpan.push(curr);
        } else {
          finishSpan(currentSpan, result);
          currentSpan = [curr];
        }
      }
    }

    if (currentSpan.length > 0) {
      finishSpan(currentSpan, result);
    }
  }

  return result;
}

function finishSpan(span: AttendanceRecord[], result: GroupedAttendanceRow[]) {
  if (span.length === 0) return;
  const first = span[0];
  const last = span[span.length - 1];
  const isMulti = span.length > 1;
  const dateStr = isMulti ? `${first.date} - ${last.date}` : first.date;

  result.push({
    id: `leave-span-${first.userId}-${first.date}-${last.date}`,
    userId: first.userId,
    userName: first.userName,
    userRole: first.userRole,
    date: dateStr,
    startDate: first.date,
    endDate: last.date,
    isLeaveSpan: isMulti,
    leaveDaysCount: span.length,
    duration: "—",
    status: "Leave",
    clockIn: "—",
    clockOut: "—",
    leaveType: first.leaveType || last.leaveType,
    leaveReason: first.leaveReason || last.leaveReason,
    originalRecords: span,
  });
}

