"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Briefcase,
  CalendarPlus,
  FileText,
  Filter
} from "lucide-react";
import Header from "@/components/Header";
import { StatusBadge } from "@/components/Badges";
import { useTeamFlow, getLocalDateString, isLateClockIn, formatSecondsToDuration } from "@/context/TeamFlowContext";
import AttendanceDetailModal from "@/components/AttendanceDetailModal";
import ApplyLeaveModal from "@/components/ApplyLeaveModal";
import LeaveRequestsModal from "@/components/LeaveRequestsModal";
import { AttendanceRecord } from "@/data/teamflowData";
import InPageSubTabs, { SubTabItem } from "@/components/InPageSubTabs";
import UserAvatar from "@/components/UserAvatar";
import { AttendanceSkeleton } from "@/components/Skeletons";
import { GroupedAttendanceRow, groupAttendanceRecords } from "@/utils/attendanceGrouping";

function AttendanceContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const {
    currentUser,
    attendance,
    isClockedIn,
    toggleClockInOut,
    users,
    projects,
    userClockInData,
    leaveRequests,
    hasHydrated,
    sleepNotice,
    dismissSleepNotice,
  } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [roleFilter, setRoleFilter] = useState<"All" | "project_manager" | "employer" | "leave">("All");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "3" | "7" | "30">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "working" | "checked_out" | "leave">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<GroupedAttendanceRow | null>(null);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [isLeaveRequestsOpen, setIsLeaveRequestsOpen] = useState(false);

  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (viewParam === "requests") {
      setIsLeaveRequestsOpen(true);
    } else if (viewParam === "apply") {
      setIsApplyLeaveOpen(true);
    }
  }, [viewParam]);

  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";

  const rawBase = (isCeo || isPm)
    ? attendance
    : attendance.filter((rec) => rec.userId === currentUser.id);

  const seenKeys = new Set<string>();
  const baseAttendance = rawBase.filter((rec) => {
    const key = `${rec.userId}-${rec.date}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const todayString = getLocalDateString(new Date());

  // Group continuous leave records into single rows (e.g. 2026-11-04 - 2026-11-06)
  const allGroupedRows = useMemo(() => {
    return groupAttendanceRecords(baseAttendance);
  }, [baseAttendance]);

  const visibleAttendance = useMemo(() => {
    return allGroupedRows.filter((rec) => {
      // 1. Inpage Tab Filter
      if (roleFilter === "leave") {
        if (rec.status !== "Leave") return false;
      } else if (roleFilter !== "All") {
        if (rec.userRole !== roleFilter) return false;
      }

      // 2. Status dropdown filter
      if (statusFilter === "working") {
        const clockState = userClockInData[rec.userId];
        const isToday = rec.startDate <= todayString && todayString <= rec.endDate;
        const isWorkingNow = isToday && (clockState ? clockState.isClockedIn : rec.clockOut === "—" && rec.status !== "Leave");
        if (!isWorkingNow) return false;
      } else if (statusFilter === "checked_out") {
        if (rec.status !== "Checked Out") return false;
      } else if (statusFilter === "leave") {
        if (rec.status !== "Leave") return false;
      }

      // 3. Date range filter
      if (dateFilter !== "all") {
        if (dateFilter === "today") {
          const isToday = rec.startDate <= todayString && todayString <= rec.endDate;
          if (!isToday) return false;
        } else {
          const days = Number(dateFilter);
          const cutoff = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
          const cutoffStr = getLocalDateString(cutoff);
          if (rec.endDate < cutoffStr) return false;
        }
      }

      // 4. Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const staffUser = users.find((u) => u.id === rec.userId);
        return (
          rec.userName.toLowerCase().includes(query) ||
          (staffUser?.jobTitle || "").toLowerCase().includes(query) ||
          rec.userRole.toLowerCase().includes(query) ||
          rec.date.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allGroupedRows, roleFilter, statusFilter, dateFilter, searchQuery, userClockInData, todayString, users]);

  const sortedAttendance = useMemo(() => {
    return [...visibleAttendance].sort((a, b) => {
      const aIsToday = a.startDate <= todayString && todayString <= a.endDate;
      const bIsToday = b.startDate <= todayString && todayString <= b.endDate;
      if (aIsToday && !bIsToday) return -1;
      if (bIsToday && !aIsToday) return 1;

      const dateComp = b.endDate.localeCompare(a.endDate);
      if (dateComp !== 0) return dateComp;

      return a.userName.localeCompare(b.userName);
    });
  }, [visibleAttendance, todayString]);

  const relevantStaff = users.filter((u) => u.role !== "ceo");

  const currentlyActiveCount = relevantStaff.filter((u) => {
    return userClockInData[u.id]?.isClockedIn === true;
  }).length;

  const leaveCount = baseAttendance.filter((r) => r.status === "Leave" && r.date === todayString).length;
  const attendanceRate =
    relevantStaff.length > 0
      ? Math.round((currentlyActiveCount / relevantStaff.length) * 100)
      : 0;

  const isEmployer = !isCeo && !isPm;
  const isCurrentUserOnLeaveToday = Boolean(
    baseAttendance.find((r) => r.userId === currentUser.id && r.date === todayString && r.status === "Leave")
  );

  const pendingLeavesCount = leaveRequests.filter((r) => {
    if (isCeo || isPm) return r.status === "Pending";
    return r.status === "Pending" && r.userId === currentUser.id;
  }).length;
  const myClockState = userClockInData[currentUser.id];
  const myTodayRecord = baseAttendance.find((r) => r.userId === currentUser.id && r.date === todayString);

  const myCheckInTime =
    isClockedIn || myClockState?.clockInTimeString
      ? myClockState?.clockInTimeString || myTodayRecord?.clockIn || "—"
      : myTodayRecord?.clockIn || "—";

  let myDurationStr = "00h 00m 00s";
  if (isClockedIn && myClockState?.clockInTimestamp) {
    const elapsed =
      (myClockState.elapsedSeconds || 0) +
      Math.max(0, Math.floor((currentTime - myClockState.clockInTimestamp) / 1000));
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    myDurationStr = `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  } else if (myClockState?.elapsedSeconds) {
    const elapsed = myClockState.elapsedSeconds;
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    myDurationStr = `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  } else if (myTodayRecord?.duration && myTodayRecord.duration !== "—") {
    myDurationStr = myTodayRecord.duration;
  }

  const myAttendanceRecords = baseAttendance.filter((r) => r.userId === currentUser.id);
  const myDaysPresent = myAttendanceRecords.filter((r) => r.status !== "Leave").length;
  const myOnTimeCount = myAttendanceRecords.filter(
    (r) => r.status === "Present" || r.status === "Checked Out"
  ).length;
  const myOnTimeRate = myDaysPresent > 0 ? Math.round((myOnTimeCount / myDaysPresent) * 100) : 100;

  if (!mounted || !hasHydrated || !currentUser.id) {
    return <AttendanceSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Attendance & Workday Logs"
        subtitle={
          isCeo || isPm
            ? "Executive workforce roster: monitor real-time check-in and check-out logs of all Project Managers and Employers"
            : "Personal workday records, attendance rate, and punch clock"
        }
      />

      <div className="px-7 py-6 space-y-6">
        {sleepNotice && (
          <div
            className="p-3.5 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] shadow-2xs"
            suppressHydrationWarning
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">💤</span>
              <div className="leading-snug">
                <span className="font-bold">Device sleep detected:</span>{" "}
                <span>
                  Your workday was paused & clocked out at <strong>{sleepNotice.time}</strong>.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={toggleClockInOut}
                className="px-3 py-1.5 text-[11px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                Resume Workday
              </button>
              <button
                type="button"
                onClick={dismissSleepNotice}
                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-md bg-amber-200/60 hover:bg-amber-200 text-amber-800 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {isEmployer ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-500">My Status Today</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                    isCurrentUserOnLeaveToday
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : isClockedIn
                      ? "bg-[#4ade1d]/15 text-[#4ade1d]"
                      : "bg-[#ffa500]/15 text-[#ffa500]"
                  }`}
                >
                  {isCurrentUserOnLeaveToday ? "On Approved Leave" : isClockedIn ? "Clocked In" : "Clocked Out"}
                </span>
              </div>
              <div className="mt-3">
                {isCurrentUserOnLeaveToday ? (
                  <button
                    disabled
                    className="w-full h-9 rounded-lg text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs inline-flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>On Approved Leave Today</span>
                  </button>
                ) : (
                  <button
                    onClick={toggleClockInOut}
                    className={`w-full h-9 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center ${
                      isClockedIn
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-[#0084d4] text-white hover:bg-[#0277bd]"
                    }`}
                  >
                    {isClockedIn ? "Check Out" : "Check In"}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
              <span className="text-[12px] font-medium text-slate-500">Today&apos;s Check-In</span>
              <div className="mt-1 text-[20px] font-bold text-slate-900 leading-none flex items-center gap-2">
                {myCheckInTime !== "—" ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#4ade1d]" />
                    <span>{myCheckInTime}</span>
                  </>
                ) : (
                  <span className="text-slate-400 font-medium text-[15px]">Not Clocked In</span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Recorded workday punch</p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
              <span className="text-[12px] font-medium text-slate-500">Logged Hours Today</span>
              <div className="mt-1 font-mono text-[20px] font-bold text-[#0084d4] leading-none" suppressHydrationWarning>
                {myDurationStr}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {isClockedIn ? "Live workday timer counting" : "Shift duration recorded"}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
              <span className="text-[12px] font-medium text-slate-500">Workdays Logged</span>
              <div className="mt-1 text-[20px] font-bold text-slate-800 leading-none">
                {myDaysPresent} {myDaysPresent === 1 ? "Day" : "Days"}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {myOnTimeRate}% on-time completion
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isPm && (
              <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate-500">My Status Today</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                      isCurrentUserOnLeaveToday
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : isClockedIn
                        ? "bg-[#4ade1d]/15 text-[#4ade1d]"
                        : "bg-[#ffa500]/15 text-[#ffa500]"
                    }`}
                  >
                    {isCurrentUserOnLeaveToday ? "On Approved Leave" : isClockedIn ? "Clocked In" : "Clocked Out"}
                  </span>
                </div>
                <div className="mt-3">
                  {isCurrentUserOnLeaveToday ? (
                    <button
                      disabled
                      className="w-full h-9 rounded-lg text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs inline-flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>On Approved Leave Today</span>
                    </button>
                  ) : (
                    <button
                      onClick={toggleClockInOut}
                      className={`w-full h-9 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center ${
                        isClockedIn
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-[#0084d4] text-white hover:bg-[#0277bd]"
                      }`}
                    >
                      {isClockedIn ? "Check Out" : "Check In"}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
              <span className="text-[12px] font-medium text-slate-500">Currently Active</span>
              <div className="mt-1 text-[24px] font-bold text-[#4ade1d] leading-none flex items-center gap-2" suppressHydrationWarning>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4ade1d] animate-ping" />
                <span>{currentlyActiveCount} Working</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Checked in and on duty now</p>
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
                <p className="mt-2 text-[11px] text-slate-400">Active working rate</p>
              </div>
            )}
          </div>
        )}

        {(isCeo || isPm) ? (
          <InPageSubTabs<"All" | "project_manager" | "employer" | "leave">
            activeTab={roleFilter}
            onChange={(filter) => setRoleFilter(filter)}
            tabs={[
              {
                id: "All",
                label: "All",
                icon: <Users className="w-4 h-4" />,
              },
              {
                id: "project_manager" as const,
                label: "Project Managers",
                icon: <Shield className="w-4 h-4" />,
              },
              {
                id: "employer" as const,
                label: "Employers",
                icon: <Briefcase className="w-4 h-4" />,
              },
              {
                id: "leave" as const,
                label: "Leave",
                icon: <Calendar className="w-4 h-4" />,
              },
            ]}
          />
        ) : (
          <InPageSubTabs<"All" | "project_manager" | "employer" | "leave">
            activeTab={roleFilter}
            onChange={(filter) => setRoleFilter(filter)}
            tabs={[
              {
                id: "All",
                label: "All Records",
                icon: <Users className="w-4 h-4" />,
              },
              {
                id: "leave" as const,
                label: "Leave",
                icon: <Calendar className="w-4 h-4" />,
              },
            ]}
          />
        )}

        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
          {/* Top Section: Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                {isCeo || isPm
                  ? "Executive Workforce Attendance Roster"
                  : "My Attendance Logs"}
              </h2>
              <p className="text-[12px] text-slate-500">
                {isCeo || isPm
                  ? "Monitor real-time work duration, time tracking, and leave status for company staff"
                  : "Your personal work duration history, leave status, and cumulative workday logs"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsLeaveRequestsOpen(true)}
                className="h-9 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                title="View leave applications history and approvals"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{isCeo || isPm ? "Leave Requests" : "My Requests"}</span>
                {pendingLeavesCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                    {pendingLeavesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsApplyLeaveOpen(true)}
                className="h-9 px-3.5 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                title={isCeo || isPm ? "Mark an employee on leave or grant leave" : "Apply for leave dates"}
              >
                <CalendarPlus className="w-4 h-4" />
                <span>{isCeo || isPm ? "Mark / Grant Leave" : "Apply for Leave"}</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar Row: Search, Dates, Status, Clear */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
              <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employee or role..."
                  className="w-full h-9 pl-8 pr-3 text-[12px] border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] bg-white shadow-2xs"
                />
              </div>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as "all" | "today" | "3" | "7" | "30")}
                className="h-9 px-2.5 text-[12px] font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-[#0084d4] cursor-pointer shadow-2xs"
                title="Filter records by date range"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="3">Last 3 Days</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "working" | "checked_out" | "leave")}
                className="h-9 px-2.5 text-[12px] font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-[#0084d4] cursor-pointer shadow-2xs"
                title="Filter records by workday status"
              >
                <option value="all">All Statuses</option>
                <option value="working">Working Now</option>
                <option value="checked_out">Checked Out</option>
                <option value="leave">On Leave</option>
              </select>

              {(searchQuery || dateFilter !== "all" || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter("all");
                    setStatusFilter("all");
                  }}
                  className="text-[11px] font-semibold text-[#0084d4] hover:underline cursor-pointer px-1"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-medium shrink-0">
              Showing <span className="font-semibold text-slate-700">{sortedAttendance.length}</span> {sortedAttendance.length === 1 ? "record" : "records"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-3">Employee</th>
                  <th className="pb-3 px-3">Job Role</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Work Duration (H:M:S)</th>
                  <th className="pb-3 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {sortedAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-[13px]">
                      No attendance or workday records match the current filters.
                    </td>
                  </tr>
                ) : (
                  sortedAttendance.map((row) => {
                    const staffUser = users.find((u) => u.id === row.userId);
                    const clockState = userClockInData[row.userId];
                    const isToday = row.startDate <= todayString && todayString <= row.endDate;

                    const isWorkingNow = isToday && (clockState ? clockState.isClockedIn : row.clockOut === "—" && row.status !== "Leave");

                    let liveDurationStr = row.duration;
                    if (row.status === "Leave") {
                      liveDurationStr = "—";
                    } else if (isToday && isWorkingNow && clockState?.clockInTimestamp) {
                      const elapsed =
                        (clockState.elapsedSeconds || 0) +
                        Math.max(0, Math.floor((currentTime - clockState.clockInTimestamp) / 1000));
                      liveDurationStr = formatSecondsToDuration(elapsed);
                    } else if (isToday && clockState?.elapsedSeconds && !isWorkingNow) {
                      liveDurationStr = formatSecondsToDuration(clockState.elapsedSeconds);
                    } else {
                      liveDurationStr = row.duration;
                    }

                    let rowStatus: AttendanceRecord["status"] = row.status;
                    if (row.status === "Leave") {
                      rowStatus = "Leave";
                    } else if (isToday) {
                      rowStatus = isWorkingNow
                        ? "Present"
                        : clockState?.clockOutTimeString
                        ? "Checked Out"
                        : row.status === "Late"
                        ? "Present"
                        : row.status;
                    } else {
                      rowStatus = row.status === "Late" ? "Present" : row.status;
                    }

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRecord(row)}
                        className="hover:bg-sky-50/60 transition-colors cursor-pointer group"
                        title="Click to view work duration history and project initiatives"
                      >
                        {/* 1. Employee */}
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              src={staffUser?.avatar}
                              name={row.userName}
                              role={staffUser?.role}
                              className="w-[34px] h-[34px] rounded-full border border-slate-200 shrink-0 group-hover:border-[#0084d4] transition-colors"
                              textClassName="text-[11px]"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 leading-tight group-hover:text-[#0084d4] transition-colors">
                                {row.userName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Job Role */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium ${
                              row.userRole === "project_manager"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30"
                            }`}
                          >
                            {staffUser?.jobTitle || (row.userRole === "project_manager" ? "Project Manager" : "Employer")}
                          </span>
                        </td>

                        {/* 3. Date (Single Date or Grouped Continuous Leave Range) */}
                        <td className="py-3.5 px-3 text-slate-600 text-[12px] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-800">{row.date}</span>
                            {row.isLeaveSpan && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                {row.leaveDaysCount} Days
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Work Duration (H:M:S) */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {isWorkingNow ? (
                            <span className="font-mono font-bold text-[12px] text-[#4ade1d] bg-[#4ade1d]/15 px-2.5 py-1 rounded-md border border-[#4ade1d]/30 inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade1d] animate-ping" />
                              {liveDurationStr}
                            </span>
                          ) : row.status === "Leave" ? (
                            <span className="text-[12px] text-slate-400 font-mono">—</span>
                          ) : (
                            <span className="font-mono font-bold text-[12px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                              {liveDurationStr}
                            </span>
                          )}
                        </td>

                        {/* 5. Status & Details */}
                        <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2.5">
                            <StatusBadge status={rowStatus} />
                            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#0084d4] transition-colors">
                              Details &rarr;
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AttendanceDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      <ApplyLeaveModal
        isOpen={isApplyLeaveOpen}
        onClose={() => setIsApplyLeaveOpen(false)}
      />

      <LeaveRequestsModal
        isOpen={isLeaveRequestsOpen}
        onClose={() => setIsLeaveRequestsOpen(false)}
        onOpenApplyModal={() => setIsApplyLeaveOpen(true)}
      />
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="flex-1 p-7 text-slate-400">Loading attendance...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
