"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  CalendarDays
} from "lucide-react";
import { useTeamFlow, getLocalDateString } from "@/context/TeamFlowContext";
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

export default function ApplyLeaveModal({
  isOpen,
  onClose,
  defaultDate,
  defaultUserId
}: ApplyLeaveModalProps) {
  const { currentUser, users, projects, applyLeave } = useTeamFlow();

  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";
  const canManageOthers = isCeo || isPm;

  const todayStr = getLocalDateString(new Date());

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
  const [startDate, setStartDate] = useState<string>(defaultDate || todayStr);
  const [endDate, setEndDate] = useState<string>(defaultDate || todayStr);
  const [leaveType, setLeaveType] = useState<string>(LEAVE_TYPES[0].id);
  const [reason, setReason] = useState<string>("");
  const [isImmediateApproved, setIsImmediateApproved] = useState<boolean>(canManageOthers);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

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
      setErrorMsg("Please select a start date.");
      return;
    }
    if (isRange && endDate && endDate < startDate) {
      setErrorMsg("End date cannot be earlier than start date.");
      return;
    }

    setIsSubmitting(true);
    const finalEndDate = isRange ? endDate : startDate;
    const approvalStatus = (canManageOthers && isImmediateApproved) ? "Approved" : "Pending";

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
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
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
                  ? "Schedule approved leave for staff today or upcoming dates"
                  : "Submit a formal leave request for management review"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[13px] overflow-y-auto max-h-[82vh]">
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

          {/* Employee Selector for CEO / PM */}
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

          {/* Duration Type: Single Day vs Date Range */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700 block">Duration Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsRange(false)}
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
                onClick={() => setIsRange(true)}
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

          {/* Date Picker */}
          {!isRange ? (
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-700 block">
                Leave Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setEndDate(e.target.value);
                  }}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0084d4]"
                  required
                />
              </div>
              {startDate === todayStr && (
                <span className="text-[11px] font-semibold text-[#0084d4] block">
                  &bull; This leave applies to Today
                </span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 block">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0084d4]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 block">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0084d4]"
                  required
                />
              </div>
            </div>
          )}

          {/* Leave Type */}
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

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700 block">Reason / Details</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending family function, medical appointment, vacation..."
              rows={3}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0084d4] resize-none"
            />
          </div>

          {/* Immediate Approval Switch for CEO / PM */}
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

