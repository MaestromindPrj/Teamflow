"use client";

import { useState } from "react";
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
import { USER_REWARDS_DATA, REWARDS_DATA, BadgeItem } from "@/data/mockData";
import InPageSubTabs from "@/components/InPageSubTabs";

export default function RewardsPage() {
  const router = useRouter();
  const { currentUser, users, projects } = useTeamFlow();
  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";

  const [selectedStaffRole, setSelectedStaffRole] = useState<"All" | "project_manager" | "employer">("All");
  const [pmRewardFilter, setPmRewardFilter] = useState<"all" | "leads">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const staffUsers = users.filter((u) => u.role !== "ceo");

  // For Project Managers, scope to projects and employers under their management
  const myManagedProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const myEmployerIds = new Set(
    myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
  );

  const employersUnderPm = users.filter((u) => u.role === "employer" && myEmployerIds.has(u.id));
  const leadsUnderPm = employersUnderPm.filter((u) => myManagedProjects.some((p) => p.teamLeadId === u.id));
  const displayedEmployersUnderPm = employersUnderPm.filter((u) => {
    if (pmRewardFilter === "leads" && !myManagedProjects.some((p) => p.teamLeadId === u.id)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.jobTitle.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const visibleMonthlyLeaderboard = REWARDS_DATA.leaderboard.filter((item) => {
    if (isCeo || (!isPm && currentUser.role === "employer")) return true;
    if (isPm) {
      const matched = users.find((u) => u.fullName === item.name);
      if (!matched) return false;
      return (
        matched.id === currentUser.id ||
        (matched.role === "employer" && myEmployerIds.has(matched.id))
      );
    }
    return true;
  });

  const filteredStaffUsers = staffUsers.filter((u) => {
    if (selectedStaffRole !== "All" && u.role !== selectedStaffRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.jobTitle.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const myRewards = USER_REWARDS_DATA[currentUser.id] || REWARDS_DATA;

  const renderBadgeIcon = (type: BadgeItem["type"]) => {
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

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title={
          isCeo
            ? "Executive Rewards & Recognition Oversight"
            : isPm
            ? "Rewards & Performance Oversight"
            : "Rewards & Recognition"
        }
        subtitle={
          isCeo
            ? "Inspect performance milestones, point ledgers, and merit awards across Project Managers and Employers"
            : isPm
            ? "Track your personal milestones and oversee reward standings for employers under your management"
            : `Milestones, gamified badges, and quarterly accolades for ${currentUser.fullName}`
        }
      />

      <div className="px-7 py-6 space-y-6">
        {isCeo ? (
          <>
            {/* CEO Workforce Rewards In-Page Subtabs */}
            <InPageSubTabs<"All" | "project_manager" | "employer">
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
                  id: "employer",
                  label: "Employers",
                  icon: <Briefcase className="w-4 h-4" />,
                  count: staffUsers.filter((u) => u.role === "employer").length,
                },
              ]}
            />

            {/* Filter and Selection Section */}
            <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[12px] text-slate-500">
                  Select any staff member to inspect their itemized point history, milestone reasons, and unlocked credentials.
                </p>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, role, department..."
                    className="pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-full sm:w-64"
                  />
                </div>
              </div>

              {/* Staff Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredStaffUsers.map((user) => {
                  const profile = USER_REWARDS_DATA[user.id];
                  const isPm = user.role === "project_manager";

                  return (
                    <div
                      key={user.id}
                      className="bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 p-3.5 rounded-lg transition-all shadow-2xs flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-[13px] font-bold text-slate-900 truncate">
                              {user.fullName}
                            </h3>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{user.jobTitle}</p>
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isPm
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-[#4ade1d]/15 text-[#4ade1d]"
                              }`}
                            >
                              {isPm ? <Briefcase className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
                              {isPm ? "Project Manager" : "Employer"}
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

                      <Link
                        href={`/rewards/${user.id}`}
                        className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer bg-slate-100 hover:bg-[#0084d4] text-slate-700 hover:text-white group"
                      >
                        <span>View Point Details</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overall Organization Leaderboard */}
            <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
                  Company-Wide Performance Leaderboard
                </h3>
                <p className="text-[12px] text-slate-500">
                  Relative point standings across Project Managers and Employers
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pr-3 w-16">Rank</th>
                      <th className="pb-3 px-3">Team Member</th>
                      <th className="pb-3 px-3">Role</th>
                      <th className="pb-3 px-3">Department</th>
                      <th className="pb-3 pl-3 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {REWARDS_DATA.leaderboard.map((user) => (
                      <tr
                        key={user.rank}
                        onClick={() => {
                          const matched = staffUsers.find((u) => u.fullName === user.name);
                          if (matched) router.push(`/rewards/${matched.id}`);
                        }}
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
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <span className="font-semibold text-slate-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              user.role === "Project Manager"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-[#4ade1d]/15 text-[#4ade1d]"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[12px] text-slate-500">
                          {staffUsers.find((u) => u.fullName === user.name)?.department || "Engineering"}
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
          </>
        ) : (
          <>
            {/* Standard Non-CEO Personal Rewards View */}
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
                    <span>View My Points History (Separate Page)</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center gap-2 text-[#de2d1d] font-semibold text-[13px]">
                  <Heart className="w-4 h-4 fill-[#de2d1d] stroke-[#de2d1d]" />
                  <span>Executive Peer Appreciation</span>
                </div>

                <p className="text-[13px] text-slate-600 font-normal italic my-3 leading-relaxed">
                  {myRewards.appreciation.quote}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>— {myRewards.appreciation.author}</span>
                  <span>{myRewards.appreciation.date}</span>
                </div>
              </div>
            </div>

            {/* Employer Dedicated History Banner (Separate Page Link) */}
            {!isPm && (
              <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50/60 border border-sky-200/80 rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#0084d4]/10 text-[#0084d4] text-[11px] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dedicated Rewards Record</span>
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900">
                    Personal Reward Points History &amp; Milestone Ledger
                  </h3>
                  <p className="text-[12px] text-slate-600 max-w-xl">
                    Your complete, transparent chronological ledger of points gained, milestones delivered, accreditation standings, and performance evaluations is available on your dedicated reward history page.
                  </p>
                </div>

                <Link
                  href={`/rewards/${currentUser.id}`}
                  className="px-4 py-2.5 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto group"
                >
                  <span>Open My Reward Points History Page</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}

            {/* Project Manager: Employers Under My Management Rewards Roster */}
            {isPm && (
              <div className="space-y-4">
                <InPageSubTabs<"all" | "leads">
                  activeTab={pmRewardFilter}
                  onChange={(filter) => setPmRewardFilter(filter)}
                  tabs={[
                    {
                      id: "all",
                      label: "All Employers Under Me",
                      icon: <Users className="w-4 h-4" />,
                      count: employersUnderPm.length,
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
                        <span>Team Rewards Oversight &bull; Employers Under My Management ({displayedEmployersUnderPm.length})</span>
                      </h3>
                      <p className="text-[12px] text-slate-500">
                        Performance standings and point balances for employers assigned to initiatives under your management
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search employers under you..."
                        className="pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-full sm:w-60"
                      />
                    </div>
                  </div>

                  {displayedEmployersUnderPm.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-[13px]">
                      No employers under your management match this criteria.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {displayedEmployersUnderPm.map((emp) => {
                        const profile = USER_REWARDS_DATA[emp.id];
                        const empLeadProjects = myManagedProjects.filter((p) => p.teamLeadId === emp.id);

                        return (
                          <div
                            key={emp.id}
                            className="bg-white border border-slate-200/90 hover:border-[#0084d4] p-4 rounded-lg transition-all shadow-2xs flex flex-col justify-between space-y-3 group"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={emp.avatar}
                                alt={emp.fullName}
                                className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 group-hover:border-[#0084d4] transition-colors"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-[#0084d4] transition-colors">
                                  {emp.id === currentUser.id ? `${emp.fullName} (You)` : emp.fullName}
                                </h4>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">{emp.jobTitle}</p>
                                <p className="text-[10px] text-slate-400 truncate">{emp.department}</p>
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

                            <Link
                              href={`/rewards/${emp.id}`}
                              className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-[#0084d4] text-slate-700 hover:text-white group/btn shadow-2xs"
                            >
                              <span>View Point Details</span>
                              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Badges & Leaderboard Grid */}
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
                  {isPm ? "Team Leaderboard (My Portfolio Standings)" : "Monthly Leaderboard"}
                </h2>

                <div className="space-y-1.5">
                  {visibleMonthlyLeaderboard.map((user) => {
                    const matched = users.find((u) => u.fullName === user.name);
                    const isClickable =
                      isCeo ||
                      (isPm && (user.name === currentUser.fullName || (matched && myEmployerIds.has(matched.id)))) ||
                      (!isPm && user.name === currentUser.fullName);

                    return (
                      <div
                        key={user.name}
                        onClick={() => {
                          if (!isClickable) return;
                          if (matched) {
                            router.push(`/rewards/${matched.id}`);
                          }
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${
                          isClickable ? "cursor-pointer" : ""
                        } ${
                          user.isCurrentUser || matched?.id === currentUser.id
                            ? "bg-[#0084d4] text-white font-medium shadow-2xs"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`text-[12px] font-medium w-4 text-center shrink-0 ${
                              user.isCurrentUser || matched?.id === currentUser.id ? "text-white" : "text-slate-400"
                            }`}
                          >
                            {user.rank}
                          </span>
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-white/40">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="truncate text-[13px]">
                            {matched?.id === currentUser.id ? `${user.name} (You)` : user.name}
                          </span>
                        </div>
                        <span
                          className={`text-[12px] font-semibold shrink-0 ${
                            user.isCurrentUser || matched?.id === currentUser.id ? "text-white" : "text-slate-900"
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
    </div>
  );
}
