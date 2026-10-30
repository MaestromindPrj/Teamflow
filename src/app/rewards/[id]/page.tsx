"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Zap,
  Smile,
  Heart,
  Briefcase,
  UserCheck,
  Shield,
  Sparkles,
  Calendar,
  Layers,
  Clock,
  Search
} from "lucide-react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { computeUserRewards } from "@/lib/rewards";
import AwardPointsModal from "@/components/AwardPointsModal";

function StaffRewardDetailContent() {
  const params = useParams();
  const userId = params?.id as string;

  const { users, projects, tasks, rewardsLedger, currentUser } = useTeamFlow();
  const targetUser = users.find((u) => u.id === userId) || users.find((u) => u.role !== "ceo");
  const profile = targetUser
    ? computeUserRewards(targetUser, tasks, projects, rewardsLedger)
    : computeUserRewards(currentUser, tasks, projects, rewardsLedger);

  const [ledgerSearch, setLedgerSearch] = useState("");
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardToastMessage, setAwardToastMessage] = useState<string | null>(null);

  const isCurrentCeo = currentUser.role === "ceo";
  const isCurrentPm = currentUser.role === "project_manager";
  const canAward =
    targetUser &&
    targetUser.id !== currentUser.id &&
    (isCurrentCeo ||
      (isCurrentPm &&
        targetUser.role === "employer" &&
        projects.some(
          (p) =>
            p.projectManagerId === currentUser.id &&
            (p.teamMemberIds.includes(targetUser.id) || p.teamLeadId === targetUser.id)
        )));

  const renderBadgeIcon = (type: "check" | "zap" | "smile" | "award") => {
    switch (type) {
      case "check":
        return <CheckCircle2 className="w-4 h-4 text-[#4ade1d] stroke-[2]" />;
      case "zap":
        return <Zap className="w-4 h-4 text-[#ffa500] fill-[#ffa500] stroke-[1]" />;
      case "smile":
        return <Smile className="w-4 h-4 text-[#0084d4] stroke-[2]" />;
      case "award":
        return <Award className="w-4 h-4 text-purple-600 stroke-[2]" />;
      default:
        return <Award className="w-4 h-4 text-sky-600 stroke-[2]" />;
    }
  };

  if (!targetUser) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header title="Staff Reward Details" subtitle="Performance record and point ledger" />
        <div className="px-7 py-6 space-y-4">
          <Link
            href="/rewards"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-[13px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Rewards</span>
          </Link>
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-600 font-semibold text-[15px]">Staff member not found</p>
            <Link
              href="/rewards"
              className="mt-3 inline-block px-4 py-2 bg-[#0084d4] text-white rounded-lg text-[13px] font-semibold"
            >
              Return to Rewards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser.role === "employer" && targetUser.id !== currentUser.id) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header title="Personal Rewards" subtitle="Performance record and point ledger" />
        <div className="px-7 py-6 space-y-4">
          <Link
            href="/rewards"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-[13px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Rewards</span>
          </Link>
          <div className="bg-white rounded-lg border border-slate-200/90 p-8 text-center max-w-md mx-auto shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-slate-800 font-bold text-[15px]">Access Restricted</h3>
            <p className="text-slate-500 text-[12px]">
              Employers can only view their own rewards and point history. Other staff members&apos; point ledgers are restricted to management.
            </p>
            <Link
              href={`/rewards/${currentUser.id}`}
              className="mt-2 inline-block px-4 py-2 bg-[#0084d4] hover:bg-[#0277bd] text-white rounded-lg text-[12px] font-semibold transition-colors shadow-xs"
            >
              View My Reward Ledger
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser.role === "project_manager" && targetUser.id !== currentUser.id) {
    const isEmployerUnderPm =
      targetUser.role === "employer" &&
      projects.some(
        (p) =>
          p.projectManagerId === currentUser.id &&
          (p.teamMemberIds.includes(targetUser.id) || p.teamLeadId === targetUser.id)
      );

    if (!isEmployerUnderPm) {
      return (
        <div className="flex-1 flex flex-col pb-12">
          <Header title="Project Manager Rewards Oversight" subtitle="Performance record and point ledger" />
          <div className="px-7 py-6 space-y-4">
            <Link
              href="/rewards"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-[13px] font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Rewards</span>
            </Link>
            <div className="bg-white rounded-lg border border-slate-200/90 p-8 text-center max-w-md mx-auto shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-slate-800 font-bold text-[15px]">Access Restricted</h3>
              <p className="text-slate-500 text-[12px]">
                As a Project Manager, you can only inspect your own reward ledger and the rewards of employers assigned to initiatives under your management. Other project managers&apos; reward point history is not accessible.
              </p>
              <Link
                href="/rewards"
                className="mt-2 inline-block px-4 py-2 bg-[#0084d4] hover:bg-[#0277bd] text-white rounded-lg text-[12px] font-semibold transition-colors shadow-xs"
              >
                Return to Rewards Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  const isPm = targetUser.role === "project_manager";

  const filteredHistory = profile.history.filter((log) => {
    if (!ledgerSearch.trim()) return true;
    const q = ledgerSearch.toLowerCase();
    return log.action.toLowerCase().includes(q) || log.reason.toLowerCase().includes(q) || log.date.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title={`${targetUser.id === currentUser.id ? `${targetUser.fullName} (You)` : targetUser.fullName} • Point Ledger & Recognition`}
        subtitle={`Itemized breakdown of performance points, earning milestones, badges, and feedback for ${targetUser.fullName}`}
      />

      <div className="px-7 py-6 space-y-6">
        {awardToastMessage && (
          <div className="p-3 bg-[#4ade1d]/15 border border-[#4ade1d]/30 text-[#4ade1d] rounded-lg text-[12px] font-medium flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4ade1d] shrink-0" />
              <span>{awardToastMessage}</span>
            </div>
            <button
              onClick={() => setAwardToastMessage(null)}
              className="text-[#4ade1d] hover:opacity-80 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/rewards"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-[12px] font-semibold shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to All Rewards</span>
          </Link>

          {canAward && (
            <button
              onClick={() => setIsAwardModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Grant Performance Award</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <img
                src={targetUser.avatar}
                alt={targetUser.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[20px] font-bold text-slate-900">
                    {targetUser.id === currentUser.id ? `${targetUser.fullName} (You)` : targetUser.fullName}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded ${
                      isPm
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30"
                    }`}
                  >
                    {isPm ? <Briefcase className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                    {isPm ? "Project Manager" : targetUser.jobTitle || targetUser.department}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ID: {targetUser.employeeId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {targetUser.email} &bull; {targetUser.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Current Points Balance
                </span>
                <span className="text-[24px] font-extrabold text-slate-900 leading-none">
                  {profile.currentBalance}
                  <span className="text-[12px] font-normal text-slate-400 ml-1">pts</span>
                </span>
              </div>
              <div className="h-9 w-px bg-slate-200" />
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Tier Standing
                  </span>
                  <span className="text-[11px] font-bold text-[#0084d4]">
                    Level {profile.level}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {profile.currentPoints} / {profile.maxPoints} pts to Level {profile.nextLevel}
                </span>
                <div className="w-32 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-[#0084d4] h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(profile.currentPoints / profile.maxPoints) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Logged Milestones</span>
              <span className="text-[15px] font-bold text-slate-800">{profile.history.length} Achievements</span>
            </div>
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Earned Badges</span>
              <span className="text-[15px] font-bold text-purple-700">{profile.badges.length} Unlocked</span>
            </div>
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Accreditation Status</span>
              <span className="text-[15px] font-bold text-[#4ade1d]">Good Standing</span>
            </div>
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Peer Review Score</span>
              <span className="text-[15px] font-bold text-[#0084d4]">98% Approval</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ffa500]" />
                <span>Itemized Points Ledger &amp; Earning Reasons</span>
              </h3>
              <p className="text-[12px] text-slate-500">
                Transparent chronological breakdown of points gained and the exact accomplishments or delivered milestones
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Search ledger entries..."
                className="pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-full sm:w-60"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Action / Deliverable</th>
                  <th className="py-3 px-3.5">Points Gained</th>
                  <th className="py-3 px-3.5">Specific Reason &amp; Business Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px]">
                {filteredHistory.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 text-slate-500 font-medium whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30">
                        {log.points}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 leading-relaxed">
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs space-y-4">
            <h4 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Unlocked Badges &amp; Credentials ({profile.badges.length})</span>
            </h4>
            <div className="space-y-2.5">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-slate-50/60 border border-slate-200/70 rounded-lg p-3 flex items-center gap-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {renderBadgeIcon(badge.type)}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800 leading-tight">
                      {badge.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#de2d1d] fill-[#de2d1d]" />
                <span>Executive &amp; Peer Appreciation</span>
              </h4>
              <p className="text-[13px] text-slate-600 italic my-4 leading-relaxed bg-slate-50/70 p-4 rounded-lg border border-slate-200/80">
                {profile.appreciation.quote}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
              <span className="font-semibold text-slate-700">
                — {profile.appreciation.author}
              </span>
              <span>{profile.appreciation.date}</span>
            </div>
          </div>
        </div>
      </div>

      <AwardPointsModal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        preselectedUserId={targetUser.id}
        onAwardSuccess={(name, pts) => {
          setAwardToastMessage(`Successfully awarded +${pts} points to ${name}!`);
          setTimeout(() => setAwardToastMessage(null), 4000);
        }}
      />
    </div>
  );
}

export default function StaffRewardDetailPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-7 text-slate-400">Loading reward details...</div>}>
      <StaffRewardDetailContent />
    </Suspense>
  );
}
