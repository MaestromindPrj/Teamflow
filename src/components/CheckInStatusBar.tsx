"use client";

import { useEffect, useState } from "react";
import { Clock, Play, Pause, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { useTeamFlow, getLocalDateString } from "@/context/TeamFlowContext";

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
  const isOnLeaveToday = attendance.some(
    (r) => r.userId === currentUser.id && r.date === todayStr && r.status === "Leave"
  );

  const isCheckedIn = !isOnLeaveToday && (currentUserClockIn?.isClockedIn ?? false);
  const clockInTimestamp = currentUserClockIn?.clockInTimestamp;
  const elapsedSecondsBase = currentUserClockIn?.elapsedSeconds ?? 0;
  const clockInTimeStr = currentUserClockIn?.clockInTimeString;
  const clockOutTimeStr = currentUserClockIn?.clockOutTimeString;

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
                  <span className="font-semibold text-slate-700">{clockInTimeStr || "Morning"}</span>
                </>
              ) : clockOutTimeStr ? (
                <>
                  Last checked out at{" "}
                  <span className="font-semibold text-slate-700">{clockOutTimeStr}</span>
                </>
              ) : (
                "You are currently checked out. Click the toggle to start your work session."
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
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
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
