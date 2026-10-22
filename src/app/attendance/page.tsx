"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Users,
  Shield,
  UserCheck,
  Search,
  CheckCheck,
  LogOut,
  Briefcase
} from "lucide-react";
import Header from "@/components/Header";
import { StatusBadge } from "@/components/Badges";
import { useTeamFlow } from "@/context/TeamFlowContext";
import AttendanceDetailModal from "@/components/AttendanceDetailModal";
import { AttendanceRecord } from "@/data/teamflowData";
import InPageSubTabs, { SubTabItem } from "@/components/InPageSubTabs";

export default function AttendancePage() {
  const {
    currentUser,
    attendance,
    isClockedIn,
    toggleClockInOut,
    users,
    projects,
    userClockInData
  } = useTeamFlow();

  const [roleFilter, setRoleFilter] = useState<"All" | "project_manager" | "employer">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Ticker for real-time calculation of check-in duration
  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";

  // For Project Managers, scope records to projects under their management + their own check-in
  const myManagedProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const myEmployerIds = new Set(
    myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
  );

  const pmAllowedUserIds = new Set([currentUser.id, ...Array.from(myEmployerIds)]);

  // Base attendance records
  const baseAttendance = isCeo
    ? attendance
    : isPm
    ? attendance.filter((rec) => pmAllowedUserIds.has(rec.userId))
    : attendance.filter((rec) => rec.userId === currentUser.id);

  // Visible records based on current role permissions
  const visibleAttendance = baseAttendance.filter((rec) => {
    if (isCeo || isPm) {
      if (roleFilter !== "All" && rec.userRole !== roleFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          rec.userName.toLowerCase().includes(query) ||
          rec.department.toLowerCase().includes(query) ||
          rec.userRole.toLowerCase().includes(query)
        );
      }
      return true;
    }
    return true;
  });

  const totalStaffRecords = baseAttendance.filter((r) => r.userRole !== "ceo");
  const pmRecordsCount = baseAttendance.filter((r) => r.userRole === "project_manager").length;
  const employerRecordsCount = baseAttendance.filter((r) => r.userRole === "employer").length;

  // Active check-in counts
  const currentlyActiveCount = baseAttendance.filter((r) => {
    const state = userClockInData[r.userId];
    if (state) return state.isClockedIn;
    return r.clockOut === "—" && r.status !== "Leave";
  }).length;

  const checkedOutCount = baseAttendance.filter((r) => {
    const state = userClockInData[r.userId];
    if (state) return !state.isClockedIn && state.clockOutTimeString !== null;
    return r.clockOut !== "—" && r.status !== "Leave";
  }).length;

  const lateCount = baseAttendance.filter((r) => r.status === "Late").length;
  const leaveCount = baseAttendance.filter((r) => r.status === "Leave").length;
  const attendanceRate =
    totalStaffRecords.length > 0
      ? Math.round(((totalStaffRecords.length - leaveCount) / totalStaffRecords.length) * 100)
      : 100;

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Attendance & Workday Logs"
        subtitle={
          isCeo
            ? "Executive workforce roster: monitor real-time check-in and check-out logs of all Project Managers and Employers"
            : isPm
            ? "Team attendance monitoring and personal workday punch clock"
            : "Personal workday records, attendance rate, and punch clock"
        }
      />

      <div className="px-7 py-6 space-y-6">
        {/* Metric Cards Banner */}
        <div
          className={`grid gap-4 ${
            isCeo
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
          }`}
        >
          {/* Punch clock card for employers / PMs only - CEO never has punch clock */}
          {!isCeo && (
            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-500">My Status Today</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                    isClockedIn ? "bg-[#4ade1d]/15 text-[#4ade1d]" : "bg-[#ffa500]/15 text-[#ffa500]"
                  }`}
                >
                  {isClockedIn ? "Clocked In" : "Clocked Out"}
                </span>
              </div>
              <div className="mt-3">
                <button
                  onClick={toggleClockInOut}
                  className={`w-full py-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer shadow-xs ${
                    isClockedIn
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-[#0084d4] text-white hover:bg-[#0277bd]"
                  }`}
                >
                  {isClockedIn ? "Punch Out" : "Punch Clock In"}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
            <span className="text-[12px] font-medium text-slate-500">Currently Active</span>
            <div className="mt-1 text-[24px] font-bold text-[#4ade1d] leading-none flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4ade1d] animate-ping" />
              <span>{currentlyActiveCount} Working</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Checked in and on duty now</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
            <span className="text-[12px] font-medium text-slate-500">Checked Out</span>
            <div className="mt-1 text-[24px] font-bold text-slate-700 leading-none">
              {checkedOutCount} Completed
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Logged out after shift</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
            <span className="text-[12px] font-medium text-slate-500">Late Arrivals</span>
            <div className="mt-1 text-[24px] font-bold text-[#ffa500] leading-none">
              {lateCount} Members
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Clocked after 09:30 AM</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
            <span className="text-[12px] font-medium text-slate-500">On Approved Leave</span>
            <div className="mt-1 text-[24px] font-bold text-slate-700 leading-none">
              {leaveCount} Member
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Scheduled time-off</p>
          </div>

          {isCeo && (
            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
              <span className="text-[12px] font-medium text-slate-500">Workforce Presence</span>
              <div className="mt-1 text-[24px] font-bold text-[#0084d4] leading-none">
                {attendanceRate}%
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Active staffing rate</p>
            </div>
          )}
        </div>

        {/* Navigation In-Page Subtabs */}
        {(isCeo || isPm) && (
          <InPageSubTabs<"All" | "project_manager" | "employer">
            activeTab={roleFilter}
            onChange={(filter) => setRoleFilter(filter)}
            tabs={[
              {
                id: "All",
                label: isPm ? "All My Team" : "All",
                icon: <Users className="w-4 h-4" />,
                count: totalStaffRecords.length,
              },
              ...(isCeo
                ? [
                    {
                      id: "project_manager" as const,
                      label: "Project Managers",
                      icon: <Shield className="w-4 h-4" />,
                      count: pmRecordsCount,
                    },
                  ]
                : []),
              {
                id: "employer",
                label: "Employers",
                icon: <Briefcase className="w-4 h-4" />,
                count: employerRecordsCount,
              },
            ]}
          />
        )}

        {/* Attendance Records Table */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                {isCeo
                  ? "Executive Workforce Attendance Roster"
                  : isPm
                  ? "Team Workday Logs"
                  : "My Attendance Logs"}
              </h2>
              <p className="text-[12px] text-slate-500">
                Detailed check-in time, check-out time, and live elapsed work hours for all
              </p>
            </div>

            {(isCeo || isPm) && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employee..."
                  className="pl-8 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0084d4] w-48 sm:w-60"
                />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-3">Employee</th>
                  <th className="pb-3 px-3">Role &amp; Department</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Check-In Time</th>
                  <th className="pb-3 px-3">Check-Out Time</th>
                  <th className="pb-3 px-3">Work Duration (H:M:S)</th>
                  <th className="pb-3 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {visibleAttendance.map((row) => {
                  const staffUser = users.find((u) => u.id === row.userId);
                  const clockState = userClockInData[row.userId];

                  const isWorkingNow = clockState
                    ? clockState.isClockedIn
                    : row.clockOut === "—" && row.status !== "Leave";

                  const checkInTime = clockState?.clockInTimeString || row.clockIn;
                  const checkOutTime = isWorkingNow
                    ? null
                    : clockState?.clockOutTimeString || (row.clockOut !== "—" ? row.clockOut : null);

                  // Calculate live duration in seconds
                  let liveDurationStr = row.duration;
                  if (row.status === "Leave") {
                    liveDurationStr = "—";
                  } else if (isWorkingNow && clockState?.clockInTimestamp) {
                    const elapsed =
                      (clockState.elapsedSeconds || 0) +
                      Math.max(0, Math.floor((currentTime - clockState.clockInTimestamp) / 1000));
                    const h = Math.floor(elapsed / 3600);
                    const m = Math.floor((elapsed % 3600) / 60);
                    const s = elapsed % 60;
                    liveDurationStr = `${String(h).padStart(2, "0")}h ${String(m).padStart(
                      2,
                      "0"
                    )}m ${String(s).padStart(2, "0")}s`;
                  } else if (clockState?.elapsedSeconds) {
                    const elapsed = clockState.elapsedSeconds;
                    const h = Math.floor(elapsed / 3600);
                    const m = Math.floor((elapsed % 3600) / 60);
                    const s = elapsed % 60;
                    liveDurationStr = `${String(h).padStart(2, "0")}h ${String(m).padStart(
                      2,
                      "0"
                    )}m ${String(s).padStart(2, "0")}s`;
                  }

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRecord(row)}
                      className="hover:bg-sky-50/60 transition-colors cursor-pointer group"
                      title="Click to view complete workday attendance dossier"
                    >
                      {/* Employee Info */}
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          {staffUser?.avatar ? (
                            <img
                              src={staffUser.avatar}
                              alt={row.userName}
                              className="w-[34px] h-[34px] rounded-full object-cover border border-slate-200 shrink-0 group-hover:border-[#0084d4] transition-colors"
                            />
                          ) : (
                            <div className="w-[34px] h-[34px] rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px] shrink-0">
                              {row.userName.substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight group-hover:text-[#0084d4] transition-colors">
                              {row.userName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {staffUser?.jobTitle || staffUser?.email || "TeamFlow Staff"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td className="py-3.5 px-3">
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              row.userRole === "project_manager"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                                : "bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30"
                            }`}
                          >
                            {row.userRole === "project_manager" ? "Project Manager" : "Employer"}
                          </span>
                          <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                            {row.department}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-600 text-[12px] whitespace-nowrap">
                        {row.date}
                      </td>

                      {/* Check-In Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {checkInTime && checkInTime !== "—" ? (
                          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade1d]" />
                            <span>{checkInTime}</span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Check-Out Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isWorkingNow ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#4ade1d]/15 border border-[#4ade1d]/30 text-[11px] font-bold text-[#4ade1d]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade1d] animate-ping" />
                            <span>Working Now</span>
                          </div>
                        ) : checkOutTime ? (
                          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                            <LogOut className="w-3 h-3 text-slate-400" />
                            <span>{checkOutTime}</span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isWorkingNow ? (
                          <span className="font-mono font-bold text-[12px] text-[#4ade1d] bg-[#4ade1d]/15 px-2.5 py-1 rounded-md border border-[#4ade1d]/30">
                            {liveDurationStr}
                          </span>
                        ) : row.status === "Leave" ? (
                          <span className="text-[12px] text-slate-400">—</span>
                        ) : (
                          <span className="font-mono font-bold text-[12px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                            {liveDurationStr}
                          </span>
                        )}
                      </td>

                      {/* Status & Dossier Trigger */}
                      <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2.5">
                          <StatusBadge status={row.status} />
                          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#0084d4] transition-colors">
                            Details &rarr;
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AttendanceDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
