"use client";

import { useEffect, useState } from "react";
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Shield,
  UserCheck,
  Mail,
  FolderKanban,
  Activity,
  LogOut,
  Sparkles,
  Coffee
} from "lucide-react";
import { useTeamFlow, getLocalDateString, formatSecondsToDuration } from "@/context/TeamFlowContext";
import { StatusBadge } from "@/components/Badges";
import { AttendanceRecord, PunchSession } from "@/data/teamflowData";
import UserAvatar from "@/components/UserAvatar";

interface AttendanceDetailModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

export default function AttendanceDetailModal({
  record,
  onClose
}: AttendanceDetailModalProps) {
  const { users, projects, userClockInData } = useTeamFlow();
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(Date.now());
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!record) return null;

  const todayString = getLocalDateString(new Date());
  const isToday = record.date === todayString;

  const staffUser = users.find((u) => u.id === record.userId);
  const clockState = userClockInData[record.userId];

  const isWorkingNow = isToday && (clockState ? clockState.isClockedIn : record.clockOut === "—" && record.status !== "Leave");

  const checkInTime = isToday && (clockState?.isClockedIn || clockState?.clockInTimeString)
    ? (clockState.clockInTimeString || record.clockIn)
    : record.clockIn;

  const checkOutTime = isWorkingNow
    ? null
    : isToday && clockState?.clockOutTimeString
    ? clockState.clockOutTimeString
    : record.clockOut !== "—"
    ? record.clockOut
    : null;

  const recordedSessions: PunchSession[] =
    (isToday && clockState?.sessions && clockState.sessions.length > 0)
      ? clockState.sessions
      : (record.sessions && record.sessions.length > 0)
      ? record.sessions
      : (record.clockIn && record.clockIn !== "—")
      ? [
          {
            sessionNumber: 1,
            clockIn: record.clockIn,
            clockOut: record.clockOut !== "—" ? record.clockOut : null,
            duration: record.duration,
          },
        ]
      : [];

  let liveDurationStr = record.duration;
  if (record.status === "Leave") {
    liveDurationStr = "00h 00m 00s (On Leave)";
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
    liveDurationStr = record.duration;
  }

  const modalStatus = isToday
    ? isWorkingNow
      ? "Present"
      : clockState?.clockOutTimeString
      ? "Checked Out"
      : record.status
    : record.status;

  const userProjects = projects.filter(
    (p) =>
      p.teamMemberIds.includes(record.userId) ||
      p.teamLeadId === record.userId ||
      p.projectManagerId === record.userId
  );

  const firstPunchIn = recordedSessions[0]?.clockIn || checkInTime || "—";
  const lastPunchOut = recordedSessions[recordedSessions.length - 1]?.clockOut || checkOutTime || "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                  Workday Attendance Dossier
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {record.date}
                </span>
              </div>
              <p className="text-[12px] text-slate-500">
                Live time tracking, punch timestamps, and workday session details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-lg border border-slate-100">
            <UserAvatar
              src={staffUser?.avatar}
              name={record.userName}
              role={staffUser?.role || record.userRole}
              className="w-14 h-14 rounded-full border-2 border-white shadow-2xs shrink-0"
              textClassName="text-[16px]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[16px] font-bold text-slate-900 truncate">
                    {record.userName}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-100 text-[#0084d4] border border-sky-200/70">
                    {staffUser?.jobTitle || (record.userRole === "project_manager" ? "Project Manager" : "Employer")}
                  </span>
                </div>
                <StatusBadge status={modalStatus} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {staffUser?.email || "staff@teamflow.internal"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                First Check-In Punch
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4ade1d]" />
                <span className="text-[16px] font-extrabold text-slate-900">
                  {firstPunchIn}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {recordedSessions.length > 1 ? `${recordedSessions.length} sessions logged today` : "Recorded by system"}
              </span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {isWorkingNow ? "Current Status" : "Last Check-Out Punch"}
              </span>
              <div className="flex items-center gap-2">
                {isWorkingNow ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#4ade1d] animate-ping" />
                    <span className="text-[13px] font-bold text-[#4ade1d]">
                      Active On-Duty {recordedSessions.length > 1 ? `(Session ${recordedSessions.length})` : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[16px] font-extrabold text-slate-900">
                      {lastPunchOut}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isWorkingNow ? "Currently clocked in" : "Shift completed"}
              </span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Logged Duration
              </span>
              <span className="font-mono text-[15px] font-bold text-[#0084d4] block">
                {liveDurationStr}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isWorkingNow ? "Live timer across all sessions" : "Cumulative logged hours"}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/60 rounded-lg border border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#0084d4]" />
                <span>Day Activity &amp; Punch Timeline</span>
              </h4>
              {recordedSessions.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#0084d4] border border-sky-200">
                  {recordedSessions.length} {recordedSessions.length === 1 ? "Session" : "Sessions"}
                </span>
              )}
            </div>

            {record.status === "Leave" ? (
              <div className="space-y-2.5">
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-lg text-amber-900 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-[12px]">
                    <div className="font-bold text-amber-950">
                      Approved Leave Recorded
                    </div>
                    
                    {record.leaveType && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                          {record.leaveType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {record.leaveReason && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700">
                    <strong className="text-slate-900 block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                      Submitted Reason / Notes
                    </strong>
                    <span>{record.leaveReason}</span>
                  </div>
                )}
              </div>
            ) : recordedSessions.length === 0 ? (
              <div className="p-3 bg-slate-100 rounded-md text-[12px] text-slate-500">
                No clock-in sessions recorded for this date.
              </div>
            ) : (
              <div className="space-y-3">
                {recordedSessions.map((session, idx) => {
                  const isLast = idx === recordedSessions.length - 1;
                  const isActiveSession = isLast && isWorkingNow && !session.clockOut;

                  let sessionDur = session.duration || "—";
                  if (isActiveSession && clockState?.clockInTimestamp) {
                    const liveSec = Math.max(0, Math.floor((currentTime - clockState.clockInTimestamp) / 1000));
                    sessionDur = formatSecondsToDuration(liveSec);
                  }

                  const nextSession = recordedSessions[idx + 1];

                  return (
                    <div key={`session-${session.sessionNumber || idx}`} className="space-y-2">
                      <div className="bg-white rounded-lg border border-slate-200/80 p-3 shadow-2xs hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                              Session {session.sessionNumber || idx + 1}
                            </span>
                            {isActiveSession ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade1d] animate-ping" />
                                Working Now
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                <CheckCircle2 className="w-3 h-3 text-[#4ade1d]" />
                                Completed
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            Duration: <span className={isActiveSession ? "text-[#4ade1d]" : "text-slate-900"}>{sessionDur}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[12px]">
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="w-2 h-2 rounded-full bg-[#4ade1d] shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Check-In</span>
                              <span className="font-semibold text-slate-800 font-mono text-[12px]">{session.clockIn}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                            {isActiveSession ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-[#4ade1d] animate-ping shrink-0" />
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-medium">Check-Out</span>
                                  <span className="font-bold text-[#4ade1d] text-[12px]">Active / On-Duty</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-medium">Check-Out</span>
                                  <span className="font-semibold text-slate-800 font-mono text-[12px]">{session.clockOut || "—"}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {nextSession && (
                        <div className="flex items-center justify-center py-0.5">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50/80 border border-amber-200/70 rounded-full text-[11px] text-amber-800 shadow-2xs">
                            <Coffee className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="font-semibold">Break / Out of Office:</span>
                            <span className="font-mono text-amber-900 font-bold">
                              {session.clockOut || "—"} &rarr; {nextSession.clockIn}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {userProjects.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[12px] font-bold text-slate-700">
                Active Project Initiatives ({userProjects.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {userProjects.map((proj) => (
                  <span
                    key={proj.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-medium shadow-2xs"
                  >
                    <FolderKanban className="w-3 h-3 text-[#0084d4]" />
                    <span className="font-bold">{proj.code}</span>
                    <span>&bull;</span>
                    <span className="truncate max-w-[200px]">{proj.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          
        </div>
      </div>
    </div>
  );
}
