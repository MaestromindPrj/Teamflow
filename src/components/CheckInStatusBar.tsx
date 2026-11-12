"use client";

import { useEffect, useState, useMemo } from "react";
import { Clock, Calendar } from "lucide-react";
import { useTeamFlow, getLocalDateString } from "@/context/TeamFlowContext";

function parseDurationToSeconds(durationStr?: string | null): number {
  if (!durationStr || typeof durationStr !== "string") return 0;
  let total = 0;
  const hMatch = durationStr.match(/(\d+)\s*h/i);
  const mMatch = durationStr.match(/(\d+)\s*m/i);
  const sMatch = durationStr.match(/(\d+)\s*s/i);
  if (hMatch) total += parseInt(hMatch[1], 10) * 3600;
  if (mMatch) total += parseInt(mMatch[1], 10) * 60;
  if (sMatch) total += parseInt(sMatch[1], 10);
  return total;
}

function getDayDiff(todayStr: string, pastDateStr: string): number {
  if (todayStr === pastDateStr) return 0;
  const tParts = todayStr.split("-").map(Number);
  const pParts = pastDateStr.split("-").map(Number);
  if (tParts.length < 3 || pParts.length < 3) return 999;
  const t = new Date(tParts[0], tParts[1] - 1, tParts[2]).getTime();
  const p = new Date(pParts[0], pParts[1] - 1, pParts[2]).getTime();
  return Math.round((t - p) / (1000 * 60 * 60 * 24));
}

