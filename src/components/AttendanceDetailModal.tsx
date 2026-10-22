"use client";

import { useEffect, useState } from "react";
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Shield,
  UserCheck,
  Building2,
  MapPin,
  Mail,
  FolderKanban,
  Activity,
  LogOut,
  Sparkles
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { StatusBadge } from "@/components/Badges";
import { AttendanceRecord } from "@/data/teamflowData";

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

  const staffUser = users.find((u) => u.id === record.userId);
  const clockState = userClockInData[record.userId];

  const isWorkingNow = clockState
    ? clockState.isClockedIn
    : record.clockOut === "—" && record.status !== "Leave";

  const checkInTime = clockState?.clockInTimeString || record.clockIn;
  const checkOutTime = isWorkingNow
    ? null
    : clockState?.clockOutTimeString || (record.clockOut !== "—" ? record.clockOut : null);

  // Calculate live duration in seconds
  let liveDurationStr = record.duration;
  if (record.status === "Leave") {
    liveDurationStr = "00h 00m 00s (On Leave)";
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

  // Projects associated with this staff member
  const userProjects = projects.filter(
    (p) =>
      p.teamMemberIds.includes(record.userId) ||
      p.teamLeadId === record.userId ||
      p.projectManagerId === record.userId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Employee Card */}
          <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-lg border border-slate-100">
            {staffUser?.avatar ? (
              <img
                src={staffUser.avatar}
                alt={record.userName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[16px] shrink-0">
                {record.userName.substring(0, 2)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-bold text-slate-900 truncate">
                  {record.userName}
                </h3>
                <StatusBadge status={record.status} />
              </div>
              <p className="text-[12px] text-slate-500 font-medium">
                {staffUser?.jobTitle || record.department}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {record.department}
                </span>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {staffUser?.email || "staff@teamflow.internal"}
                </span>
              </div>
            </div>
          </div>

          {/* Punch Log Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Check-In Punch
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4ade1d]" />
                <span className="text-[16px] font-extrabold text-slate-900">
                  {checkInTime || "—"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Recorded by system</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Check-Out Punch
              </span>
              <div className="flex items-center gap-2">
                {isWorkingNow ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#4ade1d] animate-ping" />
                    <span className="text-[13px] font-bold text-[#4ade1d]">Active On-Duty</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[16px] font-extrabold text-slate-900">
                      {checkOutTime || "—"}
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
                Logged Duration
              </span>
              <span className="font-mono text-[15px] font-bold text-[#0084d4] block">
                {liveDurationStr}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Live work timer</span>
            </div>
          </div>

          {/* Daily Work Timeline Breakdown */}
          <div className="bg-slate-50/60 rounded-lg border border-slate-100 p-4 space-y-3">
            <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0084d4]" />
              <span>Day Activity &amp; Punch Timeline</span>
            </h4>

            <div className="space-y-2.5 text-[12px]">
              <div className="flex items-start gap-3">
                <span className="font-mono text-[11px] font-bold text-[#4ade1d] bg-[#4ade1d]/15 px-2 py-0.5 rounded border border-[#4ade1d]/30 shrink-0">
                  {checkInTime || "09:00 AM"}
                </span>
                <div>
                  <strong className="text-slate-800">Biometric / Web Check-In Accepted</strong>
                  <p className="text-[11px] text-slate-400">Authenticated via TeamFlow portal session</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                  01:00 PM
                </span>
                <div>
                  <strong className="text-slate-800">Midday Meal &amp; Rest Interval</strong>
                  <p className="text-[11px] text-slate-400">Scheduled 45-minute pause compliant with workplace standard</p>
                </div>
              </div>

              {isWorkingNow ? (
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[11px] font-bold text-[#4ade1d] bg-[#4ade1d]/15 px-2 py-0.5 rounded border border-[#4ade1d]/30 animate-pulse shrink-0">
                    Active
                  </span>
                  <div>
                    <strong className="text-[#4ade1d]">Afternoon Sprint &amp; Task Delivery</strong>
                    <p className="text-[11px] text-slate-500">Currently executing active sprint deliverables</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 shrink-0">
                    {checkOutTime || "05:30 PM"}
                  </span>
                  <div>
                    <strong className="text-slate-800">Official Check-Out Recorded</strong>
                    <p className="text-[11px] text-slate-400">Workday logs finalized and saved to company archive</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Associated Initiatives */}
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

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
