"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Info
} from "lucide-react";
import { useTeamFlow, getLocalDateString, OfficeLeave } from "@/context/TeamFlowContext";

export default function DashboardCalendarWidget({ className = "" }: { className?: string }) {
  const { currentUser, officeLeaves, leaveRequests, attendance, hasHydrated } = useTeamFlow();

  const today = useMemo(() => new Date(), []);
  const todayStr = getLocalDateString(today);

  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth()); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleResetToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Build calendar matrix for currentMonth & currentYear
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Days from previous month to fill first week
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const prevDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isSunday: boolean }[] = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dObj = new Date(currentYear, currentMonth - 1, d);
      prevDays.push({
        dateStr: getLocalDateString(dObj),
        dayNum: d,
        isCurrentMonth: false,
        isSunday: dObj.getDay() === 0,
      });
    }

    // Days of current month
    const currentDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isSunday: boolean }[] = [];
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dObj = new Date(currentYear, currentMonth, d);
      currentDays.push({
        dateStr: getLocalDateString(dObj),
        dayNum: d,
        isCurrentMonth: true,
        isSunday: dObj.getDay() === 0,
      });
    }

    // Days of next month to complete the grid (up to 35 or 42)
    const totalCells = (prevDays.length + currentDays.length) > 35 ? 42 : 35;
    const remaining = totalCells - (prevDays.length + currentDays.length);
    const nextDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isSunday: boolean }[] = [];
    for (let d = 1; d <= remaining; d++) {
      const dObj = new Date(currentYear, currentMonth + 1, d);
      nextDays.push({
        dateStr: getLocalDateString(dObj),
        dayNum: d,
        isCurrentMonth: false,
        isSunday: dObj.getDay() === 0,
      });
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [currentYear, currentMonth]);

  // Map of Office Leaves / Company Holidays
  const officeLeaveMap = useMemo(() => {
    const map = new Map<string, string>();
    officeLeaves.forEach((leave: OfficeLeave) => {
      const start = leave.date;
      const end = leave.endDate || leave.date;
      // Loop from start to end date
      const cur = new Date(start + "T00:00:00");
      const last = new Date(end + "T00:00:00");
      while (cur <= last) {
        const str = getLocalDateString(cur);
        map.set(str, leave.title);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [officeLeaves]);

  // Map of Personal Approved Leaves for the logged in user
  const personalLeaveMap = useMemo(() => {
    const map = new Map<string, string>();
    // Check approved leave requests for currentUser
    leaveRequests.forEach((req) => {
      if (req.userId === currentUser.id && (req.status === "Approved" || req.status === "Pending")) {
        const start = req.startDate;
        const end = req.endDate || req.startDate;
        const cur = new Date(start + "T00:00:00");
        const last = new Date(end + "T00:00:00");
        while (cur <= last) {
          const str = getLocalDateString(cur);
          map.set(str, `${req.leaveType} (${req.status})`);
          cur.setDate(cur.getDate() + 1);
        }
      }
    });

    // Check attendance records marked as Leave
    attendance.forEach((att) => {
      if (att.userId === currentUser.id && att.status === "Leave") {
        if (!map.has(att.date)) {
          map.set(att.date, att.leaveType ? `${att.leaveType} Leave` : "Approved Leave");
        }
      }
    });

    return map;
  }, [leaveRequests, attendance, currentUser.id]);

  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Upcoming office leaves in next 60 days
  const upcomingOfficeLeaves = useMemo(() => {
    return officeLeaves
      .filter((l: OfficeLeave) => (l.endDate || l.date) >= todayStr)
      .slice(0, 2);
  }, [officeLeaves, todayStr]);

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between ${className}`}
      suppressHydrationWarning
    >
      {/* Calendar Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-lg bg-sky-50 text-[#0084d4] border border-sky-100/80 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Company calendar &amp; schedule</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleResetToday}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-[#0084d4] bg-slate-50 hover:bg-sky-50 border border-slate-200/70 rounded-md transition-colors mr-0.5 cursor-pointer shadow-2xs"
              title="Jump to Today"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {weekDayNames.map((day, idx) => (
            <div
              key={day}
              className={`text-[10px] font-bold py-1 uppercase tracking-wider ${
                idx === 0 ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center" suppressHydrationWarning>
          {calendarDays.map((cell) => {
            const isToday = cell.dateStr === todayStr;
            const officeLeaveTitle = officeLeaveMap.get(cell.dateStr);
            const isOfficeLeave = Boolean(officeLeaveTitle);
            const personalLeaveTitle = personalLeaveMap.get(cell.dateStr);
            const isPersonalLeave = Boolean(personalLeaveTitle);

            // Styling rules:
            // 1. Personal Leave: Red filled box
            // 2. Company Holiday: Blue filled date
            // 3. Sunday: Ash colored box
            // 4. Normal day: clean text
            let cellStyle = "text-slate-700 hover:bg-slate-100/80";
            let tooltip = `${cell.dateStr}`;

            if (isPersonalLeave) {
              cellStyle = "bg-rose-500 text-white font-bold shadow-2xs hover:bg-rose-600";
              tooltip = `${cell.dateStr}: Personal Leave (${personalLeaveTitle})`;
            } else if (isOfficeLeave) {
              cellStyle = "bg-[#0084d4] text-white font-bold shadow-2xs hover:bg-[#0277bd]";
              tooltip = `${cell.dateStr}: Company Holiday (${officeLeaveTitle})`;
            } else if (cell.isSunday) {
              cellStyle = "bg-slate-200/60 text-slate-500 font-semibold border border-slate-200/50";
              tooltip = `${cell.dateStr}: Sunday (Weekly Off)`;
            } else if (!cell.isCurrentMonth) {
              cellStyle = "text-slate-300 font-normal";
            }

            return (
              <div
                key={cell.dateStr}
                title={tooltip}
                className={`relative h-8 rounded-md flex items-center justify-center text-[12px] transition-all cursor-default select-none ${cellStyle} ${
                  isToday ? "ring-2 ring-emerald-500 ring-offset-1 font-extrabold" : ""
                }`}
              >
                <span>{cell.dayNum}</span>
                {isToday && (
                  <span
                    className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                      isOfficeLeave || isPersonalLeave ? "bg-white" : "bg-emerald-500"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Upcoming Company Holidays */}
      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0084d4] shrink-0" />
            <span className="font-semibold text-slate-700">Company Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="font-semibold text-slate-700">Personal Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300 shrink-0" />
            <span className="font-medium text-slate-600">Sunday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white shrink-0" />
            <span className="font-medium text-slate-600">Today</span>
          </div>
        </div>

        {upcomingOfficeLeaves.length > 0 && (
          <div className="bg-sky-50/70 rounded-lg p-2.5 flex items-center justify-between text-[11px] text-sky-950 border border-sky-100">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-[#0084d4] shrink-0" />
              <span className="font-bold truncate text-slate-800">
                {upcomingOfficeLeaves[0].title}
              </span>
              <span className="text-sky-700 text-[10px] font-medium">
                ({upcomingOfficeLeaves[0].date})
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0084d4] text-white shrink-0 shadow-2xs">
              Company Holiday
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
