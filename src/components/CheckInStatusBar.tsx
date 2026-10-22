"use client";

import { useEffect, useState } from "react";
import { Clock, Play, Pause, CheckCircle2, AlertCircle } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

export default function CheckInStatusBar({ className = "" }: { className?: string }) {
  const { currentUser, currentUserClockIn, toggleClockInOut } = useTeamFlow();
  const [tickerSeconds, setTickerSeconds] = useState<number>(0);

  const isCheckedIn = currentUserClockIn?.isClockedIn ?? false;
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

  return (
    <div className={`bg-white rounded-lg border border-slate-200/90 shadow-2xs p-4 sm:p-5 transition-all flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isCheckedIn
                ? "bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30 shadow-2xs"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            <Clock className={`w-5 h-5 ${isCheckedIn ? "animate-pulse" : ""}`} />
          </div>

          <div className="space-y-0.5 min-w-0">
            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
              Workday Check-In
            </h3>

            <p className="text-[12px] text-slate-500 leading-snug">
              {isCheckedIn ? (
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
          <span className="text-[12px] font-semibold text-slate-600 hidden sm:inline">
            {isCheckedIn ? "Check Out" : "Check In"}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={isCheckedIn}
            onClick={toggleClockInOut}
            title={isCheckedIn ? "Click to Check Out" : "Click to Check In"}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0084d4] focus:ring-offset-2 ${
              isCheckedIn ? "bg-[#4ade1d]" : "bg-slate-300 hover:bg-slate-400"
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
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5">
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
                isCheckedIn ? "text-[#4ade1d]" : "text-slate-500"
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
          className={`text-[11px] font-bold px-2 py-1 rounded-md tracking-wider ${
            isCheckedIn ? "bg-[#4ade1d]/15 text-[#4ade1d]" : "bg-slate-100 text-slate-600"
          }`}
        >
          {isCheckedIn ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}
