"use client";

import { useState } from "react";
import { Send, X, AlertCircle, FileText, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

interface RequestMediaDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: {
    attachmentId: string;
    attachmentName: string;
    taskId: string;
    taskTitle: string;
    projectId: string;
    projectName: string;
    projectCode: string;
  } | null;
}

export default function RequestMediaDeletionModal({
  isOpen,
  onClose,
  mediaItem,
}: RequestMediaDeletionModalProps) {
  const { requestMediaDeletion, projects, users } = useTeamFlow();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !mediaItem) return null;

  const project = projects.find((p) => p.id === mediaItem.projectId);
  const teamLead = users.find((u) => u.id === project?.teamLeadId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await requestMediaDeletion({
        taskId: mediaItem.taskId,
        attachmentId: mediaItem.attachmentId,
        reason: reason.trim(),
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setReason("");
        onClose();
      }, 1400);
    } finally {
      setIsSubmitting(false);
    }
  };

  const QUICK_REASONS = [
    "Outdated version / superseded by newer deliverable",
    "Uploaded wrong file by mistake",
    "Duplicate deliverable upload",
    "Client requested revision removal",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200/90 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <ShieldAlert className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Request Deliverable Deletion
                </h3>
                <p className="text-[12px] text-slate-500">
                  Submit a formal request to your Team Lead to delete this media asset
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-[15px] font-bold text-slate-900">
                Request Sent to Team Lead
              </h4>
              <p className="text-[12px] text-slate-500">
                {teamLead?.fullName || "Your Team Lead"} has been notified to review and delete this deliverable.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Deliverable:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[240px]">
                    {mediaItem.attachmentName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Project:</span>
                  <span className="font-semibold text-slate-800">
                    {mediaItem.projectName} ({mediaItem.projectCode})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Designated Team Lead:</span>
                  <span className="font-bold text-[#0084d4]">
                    {teamLead?.fullName || "Assigned Team Lead"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-slate-700">
                  Reason for Deletion <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this deliverable needs to be removed..."
                  className="w-full text-[12px] p-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0084d4] focus:ring-1 focus:ring-[#0084d4] resize-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Quick suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReason(r)}
                      className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-left"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-9 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Request to Team Lead</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

