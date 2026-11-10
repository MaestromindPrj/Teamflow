"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  CheckCircle2,
  Zap,
  Smile,
  Award,
  Shield,
  Briefcase,
  UserCheck,
  Search,
  Sparkles,
  ArrowRight,
  Users,
  Crown
} from "lucide-react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { computeUserRewards, computeLeaderboard, DynamicRewardProfile } from "@/lib/rewards";
import InPageSubTabs from "@/components/InPageSubTabs";
import AwardPointsModal from "@/components/AwardPointsModal";
import UserAvatar from "@/components/UserAvatar";
import { RewardsSkeleton } from "@/components/Skeletons";

export default function RewardsPage() {
  const router = useRouter();
  const { currentUser, users, projects, tasks, rewardsLedger, hasHydrated } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";

  const [selectedStaffRole, setSelectedStaffRole] = useState<"All" | "project_manager" | "employee">("All");
  const [pmRewardFilter, setPmRewardFilter] = useState<"all" | "leads">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardTargetUserId, setAwardTargetUserId] = useState<string | undefined>(undefined);
  const [awardToastMessage, setAwardToastMessage] = useState<string | null>(null);

  const staffUsers = users.filter((u) => u.role !== "ceo");

  const myManagedProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const myEmployeeIds = new Set(
    myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
  );

  const employeesUnderPm = users.filter((u) => u.role === "employee" && myEmployeeIds.has(u.id));
  const leadsUnderPm = employeesUnderPm.filter((u) => myManagedProjects.some((p) => p.teamLeadId === u.id));
  const displayedEmployeesUnderPm = employeesUnderPm.filter((u) => {
    if (pmRewardFilter === "leads" && !myManagedProjects.some((p) => p.teamLeadId === u.id)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        (u.jobTitle || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allLeaderboard = computeLeaderboard(users, tasks, projects, rewardsLedger);

  const visibleMonthlyLeaderboard = allLeaderboard;

  const filteredStaffUsers = staffUsers.filter((u) => {
    if (selectedStaffRole !== "All" && u.role !== selectedStaffRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        (u.jobTitle || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const myRewards = computeUserRewards(currentUser, tasks, projects, rewardsLedger);

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

  if (!mounted || !hasHydrated || !currentUser.id) {
    return <RewardsSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title={
          isCeo || isPm
            ? "Executive Rewards & Recognition Oversight"
            : "Rewards & Recognition"
        }
        subtitle={
          isCeo || isPm
            ? "Inspect performance milestones, point ledgers, and merit awards across Project Managers and Employees"
            : `Milestones, gamified badges, and quarterly accolades for ${currentUser.fullName}`
        }
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
        {(isCeo || isPm) ? (
          <>
            <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
                  Company-Wide Performance Leaderboard
                </h3>
                <p className="text-[12px] text-slate-500">
                  Relative point standings across Project Managers and Employees
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pr-3 w-16">Rank</th>
                      <th className="pb-3 px-3">Team Member</th>
                      <th className="pb-3 px-3">Role</th>
                      <th className="pb-3 px-3">Job Role</th>
                      <th className="pb-3 pl-3 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {allLeaderboard.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => router.push(`/rewards/${user.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-3 pr-3">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${
                              user.rank === 1
                                ? "bg-[#ffa500]/15 text-[#ffa500]"
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
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              src={user.avatar}
                              name={user.name}
                              role={user.role === "Project Manager" ? "project_manager" : "employee"}
                              className="w-7 h-7 rounded-full border border-slate-200"
                              textClassName="text-[10px]"
                            />
                            <span className="font-semibold text-slate-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
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
                        <td className="py-3 px-3 text-[12px] text-slate-500">
                          {staffUsers.find((u) => u.fullName === user.name)?.jobTitle || user.role || "Software Developer"}
                        </td>
                        <td className="py-3 pl-3 text-right font-extrabold text-slate-900">
                          {user.points} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <InPageSubTabs<"All" | "project_manager" | "employee">
              activeTab={selectedStaffRole}
              onChange={(role) => setSelectedStaffRole(role)}
              tabs={[
                {
                  id: "All",
                  label: "All",
                  icon: <Users className="w-4 h-4" />,
                  count: staffUsers.length,
                },
                {
                  id: "project_manager",
                  label: "Project Managers",
                  icon: <Shield className="w-4 h-4" />,
                  count: staffUsers.filter((u) => u.role === "project_manager").length,
                },
                {
                  id: "employee",
                  label: "Employees",
                  icon: <Briefcase className="w-4 h-4" />,
                  count: staffUsers.filter((u) => u.role === "employee").length,
                },
              ]}
            />

            <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[12px] text-slate-500">
                  Select any member to inspect their itemized point history, milestone reasons, and unlocked credentials.
                </p>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, role, job title..."
                    className="h-9 pl-8 pr-3 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-full sm:w-64 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredStaffUsers.map((user) => {
                  const profile = computeUserRewards(user, tasks, projects, rewardsLedger);
                  const isPm = user.role === "project_manager";

                  return (
                    <div
                      key={user.id}
                      className="bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 p-3.5 rounded-lg transition-all shadow-2xs flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <UserAvatar
                          src={user.avatar}
                          name={user.fullName}
                          role={user.role}
                          className="w-10 h-10 rounded-full border border-slate-200 shrink-0"
                          textClassName="text-[12px]"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[13px] font-bold text-slate-900 truncate">
                            {user.fullName}
                          </h3>
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isPm
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-[#4ade1d]/15 text-[#4ade1d]"
                              }`}
                            >
                              {isPm ? <Briefcase className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
                              {isPm ? "Project Manager" : user.jobTitle || "Employee"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Points Balance</span>
                          <span className="font-extrabold text-slate-900 text-[14px]">
                            {profile?.currentBalance ?? 0}{" "}
                            <span className="text-[11px] font-normal text-slate-400">pts</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Tier</span>
                          <span className="font-bold text-[#0084d4]">
                            Level {profile?.level ?? 1}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setAwardTargetUserId(user.id);
                            setIsAwardModalOpen(true);
                          }}
                          className="flex-1 py-2 px-3.5 rounded-lg text-[12px] font-semibold bg-[#0084d4] hover:bg-[#0277bd] text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          title={`Award points to ${user.fullName}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Award</span>
                        </button>
                        <Link
                          href={`/rewards/${user.id}`}
                          className="py-2 px-3 rounded-lg text-[12px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 group shadow-2xs"
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[12px] text-slate-400 font-normal">
                    {isPm ? "My PM Point Balance" : "Current Point Balance"}
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-[28px] font-bold text-slate-900 leading-none">
                      {myRewards.currentBalance}
                    </span>
                    <span className="text-[14px] text-slate-400 font-normal">Points</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Tier Level {myRewards.level}</span>
                    <span className="text-slate-400 font-normal">
                      {myRewards.currentPoints} / {myRewards.maxPoints} points (Next: Level {myRewards.nextLevel})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0084d4] h-full rounded-full transition-all duration-300"
                      style={{ width: `${(myRewards.currentPoints / myRewards.maxPoints) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Link
                    href={`/rewards/${currentUser.id}`}
                    className="w-full py-2 px-3 rounded-lg text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 bg-[#0084d4] hover:bg-[#0277bd] text-white shadow-xs cursor-pointer group"
                  >
                    <span>View My Points History</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#de2d1d] font-semibold text-[13px]">
                    <Heart className="w-4 h-4 fill-[#de2d1d] stroke-[#de2d1d]" />
                    <span>Executive &amp; Peer Appreciation</span>
                  </div>
                  {myRewards.appreciation.all?.length > 0 && (
                    <span className="text-[11px] font-bold text-[#de2d1d] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      {myRewards.appreciation.all.length} {myRewards.appreciation.all.length === 1 ? "Note" : "Notes"}
                    </span>
                  )}
                </div>

                {(!myRewards.appreciation.all || myRewards.appreciation.all.length === 0) ? (
                  <div className="space-y-3">
                    <p className="text-[13px] text-slate-500 font-normal italic leading-relaxed bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80">
                      {myRewards.appreciation.quote}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span className="text-slate-400 italic">Awaiting first recognition note</span>
                      <span>—</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {myRewards.appreciation.all.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3.5 space-y-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                            {item.action}
                          </span>
                          <span className="text-[10px] font-bold text-[#4ade1d] bg-[#4ade1d]/10 px-1.5 py-0.5 rounded">
                            +{item.points} pts
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-700 italic leading-relaxed">
                          &ldquo;{item.reason}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                          <span className="font-semibold text-slate-800">— {item.author}</span>
                          <span className="text-slate-400">{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

        

            {isPm && (
              <div className="space-y-4">
                <InPageSubTabs<"all" | "leads">
                  activeTab={pmRewardFilter}
                  onChange={(filter) => setPmRewardFilter(filter)}
                  tabs={[
                    {
                      id: "all",
                      label: "All Employees Under Me",
                      icon: <Users className="w-4 h-4" />,
                      count: employeesUnderPm.length,
                    },
                    {
                      id: "leads",
                      label: "Appointed Team Leads",
                      icon: <Crown className="w-4 h-4" />,
                      count: leadsUnderPm.length,
                    },
                  ]}
                />

                <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#4ade1d]" />
                        <span>Team Rewards Oversight &bull; Employees Under My Management ({displayedEmployeesUnderPm.length})</span>
                      </h3>
                      <p className="text-[12px] text-slate-500">
                        Performance standings and point balances for employees assigned to initiatives under your management
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search employees under you..."
                        className="h-9 pl-8 pr-3 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-full sm:w-60 shadow-2xs"
                      />
                    </div>
                  </div>

                  {displayedEmployeesUnderPm.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-[13px]">
                      No employees under your management match this criteria.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {displayedEmployeesUnderPm.map((emp) => {
                        const profile = computeUserRewards(emp, tasks, projects, rewardsLedger);
                        const empLeadProjects = myManagedProjects.filter((p) => p.teamLeadId === emp.id);

                        return (
                          <div
                            key={emp.id}
                            className="bg-white border border-slate-200/90 hover:border-[#0084d4] p-4 rounded-lg transition-all shadow-2xs flex flex-col justify-between space-y-3 group"
                          >
                            <div className="flex items-start gap-3">
                              <UserAvatar
                                src={emp.avatar}
                                name={emp.fullName}
                                role={emp.role}
                                className="w-11 h-11 rounded-full border border-slate-200 shrink-0 group-hover:border-[#0084d4] transition-colors"
                                textClassName="text-[13px]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-[#0084d4] transition-colors">
                                    {emp.id === currentUser.id ? `${emp.fullName} (You)` : emp.fullName}
                                  </h4>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {emp.jobTitle || "Employee"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <div>
                                <span className="text-slate-400 text-[10px] block">Points Balance</span>
                                <span className="font-extrabold text-slate-900 text-[14px]">
                                  {profile?.currentBalance ?? 0} <span className="text-[11px] font-normal text-slate-400">pts</span>
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 text-[10px] block">Tier</span>
                                <span className="font-bold text-[#0084d4]">Level {profile?.level ?? 1}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => {
                                  setAwardTargetUserId(emp.id);
                                  setIsAwardModalOpen(true);
                                }}
                                className="flex-1 py-2 px-3.5 rounded-lg text-[12px] font-semibold bg-[#0084d4] hover:bg-[#0277bd] text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                title={`Award points to ${emp.fullName}`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Award</span>
                              </button>
                              <Link
                                href={`/rewards/${emp.id}`}
                                className="py-2 px-3 rounded-lg text-[12px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 group/btn shadow-2xs"
                              >
                                <span>Details</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-slate-900 tracking-tight mb-4">
                    Earned Badges &amp; Milestones
                  </h2>

                  <div className="space-y-2.5">
                    {myRewards.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="bg-slate-50/70 border border-slate-100 rounded-lg p-3 flex items-center gap-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-md bg-white border border-slate-200/80 flex items-center justify-center shrink-0">
                          {renderBadgeIcon(badge.type)}
                        </div>
                        <div>
                          <h3 className="text-[13px] font-bold text-slate-800 leading-tight">
                            {badge.title}
                          </h3>
                          <p className="text-[12px] text-slate-400 font-normal mt-0.5">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100">
                  <Link
                    href={`/rewards/${currentUser.id}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0084d4] hover:text-[#0277bd]"
                  >
                    <span>View full badges &amp; accreditation history on separate page</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight mb-4">
                  Monthly Leaderboard
                </h2>

                <div className="space-y-1.5">
                  {visibleMonthlyLeaderboard.map((user) => {
                    const isCurrent = user.id === currentUser.id;
                    const isClickable =
                      isCeo ||
                      isPm ||
                      (!isPm && user.id === currentUser.id);

                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          if (!isClickable) return;
                          router.push(`/rewards/${user.id}`);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${
                          isClickable ? "cursor-pointer" : ""
                        } ${
                          isCurrent
                            ? "bg-[#0084d4] text-white font-medium shadow-2xs"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`text-[12px] font-medium w-4 text-center shrink-0 ${
                              isCurrent ? "text-white" : "text-slate-400"
                            }`}
                          >
                            {user.rank}
                          </span>
                          <UserAvatar
                            src={user.avatar}
                            name={user.name}
                            className="w-6 h-6 rounded-full border border-white/40 shrink-0"
                            textClassName="text-[9px]"
                          />
                          <span className="truncate text-[13px]">
                            {isCurrent ? `${user.name} (You)` : user.name}
                          </span>
                        </div>
                        <span
                          className={`text-[12px] font-semibold shrink-0 ${
                            isCurrent ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {user.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AwardPointsModal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        preselectedUserId={awardTargetUserId}
        onAwardSuccess={(name, pts) => {
          setAwardToastMessage(`Successfully granted +${pts} reward points to ${name}!`);
          setTimeout(() => setAwardToastMessage(null), 4000);
        }}
      />
    </div>
  );
}
