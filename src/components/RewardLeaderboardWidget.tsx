"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, ArrowRight, Sparkles } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { computeLeaderboard } from "@/lib/rewards";

export default function RewardLeaderboardWidget() {
  const router = useRouter();
  const { currentUser, users, projects, tasks, rewardsLedger } = useTeamFlow();
  const isPm = currentUser.role === "project_manager";
  const isCeo = currentUser.role === "ceo";
  const isEmployer = currentUser.role === "employer";

  const myManagedProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const myEmployerIds = new Set(
    myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
  );

  const dynamicLeaderboard = computeLeaderboard(users, tasks, projects, rewardsLedger);

  const visibleLeaderboard = dynamicLeaderboard.filter((item) => {
    if (isCeo || isEmployer) return true;
    if (isPm) {
      return (
        item.id === currentUser.id ||
        myEmployerIds.has(item.id)
      );
    }
    return true;
  });

  const handleRowClick = (userId: string) => {
    if (isCeo) {
      router.push(`/rewards/${userId}`);
    } else if (isPm) {
      if (userId === currentUser.id || myEmployerIds.has(userId)) {
        router.push(`/rewards/${userId}`);
      }
    } else if (isEmployer) {
      if (userId === currentUser.id) {
        router.push(`/rewards/${currentUser.id}`);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
            {isPm ? "My Team Reward Standings" : "Workforce Reward Leaderboard"}
          </h3>
          <p className="text-[12px] text-slate-500">
            {isPm
              ? "Merit standings for yourself and employers assigned under your management"
              : "Merit standings and gamified points across company project managers and employers"}
          </p>
        </div>

        <Link
          href="/rewards"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0084d4] hover:text-[#0277bd] transition-colors self-start sm:self-auto shrink-0 group"
        >
          <span>View Rewards</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="pb-2.5 pr-3 w-16">Rank</th>
              <th className="pb-2.5 px-3">Team Member</th>
              <th className="pb-2.5 px-3">Job Role</th>
              <th className="pb-2.5 pl-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px]">
            {visibleLeaderboard.map((user) => {
              const isCurrent = user.id === currentUser.id;
              const isClickable =
                isCeo ||
                (isPm && (isCurrent || myEmployerIds.has(user.id))) ||
                (isEmployer && isCurrent);

              return (
                <tr
                  key={user.id}
                  onClick={() => isClickable && handleRowClick(user.id)}
                  className={`transition-colors ${
                    isClickable ? "cursor-pointer" : ""
                  } ${
                    isCurrent
                      ? "bg-sky-50/70 font-medium hover:bg-sky-50"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  <td className="py-2.5 pr-3">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${
                        user.rank === 1
                          ? "bg-[#ffa500]/15 text-[#ffa500] shadow-2xs"
                          : user.rank === 2
                          ? "bg-slate-200 text-slate-700"
                          : user.rank === 3
                          ? "bg-[#ffa500]/15 text-[#ffa500]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      #{user.rank}
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 leading-tight">
                          {isCurrent ? `${user.name} (You)` : user.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium ${
                        user.role === "Project Manager"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="py-2.5 pl-3 text-right">
                    <span className="font-extrabold text-[#0084d4] text-[13px]">
                      {user.points}{" "}
                      <span className="text-[10px] font-normal text-slate-400">pts</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
