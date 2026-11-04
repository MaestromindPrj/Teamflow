"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTeamFlow, getLocalDateString, OfficeLeave } from "@/context/TeamFlowContext";
import UserAvatar from "@/components/UserAvatar";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultUserId?: string;
}

const LEAVE_TYPES = [
  { id: "Casual Leave", label: "Casual Leave (CL)", desc: "Personal matters and planned rest" },
  { id: "Sick / Medical Leave", label: "Sick / Medical Leave (SL)", desc: "Health issues, recovery, doctor visits" },
  { id: "Emergency Leave", label: "Emergency / Personal", desc: "Urgent family or unforeseen circumstances" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ApplyLeaveModal({
  isOpen,
  onClose,
  defaultDate,
  defaultUserId
}: ApplyLeaveModalProps) {
  const { currentUser, users, projects, applyLeave, officeLeaves } = useTeamFlow();

  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";
  const canManageOthers = isCeo || isPm;

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getLocalDateString(today), [today]);

  const officeLeaveMap = useMemo(() => {
    const map = new Map<string, string>();
    (officeLeaves || []).forEach((leave: OfficeLeave) => {
      const start = leave.date;
      const end = leave.endDate || leave.date;
      const cur = new Date(start + "T00:00:00");
      const last = new Date(end + "T00:00:00");
      while (cur <= last) {
        map.set(getLocalDateString(cur), leave.title);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [officeLeaves]);

  const getDateBlockStatus = (dateStr: string): { isBlocked: boolean; reason?: string; isSunday: boolean; holidayTitle?: string } => {
    if (!dateStr) return { isBlocked: false, isSunday: false };
    const dObj = new Date(dateStr + "T00:00:00");
    const isSunday = dObj.getDay() === 0;
    const holidayTitle = officeLeaveMap.get(dateStr);
    const isCompanyHoliday = Boolean(holidayTitle);

    if (isSunday) {
      return { isBlocked: true, reason: "Sunday (Weekly Off)", isSunday: true };
    }
    if (isCompanyHoliday) {
      return { isBlocked: true, reason: `Company Holiday (${holidayTitle})`, isSunday: false, holidayTitle };
    }
    return { isBlocked: false, isSunday: false };
  };

  const findNextValidWorkingDate = (baseStr?: string): string => {
    const cur = baseStr ? new Date(baseStr + "T00:00:00") : new Date();
    for (let i = 0; i < 90; i++) {
      const str = getLocalDateString(cur);
      const isSun = cur.getDay() === 0;
      const isHol = officeLeaveMap.has(str);
      if (!isSun && !isHol) {
        return str;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return getLocalDateString(new Date());
  };

  const myManagedProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const myEmployerIds = new Set(
    myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
  );

  const eligibleUsers = isCeo
    ? users.filter((u) => u.role !== "ceo")
    : isPm
    ? users.filter((u) => u.id === currentUser.id || myEmployerIds.has(u.id))
    : [currentUser];

  const [selectedUserId, setSelectedUserId] = useState<string>(
    defaultUserId || (canManageOthers ? eligibleUsers[0]?.id || currentUser.id : currentUser.id)
  );

  const [isRange, setIsRange] = useState<boolean>(false);
  const [rangePickingTarget, setRangePickingTarget] = useState<"start" | "end">("start");

  const [startDate, setStartDate] = useState<string>(() => {
    const base = defaultDate || todayStr;
    const block = getDateBlockStatus(base);
    return block.isBlocked ? findNextValidWorkingDate(base) : base;
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const base = defaultDate || todayStr;
    const block = getDateBlockStatus(base);
    return block.isBlocked ? findNextValidWorkingDate(base) : base;
  });

  const [currentYear, setCurrentYear] = useState<number>(() => {
    const initDate = defaultDate ? new Date(defaultDate + "T00:00:00") : new Date();
    return initDate.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const initDate = defaultDate ? new Date(defaultDate + "T00:00:00") : new Date();
    return initDate.getMonth();
  });

  const [leaveType, setLeaveType] = useState<string>(LEAVE_TYPES[0].id);
  const [reason, setReason] = useState<string>("");
  const [isImmediateApproved, setIsImmediateApproved] = useState<boolean>(canManageOthers);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (defaultUserId) setSelectedUserId(defaultUserId);
      const base = defaultDate || todayStr;
      const block = getDateBlockStatus(base);
      const initial = block.isBlocked ? findNextValidWorkingDate(base) : base;
      setStartDate(initial);
      setEndDate(initial);
      const dObj = new Date(initial + "T00:00:00");
      setCurrentYear(dObj.getFullYear());
      setCurrentMonth(dObj.getMonth());
      setErrorMsg("");
      setSuccessMsg("");
      setRangePickingTarget("start");
    }
  }, [isOpen, defaultDate, defaultUserId]);

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

  const handleJumpToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDaysInMonth = lastDayOfMonth.getDate();

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

  const { workingDaysCount, sundayCount, holidayCount } = useMemo(() => {
    if (!startDate) return { workingDaysCount: 0, sundayCount: 0, holidayCount: 0 };
    const effectiveEnd = isRange ? (endDate || startDate) : startDate;
    if (effectiveEnd < startDate) return { workingDaysCount: 0, sundayCount: 0, holidayCount: 0 };

    let working = 0;
    let sundays = 0;
    let holidays = 0;

    const cur = new Date(startDate + "T00:00:00");
    const last = new Date(effectiveEnd + "T00:00:00");
    while (cur <= last) {
      const str = getLocalDateString(cur);
      const isSun = cur.getDay() === 0;
      const isHol = officeLeaveMap.has(str);
      if (isSun) {
        sundays++;
      } else if (isHol) {
        holidays++;
      } else {
        working++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return { workingDaysCount: working, sundayCount: sundays, holidayCount: holidays };
  }, [startDate, endDate, isRange, officeLeaveMap]);

  const handleCellClick = (dateStr: string) => {
    const status = getDateBlockStatus(dateStr);
    if (status.isBlocked) {
      setErrorMsg(`Cannot select ${dateStr}: ${status.reason} is already a holiday.`);
      return;
    }

    setErrorMsg("");

    if (!isRange) {
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else {
      if (rangePickingTarget === "start") {
        setStartDate(dateStr);
        if (endDate && dateStr > endDate) {
          setEndDate(dateStr);
        }
        setRangePickingTarget("end");
      } else {
        if (dateStr < startDate) {
          setStartDate(dateStr);
        } else {
          setEndDate(dateStr);
        }
      }
    }
  };

  const formatHumanDate = (dateStr: string) => {
    if (!dateStr) return "None";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (!isOpen) return null;

  const targetUser = users.find((u) => u.id === selectedUserId) || currentUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedUserId) {
      setErrorMsg("Please select an employee.");
      return;
    }
    if (!startDate) {
      setErrorMsg("Please select a leave date from the calendar.");
      return;
    }

    const startStatus = getDateBlockStatus(startDate);
    if (startStatus.isBlocked) {
      setErrorMsg(`Cannot apply leave on ${startDate}: ${startStatus.reason} is already a holiday.`);
      return;
    }

    if (isRange) {
      if (!endDate) {
        setErrorMsg("Please select an end date from the calendar.");
        return;
      }
      const endStatus = getDateBlockStatus(endDate);
      if (endStatus.isBlocked) {
        setErrorMsg(`Cannot apply leave ending on ${endDate}: ${endStatus.reason} is already a holiday.`);
        return;
      }
      if (endDate < startDate) {
        setErrorMsg("End date cannot be earlier than start date.");
        return;
      }
      if (workingDaysCount === 0) {
        setErrorMsg("Selected range has 0 working days.");
        return;
      }
    }

    setIsSubmitting(true);
    const finalEndDate = isRange ? endDate : startDate;
    const approvalStatus = canManageOthers && isImmediateApproved ? "Approved" : "Pending";

    const res = await applyLeave({
      userId: targetUser.id,
      startDate,
      endDate: finalEndDate,
      leaveType,
      reason,
      status: approvalStatus,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(
        approvalStatus === "Approved"
          ? `Leave granted and marked for ${targetUser.fullName}!`
          : "Leave request submitted successfully for approval."
      );
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || "Failed to process leave application.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                {canManageOthers ? "Mark Employee on Leave / Grant Leave" : "Apply for Leave"}
              </h2>
              <p className="text-[12px] text-slate-500">
                {canManageOthers
                  ? "Select dates using the calendar"
                  : "Pick your leave dates on the calendar"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[13px] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 text-[12px]">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 text-[12px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {canManageOthers ? (
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-700 block">
                Select Employee <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0084d4] cursor-pointer"
              >
                {eligibleUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.jobTitle || (u.role === "project_manager" ? "Project Manager" : "Employer")})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <UserAvatar
                src={currentUser.avatar}
                name={currentUser.fullName}
                role={currentUser.role}
                className="w-10 h-10 rounded-full border border-slate-200"
                textClassName="text-[12px]"
              />
              <div>
                <div className="font-bold text-slate-900">{currentUser.fullName}</div>
                <div className="text-[11px] text-slate-500">{currentUser.jobTitle || "Employer"}</div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700 block">Duration Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsRange(false);
                  setEndDate(startDate);
                }}
                className={`py-2 px-3 rounded-lg border text-[12px] font-semibold transition-colors cursor-pointer text-center ${
                  !isRange
                    ? "bg-[#0084d4] text-white border-[#0084d4] shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Single Day
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRange(true);
                  setRangePickingTarget("end");
                }}
                className={`py-2 px-3 rounded-lg border text-[12px] font-semibold transition-colors cursor-pointer text-center ${
                  isRange
                    ? "bg-[#0084d4] text-white border-[#0084d4] shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Date Range (Multi-Day)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-slate-700 block">
                Select Leave Date(s) on Calendar <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/30">
              {isRange && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setRangePickingTarget("start")}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      rangePickingTarget === "start"
                        ? "border-[#0084d4] bg-sky-50 ring-1 ring-[#0084d4]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                      <span>Start Date</span>
                      {rangePickingTarget === "start" && (
                        <span className="text-[#0084d4] font-semibold text-[10px]">&bull; Picking</span>
                      )}
                    </div>
                    <div className="text-[12px] font-bold text-slate-800 truncate mt-0.5">
                      {formatHumanDate(startDate)}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRangePickingTarget("end")}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      rangePickingTarget === "end"
                        ? "border-[#0084d4] bg-sky-50 ring-1 ring-[#0084d4]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                      <span>End Date</span>
                      {rangePickingTarget === "end" && (
                        <span className="text-[#0084d4] font-semibold text-[10px]">&bull; Picking</span>
                      )}
                    </div>
                    <div className="text-[12px] font-bold text-slate-800 truncate mt-0.5">
                      {formatHumanDate(endDate)}
                    </div>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[14px] text-slate-900">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleJumpToday}
                    className="px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:text-[#0084d4] bg-white hover:bg-sky-50 border border-slate-200 rounded-md transition-colors mr-1 cursor-pointer"
                    title="Jump to current month"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1 select-none">
                {WEEKDAY_NAMES.map((name, idx) => (
                  <div
                    key={name}
                    className={`text-[10px] font-bold py-1 uppercase tracking-wider ${
                      idx === 0 ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {name}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center" suppressHydrationWarning>
                {calendarDays.map((cell) => {
                  const isToday = cell.dateStr === todayStr;
                  const holidayTitle = officeLeaveMap.get(cell.dateStr);
                  const isCompanyHoliday = Boolean(holidayTitle);
                  const isSunday = cell.isSunday;
                  const isBlocked = isSunday || isCompanyHoliday;

                  const isSelectedStart = cell.dateStr === startDate;
                  const isSelectedEnd = isRange && cell.dateStr === endDate;
                  const isSelected = isSelectedStart || isSelectedEnd;
                  const isInRangeSpan =
                    isRange &&
                    startDate &&
                    endDate &&
                    cell.dateStr > startDate &&
                    cell.dateStr < endDate;

                  let tooltip = cell.dateStr;
                  let cellClasses = "";

                  if (isSunday) {
                    tooltip = `${cell.dateStr}: Sunday — already a holiday, cannot be selected`;
                    cellClasses = "bg-slate-100 text-slate-400 border border-slate-200/70 cursor-not-allowed select-none opacity-80";
                  } else if (isCompanyHoliday) {
                    tooltip = `${cell.dateStr}: Company Holiday (${holidayTitle}) — already a holiday, cannot be selected`;
                    cellClasses = "bg-sky-50 text-[#0084d4] border border-sky-200 font-semibold cursor-not-allowed select-none";
                  } else if (isSelected) {
                    tooltip = `${cell.dateStr}: Selected ${isSelectedStart && isSelectedEnd ? "Leave Date" : isSelectedStart ? "Start Date" : "End Date"}`;
                    cellClasses = "bg-[#0084d4] text-white font-bold shadow-xs ring-2 ring-[#0084d4]/30 cursor-pointer";
                  } else if (isInRangeSpan) {
                    tooltip = `${cell.dateStr}: In selected leave range`;
                    cellClasses = "bg-sky-100 text-[#0084d4] font-semibold hover:bg-sky-200/70 cursor-pointer";
                  } else {
                    tooltip = `${cell.dateStr}: Click to select`;
                    cellClasses = `bg-white hover:bg-sky-50 hover:border-sky-300 text-slate-800 font-medium border border-slate-200/80 cursor-pointer transition-colors ${
                      !cell.isCurrentMonth ? "text-slate-300 hover:text-slate-600" : ""
                    }`;
                  }

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => handleCellClick(cell.dateStr)}
                      title={tooltip}
                      className={`relative h-8 rounded-md flex flex-col items-center justify-center text-[12px] transition-all ${cellClasses} ${
                        isToday && !isSelected ? "ring-1 ring-emerald-500 font-bold" : ""
                      }`}
                    >
                      <span className="leading-none">{cell.dayNum}</span>

                      {isCompanyHoliday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0084d4] mt-0.5" />
                      )}
                      {isSunday && !isCompanyHoliday && (
                        <span className="text-[8px] leading-none text-slate-400 font-normal">Off</span>
                      )}
                      {isToday && !isSelected && !isCompanyHoliday && !isSunday && (
                        <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-2 pt-2.5 mt-2.5 border-t border-slate-200/70">
                <div className="flex items-center gap-1.5" title="Company holiday is already off and cannot be selected">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0084d4] shrink-0" />
                  <span className="font-semibold text-slate-700">Company Holiday</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0084d4] shrink-0" />
                  <span className="font-semibold text-[#0084d4]">Selected Leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 bg-white shrink-0" />
                  <span className="font-medium text-slate-600">Today</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-sky-50/60 border border-sky-100 rounded-lg flex items-center justify-between text-[11px] text-slate-700">
              <div className="flex items-center gap-2 truncate">
                <Calendar className="w-3.5 h-3.5 text-[#0084d4] shrink-0" />
                <span className="font-medium truncate">
                  {!isRange ? (
                    <>
                      Leave for <strong className="text-slate-900">{formatHumanDate(startDate)}</strong>
                    </>
                  ) : (
                    <>
                      From <strong className="text-slate-900">{formatHumanDate(startDate)}</strong> to{" "}
                      <strong className="text-slate-900">{formatHumanDate(endDate)}</strong>
                    </>
                  )}
                </span>
              </div>
              <div className="font-bold text-[#0084d4] shrink-0 pl-2">
                {workingDaysCount} working {workingDaysCount === 1 ? "day" : "days"}
                {isRange && (sundayCount > 0 || holidayCount > 0) && (
                  <span className="text-slate-500 font-normal ml-1">
                    ({[
                      sundayCount > 0 ? `${sundayCount} Sunday` : null,
                      holidayCount > 0 ? `${holidayCount} Holiday` : null,
                    ]
                      .filter(Boolean)
                      .join(", ")})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700 block">
              Leave Category <span className="text-red-500">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0084d4] cursor-pointer"
            >
              {LEAVE_TYPES.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700 block">Reason / Details</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending family function, medical appointment, vacation..."
              rows={2}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0084d4] resize-none"
            />
          </div>

          {canManageOthers && (
            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-sky-50/70 border border-sky-100 cursor-pointer">
              <input
                type="checkbox"
                checked={isImmediateApproved}
                onChange={(e) => setIsImmediateApproved(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#0084d4] focus:ring-[#0084d4] border-slate-300"
              />
              <div className="text-[12px]">
                <strong className="text-slate-900 block font-semibold">
                  Grant &amp; Mark as Approved Immediately
                </strong>
                <span className="text-slate-500">
                  Directly writes official Leave status to company attendance records and updates live counters.
                </span>
              </div>
            </label>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-[12px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#0084d4] hover:bg-[#0277bd] text-white rounded-lg font-semibold text-[12px] transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "Processing..."
                  : canManageOthers
                  ? isImmediateApproved
                    ? "Grant & Mark on Leave"
                    : "Submit Leave Entry"
                  : "Submit Leave Request"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
