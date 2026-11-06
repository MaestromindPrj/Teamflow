"use client";

import { useState, useEffect, Suspense } from "react";
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
  FileText
} from "lucide-react";
import Header from "@/components/Header";
import { StatusBadge } from "@/components/Badges";
import { useTeamFlow, getLocalDateString, isLateClockIn } from "@/context/TeamFlowContext";
import AttendanceDetailModal from "@/components/AttendanceDetailModal";
import ApplyLeaveModal from "@/components/ApplyLeaveModal";
import LeaveRequestsModal from "@/components/LeaveRequestsModal";
import { AttendanceRecord } from "@/data/teamflowData";
import InPageSubTabs, { SubTabItem } from "@/components/InPageSubTabs";
import UserAvatar from "@/components/UserAvatar";
import { AttendanceSkeleton } from "@/components/Skeletons";

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

  const [roleFilter, setRoleFilter] = useState<"All" | "project_manager" | "employer">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
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

  const myManagedProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const myEmployerIds = new Set(
    myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
  );

  const pmAllowedUserIds = new Set([currentUser.id, ...Array.from(myEmployerIds)]);

  const rawBase = isCeo
    ? attendance
    : isPm
    ? attendance.filter((rec) => pmAllowedUserIds.has(rec.userId))
    : attendance.filter((rec) => rec.userId === currentUser.id);

  const seenKeys = new Set<string>();
  const baseAttendance = rawBase.filter((rec) => {
    const key = `${rec.userId}-${rec.date}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const visibleAttendance = baseAttendance.filter((rec) => {
    if (isCeo || isPm) {
      if (roleFilter !== "All" && rec.userRole !== roleFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const staffUser = users.find((u) => u.id === rec.userId);
        return (
          rec.userName.toLowerCase().includes(query) ||
          (staffUser?.jobTitle || "").toLowerCase().includes(query) ||
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

  const relevantStaff = users.filter((u) => u.role !== "ceo" && (isCeo || pmAllowedUserIds.has(u.id)));

  const currentlyActiveCount = relevantStaff.filter((u) => {
    return userClockInData[u.id]?.isClockedIn === true;
  }).length;

  const checkedOutCount = relevantStaff.filter((u) => {
    const state = userClockInData[u.id];
    return !state?.isClockedIn && state?.clockOutTimeString !== null;
  }).length;

  const todayString = getLocalDateString(new Date());

  const lateUserIds = new Set<string>();

  baseAttendance.forEach((r) => {
    if (r.date === todayString && r.userRole !== "ceo" && r.status !== "Leave") {
      const clockState = userClockInData[r.userId];
      const firstPunch =
        clockState?.sessions?.[0]?.clockIn ||
        clockState?.clockInTimeString ||
        r.sessions?.[0]?.clockIn ||
        r.clockIn;
      if (r.status === "Late" || isLateClockIn(firstPunch)) {
        lateUserIds.add(r.userId);
      }
    }
  });

  relevantStaff.forEach((u) => {
    const clockState = userClockInData[u.id];
    if (clockState && (clockState.isClockedIn || clockState.clockOutTimeString)) {
      const isToday = !clockState.clockInDate || clockState.clockInDate === todayString;
      if (isToday) {
        const firstPunch = clockState.sessions?.[0]?.clockIn || clockState.clockInTimeString;
        if (isLateClockIn(firstPunch)) {
          lateUserIds.add(u.id);
        }
      }
    }
  });

  const lateCount = lateUserIds.size;
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
    if (isCeo) return r.status === "Pending";
    if (isPm) return r.status === "Pending" && (r.userId === currentUser.id || pmAllowedUserIds.has(r.userId));
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
          isCeo
            ? "Executive workforce roster: monitor real-time check-in and check-out logs of all Project Managers and Employers"
            : isPm
            ? "Team attendance monitoring and personal workday punch clock"
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
          <div
            className={`grid gap-4 ${
              isCeo
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
            }`}
          >
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
              <span className="text-[12px] font-medium text-slate-500">Checked Out</span>
              <div className="mt-1 text-[24px] font-bold text-slate-700 leading-none" suppressHydrationWarning>
                {checkedOutCount} Completed
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Logged out after shift</p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
              <span className="text-[12px] font-medium text-slate-500">Late Arrivals</span>
              <div className="mt-1 text-[24px] font-bold text-[#ffa500] leading-none" suppressHydrationWarning>
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
                <p className="mt-2 text-[11px] text-slate-400">Active working rate</p>
              </div>
            )}
          </div>
        )}

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
                {isCeo
                  ? "Detailed check-in time, check-out time, and live elapsed work hours for company staff"
                  : isPm
                  ? "Detailed check-in time, check-out time, and live elapsed work hours for your team"
                  : "Your personal check-in time, check-out time, and cumulative workday hours"}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {(isCeo || isPm) && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search employee..."
                    className="pl-8 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0084d4] w-40 sm:w-48"
                  />
                </div>
              )}

              <button
                onClick={() => setIsLeaveRequestsOpen(true)}
                className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
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
                onClick={() => setIsApplyLeaveOpen(true)}
                className="h-8.5 px-3.5 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                title={isCeo || isPm ? "Mark an employee on leave or grant leave" : "Apply for leave dates"}
              >
                <CalendarPlus className="w-4 h-4" />
                <span>{isCeo || isPm ? "Mark / Grant Leave" : "Apply for Leave"}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-3">Employee</th>
                  <th className="pb-3 px-3">Job Role</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Check-In Time</th>
                  <th className="pb-3 px-3">Check-Out Time</th>
                  <th className="pb-3 px-3">Work Duration (H:M:S)</th>
                  <th className="pb-3 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {(() => {
                  const todayString = getLocalDateString(new Date());
                  const sortedAttendance = [...visibleAttendance].sort((a, b) => {
                    if (a.date === todayString && b.date !== todayString) return -1;
                    if (b.date === todayString && a.date !== todayString) return 1;
                    const dateComp = b.date.localeCompare(a.date);
                    if (dateComp !== 0) return dateComp;
                    return b.id.localeCompare(a.id);
                  });

                  return sortedAttendance.map((row) => {
                    const staffUser = users.find((u) => u.id === row.userId);
                    const clockState = userClockInData[row.userId];
                    const isToday = row.date === todayString;

                    const isWorkingNow = isToday && (clockState ? clockState.isClockedIn : row.clockOut === "—" && row.status !== "Leave");

                    const checkInTime = isToday && (clockState?.isClockedIn || clockState?.clockInTimeString)
                      ? (clockState.clockInTimeString || row.clockIn)
                      : row.clockIn;

                    const checkOutTime = isWorkingNow
                      ? null
                      : isToday && clockState?.clockOutTimeString
                      ? clockState.clockOutTimeString
                      : row.clockOut !== "—"
                      ? row.clockOut
                      : null;

                    let liveDurationStr = row.duration;
                    if (row.status === "Leave") {
                      liveDurationStr = "—";
                    } else if (isToday && isWorkingNow && clockState?.clockInTimestamp) {
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
                    } else if (isToday && clockState?.elapsedSeconds && !isWorkingNow) {
                      const elapsed = clockState.elapsedSeconds;
                      const h = Math.floor(elapsed / 3600);
                      const m = Math.floor((elapsed % 3600) / 60);
                      const s = elapsed % 60;
                      liveDurationStr = `${String(h).padStart(2, "0")}h ${String(m).padStart(
                        2,
                        "0"
                      )}m ${String(s).padStart(2, "0")}s`;
                    } else {
                      liveDurationStr = row.duration;
                    }

                    const firstPunch =
                      (isToday && clockState?.sessions?.[0]?.clockIn) ||
                      (isToday && clockState?.clockInTimeString) ||
                      row.sessions?.[0]?.clockIn ||
                      row.clockIn;

                    const isLate = row.status === "Late" || isLateClockIn(firstPunch);

                    let rowStatus: AttendanceRecord["status"] = row.status;
                    if (row.status === "Leave") {
                      rowStatus = "Leave";
                    } else if (isLate) {
                      rowStatus = "Late";
                    } else if (isToday) {
                      rowStatus = isWorkingNow
                        ? "Present"
                        : clockState?.clockOutTimeString
                        ? "Checked Out"
                        : row.status;
                    } else {
                      rowStatus = row.status;
                    }

                    const sessions = (isToday && clockState?.sessions && clockState.sessions.length > 0)
                      ? clockState.sessions
                      : (row.sessions && row.sessions.length > 0)
                      ? row.sessions
                      : [];
                    const sessionCount = sessions.length;

                    const effectiveRecord: AttendanceRecord = {
                      ...row,
                      clockIn: checkInTime || row.clockIn,
                      clockOut: isWorkingNow ? "—" : (checkOutTime || row.clockOut),
                      duration: liveDurationStr,
                      status: rowStatus as AttendanceRecord["status"],
                      sessions: sessions.length > 0 ? sessions : row.sessions,
                    };

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRecord(effectiveRecord)}
                        className="hover:bg-sky-50/60 transition-colors cursor-pointer group"
                        title="Click to view complete workday attendance dossier"
                      >
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-900 leading-tight group-hover:text-[#0084d4] transition-colors">
                                  {row.userName}
                                </span>
                                {sessionCount > 1 && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight ${
                                      isWorkingNow
                                        ? "bg-[#0084d4]/10 text-[#0084d4] border border-[#0084d4]/20"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}
                                    title={`${sessionCount} work sessions recorded today`}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{sessionCount} Sessions{isWorkingNow ? " (Active)" : ""}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

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

                        <td className="py-3.5 px-3 text-slate-600 text-[12px] whitespace-nowrap">
                          {row.date}
                        </td>

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
                  });
                })()}
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
