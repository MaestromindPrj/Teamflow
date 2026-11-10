"use client";

import { useState, useEffect } from "react";
import { X, Award, Sparkles, Check, Heart, Shield, UserCheck, Briefcase } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import UserAvatar from "@/components/UserAvatar";

interface AwardPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedUserId?: string;
  onAwardSuccess?: (recipientName: string, points: number) => void;
}

const CATEGORIES = [
  "Milestone Excellence",
  "Sprint Champion",
  "Technical Innovation",
  "Problem Solver",
  "Quality & Polish",
  "Exemplary Teamwork",
  "Leadership & Mentorship",
  "Executive Recognition",
];

const PRESET_POINTS = [50, 100, 150, 200, 250];

export default function AwardPointsModal({
  isOpen,
  onClose,
  preselectedUserId,
  onAwardSuccess,
}: AwardPointsModalProps) {
  const { currentUser, users, projects, awardRewardPoints } = useTeamFlow();
  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";

  const myManagedProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const myEmployeeIds = new Set(
    myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
  );

  const eligibleRecipients = users.filter((u) => {
    if (u.id === currentUser.id) return false; 
    if (isCeo || isPm) return u.role !== "ceo";
    return false;
  });

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [points, setPoints] = useState<number>(100);
  const [customPoints, setCustomPoints] = useState<string>("");
  const [action, setAction] = useState<string>("Milestone Excellence");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedUserId && eligibleRecipients.some((u) => u.id === preselectedUserId)) {
        setSelectedUserId(preselectedUserId);
      } else if (eligibleRecipients.length > 0) {
        setSelectedUserId(eligibleRecipients[0].id);
      }
      setPoints(100);
      setCustomPoints("");
      setAction(isCeo || isPm ? "Executive Recognition" : "Milestone Excellence");
      setReason("");
      setError(null);
    }
  }, [isOpen, preselectedUserId, eligibleRecipients.length, isCeo, isPm]);

  if (!isOpen) return null;

  const recipient = users.find((u) => u.id === selectedUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUserId) {
      setError("Please select a team member to award points to.");
      return;
    }

    const finalPoints = customPoints ? parseInt(customPoints, 10) : points;
    if (isNaN(finalPoints) || finalPoints <= 0) {
      setError("Please specify a valid positive points amount.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a brief reason or recognition note for this award.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await awardRewardPoints({
        userId: selectedUserId,
        points: finalPoints,
        action,
        reason: reason.trim(),
      });

      if (success) {
        if (onAwardSuccess && recipient) {
          onAwardSuccess(recipient.fullName, finalPoints);
        }
        onClose();
      } else {
        setError("Failed to award points. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred while awarding points.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4.5 bg-gradient-to-r from-sky-50 via-white to-blue-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0084d4]/10 text-[#0084d4] flex items-center justify-center shrink-0 border border-[#0084d4]/20">
              <Award className="w-5 h-5 text-[#0084d4]" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 leading-tight">
                Award Recognition &amp; Reward Points
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {isCeo
                  ? "Executive grant: award performance merit to Project Managers and Employees"
                  : "PM endorsement: grant reward points to employees in your project workforce"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700 flex items-center justify-between">
              <span>Recipient Team Member</span>
              <span className="text-[11px] font-normal text-slate-400">
                {eligibleRecipients.length} eligible
              </span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              required
            >
              {eligibleRecipients.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} — {u.jobTitle || (u.role === "project_manager" ? "Project Manager" : "Employee")}
                </option>
              ))}
            </select>
            {recipient && (
              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                <UserAvatar
                  src={recipient.avatar}
                  name={recipient.fullName}
                  role={recipient.role}
                  className="w-7 h-7 rounded-full border border-slate-200 shrink-0"
                  textClassName="text-[10px]"
                />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800">{recipient.fullName}</span>
                  <span className="text-slate-400 mx-1.5">&bull;</span>
                  <span className="text-slate-500">{recipient.jobTitle || recipient.role}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700 block">
              Points to Award
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_POINTS.map((pt) => {
                const isSelected = points === pt && !customPoints;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => {
                      setPoints(pt);
                      setCustomPoints("");
                    }}
                    className={`py-2 px-2 text-center text-[12px] font-bold rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0084d4] text-white border-[#0084d4] shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    +{pt} pts
                  </button>
                );
              })}
            </div>
            <div className="pt-1.5 flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Or custom:</span>
              <input
                type="number"
                min="1"
                max="2000"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
                placeholder="Custom pts (e.g. 75)"
                className="px-2.5 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-36"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700 block">
              Award Category / Recognition Title
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-700 block">
              Reason / Citation
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Built and delivered real-time streaming pipeline ahead of deadline with zero bugs."
              className="w-full px-3 py-2 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 resize-none"
              required
            />
            <p className="text-[11px] text-slate-400">
              This note will be permanently recorded in the recipient&apos;s itemized points history ledger.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[12px] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? "Awarding Points..." : `Award +${customPoints || points} Points`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