function formatPastDate(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CheckInStatusBar({ className = "" }: { className?: string }) {
  const {
    currentUser,
    currentUserClockIn,
    toggleClockInOut,
    attendance,
    sleepNotice,
    dismissSleepNotice,
    hasHydrated,
  } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  const [tickerSeconds, setTickerSeconds] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const todayStr = getLocalDateString(new Date());

  // Filter real attendance records specifically for the logged-in person
  const userAttendance = useMemo(() => {
    if (!currentUser?.id) return [];
    return attendance
      .filter((r) => r.userId === currentUser.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, currentUser?.id]);

  const todayAttendance = useMemo(() => {
    return userAttendance.find((r) => r.date === todayStr);
  }, [userAttendance, todayStr]);

  const isOnLeaveToday = todayAttendance?.status === "Leave";

  // Check if active clock-in belongs to TODAY
  const isTodayClockIn = currentUserClockIn?.clockInDate === todayStr;
  const isCheckedIn = !isOnLeaveToday && Boolean(currentUserClockIn?.isClockedIn) && isTodayClockIn;
  const clockInTimestamp = currentUserClockIn?.clockInTimestamp;

  // Real today elapsed seconds (strictly 0 if user has not worked today)
  const elapsedSecondsBase = useMemo(() => {
    if (isTodayClockIn && typeof currentUserClockIn?.elapsedSeconds === "number") {
      return currentUserClockIn.elapsedSeconds;
    }
    if (todayAttendance?.duration) {
      return parseDurationToSeconds(todayAttendance.duration);
    }
    return 0;
  }, [isTodayClockIn, currentUserClockIn?.elapsedSeconds, todayAttendance?.duration]);

  // Real check-in time of the person today
  const clockInTimeStr = useMemo(() => {
    if (!isCheckedIn) return null;
    if (isTodayClockIn && currentUserClockIn?.clockInTimeString) {
      return currentUserClockIn.clockInTimeString;
    }
    if (todayAttendance?.clockIn && todayAttendance.clockIn !== "—") {
      return todayAttendance.clockIn;
    }
    if (clockInTimestamp) {
      return new Date(clockInTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return null;
  }, [isCheckedIn, isTodayClockIn, currentUserClockIn?.clockInTimeString, todayAttendance?.clockIn, clockInTimestamp]);

  // Real last checkout info (date and time) of the person
  const lastCheckoutInfo = useMemo(() => {
    // 1. If checked out today, prioritize today's checkout time
    if (isTodayClockIn && currentUserClockIn?.clockOutTimeString) {
      return {
        date: todayStr,
        time: currentUserClockIn.clockOutTimeString,
      };
    }
    if (todayAttendance?.clockOut && todayAttendance.clockOut !== "—") {
      return {
        date: todayStr,
        time: todayAttendance.clockOut,
      };
    }

    // 2. Otherwise look for the most recent completed checkout in their real attendance records
    const prevRecord = userAttendance.find(
      (r) => r.date < todayStr && r.clockOut && r.clockOut !== "—"
    );
    if (prevRecord && prevRecord.clockOut) {
      return {
        date: prevRecord.date,
        time: prevRecord.clockOut,
      };
    }

    // 3. Check if currentUserClockIn holds a checkout timestamp from a previous date
    if (
      currentUserClockIn?.clockOutTimeString &&
      currentUserClockIn.clockInDate &&
      currentUserClockIn.clockInDate < todayStr
    ) {
      return {
        date: currentUserClockIn.clockInDate,
        time: currentUserClockIn.clockOutTimeString,
      };
    }

    return null;
  }, [
    isTodayClockIn,
    currentUserClockIn?.clockOutTimeString,
    currentUserClockIn?.clockInDate,
    todayAttendance?.clockOut,
    userAttendance,
    todayStr,
  ]);

  useEffect(() => {
    const calculateSeconds = () => {
      if (isCheckedIn && clockInTimestamp) {
        const liveSession = Math.max(0, Math.floor((Date.now() - clockInTimestamp) / 1000));
        return elapsedSecondsBase + liveSession;
      }
      return elapsedSecondsBase;
    };

    setTickerSeconds(calculateSeconds());

    if (!isCheckedIn) return;

    const intervalId = setInterval(() => {
      setTickerSeconds(calculateSeconds());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isCheckedIn, clockInTimestamp, elapsedSecondsBase]);

  const hours = Math.floor(tickerSeconds / 3600);
  const minutes = Math.floor((tickerSeconds % 3600) / 60);
  const seconds = tickerSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  const renderCheckoutSubtitle = () => {
    if (!lastCheckoutInfo) {
      return "You haven't checked in today. Click the toggle to start your work session.";
    }

    const diff = getDayDiff(todayStr, lastCheckoutInfo.date);
    if (diff === 0) {
      return (
        <>
          Last checked out today at{" "}
          <span className="font-semibold text-slate-700">{lastCheckoutInfo.time}</span>
        </>
      );
    }

    if (diff === 1) {
      return (
        <>
          Last checked out yesterday at{" "}
          <span className="font-semibold text-slate-700">{lastCheckoutInfo.time}</span>
        </>
      );
    }

    const dateLabel = formatPastDate(lastCheckoutInfo.date);
    return (
      <>
        Last checked out on{" "}
        <span className="font-semibold text-slate-700">{dateLabel}</span> at{" "}
        <span className="font-semibold text-slate-700">{lastCheckoutInfo.time}</span>
      </>
    );
  };

  if (!mounted || !hasHydrated) {
    return (
      <div
        className={`bg-white rounded-lg border border-slate-200/90 shadow-2xs p-4 sm:p-5 transition-all flex flex-col justify-between ${className}`}
        suppressHydrationWarning
      >
        <div className="flex items-start justify-between gap-3 animate-pulse">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="w-12 h-6 bg-slate-200 rounded-full" />
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between animate-pulse">
          <div className="h-8 w-28 bg-slate-100 rounded-lg" />
          <div className="h-5 w-12 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200/90 shadow-2xs p-4 sm:p-5 transition-all flex flex-col justify-between ${className}`}
      suppressHydrationWarning
    >
      {sleepNotice && (
        <div className="mb-3.5 p-3 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[12px] shadow-2xs">
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <span className="text-base shrink-0">💤</span>
            <div className="leading-snug">
              <span className="font-bold">Device sleep detected:</span>{" "}
              <span>
                Your session was paused & clocked out at <strong>{sleepNotice.time}</strong>.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={toggleClockInOut}
              className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              Resume Workday
            </button>
            <button
              type="button"
              onClick={dismissSleepNotice}
              className="px-2 py-1 text-[11px] font-semibold rounded-md bg-amber-200/60 hover:bg-amber-200 text-amber-800 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isOnLeaveToday
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : isCheckedIn
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            {isOnLeaveToday ? (
              <Calendar className="w-5 h-5 text-amber-600" />
            ) : (
              <Clock className={`w-5 h-5 ${isCheckedIn ? "animate-pulse" : ""}`} />
            )}
          </div>

          <div className="space-y-0.5 min-w-0">
            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
              {isOnLeaveToday ? "Workday Status: On Leave" : "Workday Check-In"}
            </h3>

            <p className="text-[12px] text-slate-500 leading-snug" suppressHydrationWarning>
              {isOnLeaveToday ? (
                <span className="text-amber-800 font-medium">
                  You are marked on Approved Leave today. Standard work hours and punch logs are excused.
                </span>
              ) : isCheckedIn ? (
                <>
                  Started today at{" "}
                  <span className="font-semibold text-slate-700">{clockInTimeStr || "Work Session"}</span>
                </>
              ) : (
                renderCheckoutSubtitle()
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {isOnLeaveToday ? (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200">
              On Approved Leave
            </span>
          ) : (
            <>
              <span className="text-[12px] font-semibold text-slate-600 hidden sm:inline">
                {isCheckedIn ? "Check Out" : "Check In"}
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={isCheckedIn}
                onClick={toggleClockInOut}
                title={isCheckedIn ? "Click to Check Out" : "Click to Check In"}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isCheckedIn ? "bg-emerald-500" : "bg-slate-300 hover:bg-slate-400"
                }`}
              >
                <span className="sr-only">Toggle Workday Check-In</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isCheckedIn ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between" suppressHydrationWarning>
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5" suppressHydrationWarning>
          <div className="flex flex-col items-center">
            <span className="text-[16px] font-bold text-slate-900 font-mono leading-none">
              {pad(hours)}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Hours
            </span>
          </div>

          <span className="text-slate-300 font-mono font-bold text-[14px] -mt-2">:</span>

          <div className="flex flex-col items-center">
            <span className="text-[16px] font-bold text-slate-900 font-mono leading-none">
              {pad(minutes)}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Mins
            </span>
          </div>

          <span className="text-slate-300 font-mono font-bold text-[14px] -mt-2">:</span>

          <div className="flex flex-col items-center">
            <span
              className={`text-[16px] font-bold font-mono leading-none ${
                isCheckedIn ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              {pad(seconds)}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Secs
            </span>
          </div>
        </div>

        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded tracking-wider ${
            isOnLeaveToday
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : isCheckedIn
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {isOnLeaveToday ? "ON LEAVE" : isCheckedIn ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}
