"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  Ban,
  Plus,
  Layers
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import UserAvatar from "@/components/UserAvatar";
import InPageSubTabs from "@/components/InPageSubTabs";
import { LeaveRequest } from "@/data/teamflowData";

interface LeaveRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApplyModal?: () => void;
}

export default function LeaveRequestsModal({
  isOpen,
  onClose,
  onOpenApplyModal
}: LeaveRequestsModalProps) {
  const { currentUser, users, projects, leaveRequests, reviewLeaveRequest } = useTeamFlow();

  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";
  const canReview = isCeo || isPm;

  const myManagedProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const myEmployerIds = new Set(
    myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
  );

  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter requests according to role
  const visibleRequests = leaveRequests.filter((lr) => {
    if (isCeo) return true;
    if (isPm) {
      return lr.userId === currentUser.id || myEmployerIds.has(lr.userId);
    }
    // Regular employee sees their own requests
    return lr.userId === currentUser.id;
  });

  const tabFiltered = visibleRequests.filter((lr) => {
    if (activeTab === "All") return true;
    return lr.status === activeTab;
  });

  const pendingCount = visibleRequests.filter((r) => r.status === "Pending").length;

  const handleReview = async (id: string, status: "Approved" | "Rejected") => {
    setProcessingId(id);
    await reviewLeaveRequest(id, status);
    setProcessingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                  Leave Applications &amp; History
                </h2>
                {pendingCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-500">
                {canReview
                  ? "Review, approve, and track staff leave requests"
                  : "View the status of your submitted leave applications"}
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

        {/* In-Page Sub Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <InPageSubTabs<"All" | "Pending" | "Approved" | "Rejected">
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            tabs={[
              {
                id: "All",
                label: "All",
                icon: <Layers className="w-4 h-4" />,
                count: visibleRequests.length,
              },
              {
                id: "Pending",
                label: "Pending",
                icon: <Clock className="w-4 h-4" />,
                count: visibleRequests.filter((r) => r.status === "Pending").length,
              },
              {
                id: "Approved",
                label: "Approved",
                icon: <CheckCircle2 className="w-4 h-4" />,
                count: visibleRequests.filter((r) => r.status === "Approved").length,
              },
              {
                id: "Rejected",
                label: "Rejected",
                icon: <Ban className="w-4 h-4" />,
                count: visibleRequests.filter((r) => r.status === "Rejected").length,
              },
            ]}
          />
        </div>

        {/* List of Leave Requests */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {tabFiltered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-[14px] font-semibold text-slate-600">No leave requests found</div>
              <p className="text-[12px] text-slate-400 max-w-sm mx-auto">
                {activeTab === "All"
                  ? "No leave applications have been submitted yet."
                  : `There are currently no leave requests marked as ${activeTab}.`}
              </p>
            </div>
          ) : (
            tabFiltered.map((req) => {
              const staffUser = users.find((u) => u.id === req.userId);
              const isMultiDay = req.startDate !== req.endDate;
              const isPending = req.status === "Pending";
              const isApproved = req.status === "Approved";
              const isRejected = req.status === "Rejected";

              return (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={staffUser?.avatar}
                        name={req.userName}
                        role={staffUser?.role || req.userRole}
                        className="w-10 h-10 rounded-full border border-slate-200 shrink-0"
                        textClassName="text-[12px]"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-[13px]">{req.userName}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {staffUser?.jobTitle || (req.userRole === "project_manager" ? "Project Manager" : "Employer")}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Applied by {req.appliedByName}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <Ban className="w-3 h-3 text-rose-500" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Dates Requested
                      </span>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0084d4]" />
                        <span>
                          {req.startDate} {isMultiDay && <> &rarr; {req.endDate}</>}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Leave Category
                      </span>
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        {req.leaveType}
                      </span>
                    </div>
                  </div>

                  {req.reason && (
                    <div className="text-[12px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                      <strong className="text-slate-700">Reason: </strong>
                      <span>{req.reason}</span>
                    </div>
                  )}

                  {/* Actions for CEO/PM on pending requests */}
                  {canReview && isPending && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleReview(req.id, "Rejected")}
                        disabled={processingId === req.id}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3 text-slate-500" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleReview(req.id, "Approved")}
                        disabled={processingId === req.id}
                        className="px-3 py-1.5 bg-[#4ade1d] hover:bg-[#3ecb15] text-white rounded-md text-[11px] font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve &amp; Mark on Leave</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

