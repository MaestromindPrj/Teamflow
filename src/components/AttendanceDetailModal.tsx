"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Mail,
  FolderKanban,
  History,
  LogOut,
  CalendarDays,
  Filter,
  Check
} from "lucide-react";
import { useTeamFlow, getLocalDateString, formatSecondsToDuration } from "@/context/TeamFlowContext";
import { StatusBadge } from "@/components/Badges";
import { AttendanceRecord } from "@/data/teamflowData";
import UserAvatar from "@/components/UserAvatar";
import { GroupedAttendanceRow, groupAttendanceRecords } from "@/utils/attendanceGrouping";

interface AttendanceDetailModalProps {
  record: GroupedAttendanceRow | AttendanceRecord | null;
  onClose: () => void;
}

export default function AttendanceDetailModal({
  record,
  onClose
}: AttendanceDetailModalProps) {
  const { users, projects, userClockInData, attendance } = useTeamFlow();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [periodFilter, setPeriodFilter] = useState<"3" | "7" | "15" | "30" | "all">("7");
  const [statusFilter, setStatusFilter] = useState<"all" | "worked" | "leave">("all");

  useEffect(() => {
    setCurrentTime(Date.now());
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayString = getLocalDateString(new Date());

  const targetUserId = record?.userId;
  const staffUser = users.find((u) => u.id === targetUserId);
  const clockState = targetUserId ? userClockInData[targetUserId] : undefined;

  // Gather all raw records for this user from state
  const userAllRawAttendance = useMemo(() => {
    if (!targetUserId) return [];
    return attendance.filter((r) => r.userId === targetUserId);
  }, [attendance, targetUserId]);

  // Group continuous leave into single rows (e.g. 2026-11-04 - 2026-11-06)
  const groupedUserHistory = useMemo(() => {
    return groupAttendanceRecords(userAllRawAttendance);
  }, [userAllRawAttendance]);

  // Filter history based on selected period & status
  const filteredHistory = useMemo(() => {
    let list = [...groupedUserHistory];

    if (periodFilter !== "all") {
      const days = Number(periodFilter);
      const cutoff = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
      const cutoffStr = getLocalDateString(cutoff);
      list = list.filter((r) => r.endDate >= cutoffStr);
    }

    if (statusFilter === "worked") {
      list = list.filter((r) => r.status !== "Leave");
    } else if (statusFilter === "leave") {
      list = list.filter((r) => r.status === "Leave");
    }

    // Sort descending by date (newest first)
    list.sort((a, b) => {
      const aIsToday = a.startDate <= todayString && todayString <= a.endDate;
      const bIsToday = b.startDate <= todayString && todayString <= b.endDate;
      if (aIsToday && !bIsToday) return -1;
      if (bIsToday && !aIsToday) return 1;
      return b.endDate.localeCompare(a.endDate);
    });

    return list;
  }, [groupedUserHistory, periodFilter, statusFilter, todayString]);

  // Compute summary stats for the filtered period
  const stats = useMemo(() => {
    let daysWorked = 0;
    let daysLeave = 0;
    let totalSeconds = 0;

    filteredHistory.forEach((row) => {
      if (row.status === "Leave") {
        daysLeave += row.leaveDaysCount || 1;
      } else {
        daysWorked += 1;
        // Parse duration like "07h 15m 24s" or "7h 15m 24s"
        const match = row.duration.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
        if (match) {
          const h = parseInt(match[1], 10) || 0;
          const m = parseInt(match[2], 10) || 0;
          const s = parseInt(match[3], 10) || 0;
          totalSeconds += h * 3600 + m * 60 + s;
        }
      }
    });

    // Add active clock-in live elapsed seconds if currently working today
    const isWorkingNow = clockState?.isClockedIn === true;
    if (isWorkingNow && clockState?.clockInTimestamp) {
      const liveAdd = Math.max(0, Math.floor((currentTime - clockState.clockInTimestamp) / 1000));
      totalSeconds += liveAdd;
    }

    return {
      daysWorked,
      daysLeave,
      totalDurationFormatted: formatSecondsToDuration(totalSeconds)
    };
  }, [filteredHistory, clockState, currentTime]);

  if (!record || !staffUser) return null;

  const isWorkingNow = clockState?.isClockedIn === true;

  let currentLiveStatus: AttendanceRecord["status"] = "Checked Out";
  if (isWorkingNow) {
    currentLiveStatus = "Present";
  } else if (
    userAllRawAttendance.some(
      (r) => r.date === todayString && r.status === "Leave"
    )
  ) {
    currentLiveStatus = "Leave";
  } else if (clockState?.clockOutTimeString) {
    currentLiveStatus = "Checked Out";
  }

  const userProjects = projects.filter(
    (p) =>
      p.teamMemberIds.includes(staffUser.id) ||
      p.teamLeadId === staffUser.id ||
      p.projectManagerId === staffUser.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                  Work Duration &amp; Attendance History
                </h2>
              </div>
              <p className="text-[12px] text-slate-500">
                Complete workday logs, leave records, and project assignments for {staffUser.fullName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* User Profile Card */}
          <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
            <UserAvatar
              src={staffUser.avatar}
              name={staffUser.fullName}
              role={staffUser.role}
              className="w-13 h-13 rounded-full border-2 border-white shadow-2xs shrink-0"
              textClassName="text-[15px]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[16px] font-bold text-slate-900 truncate">
                    {staffUser.fullName}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-100 text-[#0084d4] border border-sky-200/70">
                    {staffUser.jobTitle || (staffUser.role === "project_manager" ? "Project Manager" : "Employer")}
                  </span>
                </div>
                <StatusBadge status={currentLiveStatus} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {staffUser.email}
                </span>
                <span>&bull;</span>
                <span className="capitalize">{staffUser.role === "project_manager" ? "Project Manager" : "Employer"}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics for the selected period */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Days Worked
              </span>
              <div className="text-[20px] font-extrabold text-slate-900 leading-none">
                {stats.daysWorked} {stats.daysWorked === 1 ? "Day" : "Days"}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">In selected period</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Work Duration
              </span>
              <div className="font-mono text-[16px] font-bold text-[#0084d4] leading-none">
                {stats.totalDurationFormatted}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Cumulative hours logged</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Leave Days
              </span>
              <div className="text-[20px] font-extrabold text-amber-700 leading-none">
                {stats.daysLeave} {stats.daysLeave === 1 ? "Day" : "Days"}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Approved time-off</span>
            </div>
          </div>

          {/* Work Duration History Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#0084d4]" />
                <h4 className="text-[13px] font-bold text-slate-900 tracking-tight">
                  Work Duration History
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                  {filteredHistory.length} {filteredHistory.length === 1 ? "Entry" : "Entries"}
                </span>
              </div>

              {/* Filters for Period and Status */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px] font-semibold">
                  {(["3", "7", "15", "30", "all"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPeriodFilter(opt)}
                      className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        periodFilter === opt
                          ? "bg-white text-[#0084d4] font-bold shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {opt === "all" ? "All" : `${opt}D`}
                    </button>
                  ))}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "worked" | "leave")}
                  aria-label="Filter by Status"
                  className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-[#0084d4] cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="worked">Worked Only</option>
                  <option value="leave">Leave Only</option>
                </select>
              </div>
            </div>

            {/* History Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Work Duration (H:M:S)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-[12px]">
                        No attendance or workday records found for this filter period.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((row) => {
                      const isRowToday = row.startDate <= todayString && todayString <= row.endDate;
                      const isRowWorkingNow = isRowToday && isWorkingNow && row.status !== "Leave";

                      let durationText = row.duration;
                      if (row.status === "Leave") {
                        durationText = "—";
                      } else if (isRowWorkingNow && clockState?.clockInTimestamp) {
                        const elapsed =
                          (clockState.elapsedSeconds || 0) +
                          Math.max(0, Math.floor((currentTime - clockState.clockInTimestamp) / 1000));
                        durationText = formatSecondsToDuration(elapsed);
                      }

                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isRowToday ? "bg-sky-50/30" : ""
                          }`}
                        >
                          {/* Date Column (handles single dates or grouped continuous leave) */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {isRowToday && (
                                <span className="w-2 h-2 rounded-full bg-[#0084d4] shrink-0" title="Today" />
                              )}
                              <span className="font-semibold text-slate-800">
                                {row.date}
                              </span>
                              {row.isLeaveSpan && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  {row.leaveDaysCount} Days
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Work Duration Column */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {isRowWorkingNow ? (
                              <span className="font-mono font-bold text-[11px] text-[#4ade1d] bg-[#4ade1d]/15 px-2 py-0.5 rounded-md border border-[#4ade1d]/30 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade1d] animate-ping" />
                                {durationText}
                              </span>
                            ) : row.status === "Leave" ? (
                              <span className="text-slate-400 font-mono">—</span>
                            ) : (
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {durationText}
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <StatusBadge status={isRowWorkingNow ? "Present" : row.status} />
                          </td>

                          {/* Details / Notes */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {row.status === "Leave" ? (
                              <div className="text-[11px] text-amber-800 font-medium">
                                <span className="font-semibold">{row.leaveType || "Approved Leave"}</span>
                                {row.leaveReason ? (
                                  <span className="text-slate-400 block text-[10px] truncate max-w-[180px]">
                                    &ldquo;{row.leaveReason}&rdquo;
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 font-mono">
                                {row.clockIn && row.clockIn !== "—" ? (
                                  <span>
                                    {row.clockIn} &rarr; {isRowWorkingNow ? "Now" : row.clockOut || "—"}
                                  </span>
                                ) : (
                                  <span>Workday shift</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Project Initiatives Section (Preserved) */}
          {userProjects.length > 0 && (
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-[#0084d4]" />
                <span>Active Project Initiatives ({userProjects.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {userProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[12px] text-slate-900 truncate">
                          {proj.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-sky-50 text-[#0084d4] border border-sky-100">
                          {proj.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {proj.category || "General"} &bull; Priority: {proj.priority}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
