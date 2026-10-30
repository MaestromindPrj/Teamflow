"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Shield,
  Crown,
  Briefcase,
  Mail,
  Phone,
  ArrowUpRight,
  ArrowRight,
  FolderKanban,
  UserCheck,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  UserPlus
} from "lucide-react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import CreateMemberModal from "@/components/CreateMemberModal";
import InPageSubTabs from "@/components/InPageSubTabs";

function TeamDirectoryContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { users, projects, tasks, currentUser } = useTeamFlow();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"project_managers" | "employers">("project_managers");

  const [pmSearch, setPmSearch] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const isPm = currentUser.role === "project_manager";
  const isCeo = currentUser.role === "ceo";

  const myManagedProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const myEmployerIds = new Set(
    myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
  );

  const projectManagers = users.filter((u) => u.role === "project_manager");
  const employers = isPm
    ? users.filter((u) => u.role === "employer" && myEmployerIds.has(u.id))
    : users.filter((u) => u.role === "employer");

  useEffect(() => {
    if (isPm) {
      setActiveTab("employers");
    } else if (tabParam === "employers" || tabParam === "project_managers") {
      setActiveTab(tabParam);
    }
  }, [tabParam, isPm]);

  if (currentUser.role === "employer") {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header
          title="Team Directory"
          subtitle="Directory access restricted"
        />
        <div className="px-7 py-12 text-center">
          <div className="bg-white rounded-lg border border-slate-200/90 p-8 max-w-md mx-auto shadow-2xs space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">Restricted Access</h3>
              <p className="text-[12px] text-slate-500 mt-1">
                The Team Directory is reserved for Project Managers and Executive Leadership. Employers manage their daily workflow from their personal dashboard.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold rounded-lg transition-colors shadow-xs"
            >
              Return to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: "project_managers" | "employers") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const filteredPMs = projectManagers.filter((pm) => {
    if (!pmSearch.trim()) return true;
    const q = pmSearch.toLowerCase();
    return (
      pm.fullName.toLowerCase().includes(q) ||
      pm.jobTitle.toLowerCase().includes(q) ||
      pm.department.toLowerCase().includes(q)
    );
  });

  const [pmEmployerFilter, setPmEmployerFilter] = useState<"all" | "leads">("all");

  const leadsUnderPmCount = employers.filter((e) =>
    myManagedProjects.some((p) => p.teamLeadId === e.id)
  ).length;

  const filteredEmployers = employers
    .filter((emp) => {
      if (isPm && pmEmployerFilter === "leads") {
        return myManagedProjects.some((p) => p.teamLeadId === emp.id);
      }
      return true;
    })
    .filter((emp) => {
      if (!empSearch.trim()) return true;
      const q = empSearch.toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      );
    });

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title={isPm ? "Team Directory • Employers Under My Management" : "Organizational Directory & Portfolios"}
        subtitle={
          isPm
            ? "Inspect employers assigned to your initiatives, appointed team leads, and their current assigned tasks"
            : "Manage project managers, designated project leads, and employers"
        }
      />

      <div className="px-7 py-6 space-y-6">
        {isCeo && (
          <InPageSubTabs<"project_managers" | "employers">
            activeTab={activeTab}
            onChange={(tab) => handleTabChange(tab)}
            tabs={[
              {
                id: "project_managers",
                label: "Project Managers",
                icon: <Shield className="w-4 h-4" />,
                count: projectManagers.length,
              },
              {
                id: "employers",
                label: "Employers",
                icon: <Users className="w-4 h-4" />,
                count: employers.length,
              },
            ]}
          />
        )}

        {isPm && (
          <InPageSubTabs<"all" | "leads">
            activeTab={pmEmployerFilter}
            onChange={(filter) => setPmEmployerFilter(filter)}
            tabs={[
              {
                id: "all",
                label: "All Employers Under Me",
                icon: <Users className="w-4 h-4" />,
                count: employers.length,
              },
              {
                id: "leads",
                label: "Appointed Team Leads",
                icon: <Crown className="w-4 h-4" />,
                count: leadsUnderPmCount,
              },
            ]}
          />
        )}

        {activeTab === "project_managers" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Project Managers Directory</span>
                  </h2>
                  <p className="text-[12px] text-slate-500">
                    Click any Project Manager below to open their dedicated page showing projects under them, appointed leads, and team rosters.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={pmSearch}
                      onChange={(e) => setPmSearch(e.target.value)}
                      placeholder="Search project managers..."
                      className="pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-full sm:w-60"
                    />
                  </div>

                  {isCeo && (
                    <button
                      onClick={() => setIsAddMemberOpen(true)}
                      className="h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Team Member</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPMs.map((pm) => {
                  const pCount = projects.filter((p) => p.projectManagerId === pm.id).length;
                  const tCount = tasks.filter((t) =>
                    projects.some((p) => p.projectManagerId === pm.id && p.id === t.projectId)
                  ).length;

                  return (
                    <Link
                      key={pm.id}
                      href={`/team/pm/${pm.id}`}
                      className="p-4 rounded-lg border border-slate-200/90 hover:border-[#0084d4] bg-white hover:bg-slate-50/50 shadow-2xs transition-all cursor-pointer flex flex-col justify-between space-y-3.5 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={pm.avatar}
                            alt={pm.fullName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shrink-0 group-hover:border-[#0084d4] transition-colors"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-[15px] font-bold text-slate-900 leading-tight group-hover:text-[#0084d4] transition-colors">
                                {pm.fullName}
                              </h3>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                Project Manager
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 group-hover:bg-[#0084d4] text-slate-700 group-hover:text-white transition-colors">
                            <span>View Projects &amp; Team</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{pCount} Projects</span>
                          <span>&bull;</span>
                          <span>{tCount} Tasks</span>
                        </div>
                        <span className="text-slate-400">ID: {pm.employeeId}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "employers" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#4ade1d]" />
                  <span>Employers &amp; Technical Staff Directory</span>
                </h2>
                <p className="text-[12px] text-slate-500">
                  Full organization roster of developers, designers, and QA engineers with their active leads and tasks
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    placeholder="Search employers, roles..."
                    className="pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-full sm:w-60"
                  />
                </div>

                {(isCeo || isPm) && (
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Team Member</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployers.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white rounded-lg border border-slate-200/90 p-8 shadow-2xs">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[14px] font-semibold text-slate-700">No Employers Found</p>
                  <p className="text-[12px] text-slate-400 mt-1">
                    {isPm
                      ? "No employers are currently assigned to projects under your management."
                      : "No employers match your search criteria."}
                  </p>
                </div>
              ) : (
                filteredEmployers.map((emp) => {
                  const relevantProjects = isPm ? myManagedProjects : projects;
                  const leadProjects = relevantProjects.filter((p) => p.teamLeadId === emp.id);
                  const memberProjects = relevantProjects.filter(
                    (p) => p.teamMemberIds.includes(emp.id) && p.teamLeadId !== emp.id
                  );
                  const assignedTasks = tasks.filter(
                    (t) => t.assignedTo === emp.id && relevantProjects.some((p) => p.id === t.projectId)
                  );
                  const inProgressTasks = assignedTasks.filter((t) => t.status === "In Progress");

                return (
                  <div
                    key={emp.id}
                    className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.fullName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[14px] font-bold text-slate-900 truncate">
                              {emp.id === currentUser.id ? `${emp.fullName} (You)` : emp.fullName}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {emp.jobTitle || emp.department}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Total Assigned Tasks:</span>
                          <strong className="text-slate-900">{assignedTasks.length} ({inProgressTasks.length} in progress)</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Total Projects:</span>
                          <strong className="text-slate-900">{leadProjects.length + memberProjects.length} initiatives</strong>
                        </div>
                      </div>

                      {leadProjects.length > 0 && (
                        <div className="text-[11px] space-y-0.5">
                          <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-[#ffa500]" />
                            <span>Team Lead On:</span>
                          </span>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {leadProjects.map((p, idx) => (
                              <span
                                key={p.id}
                                onClick={() => setSelectedProjectId(p.id)}
                                className="text-slate-600 font-medium hover:text-[#0084d4] hover:underline cursor-pointer"
                              >
                                {p.name}{idx < leadProjects.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {memberProjects.length > 0 && (
                        <div className="text-[11px] space-y-0.5">
                          <span className="font-semibold text-slate-500">
                            Team Member On:
                          </span>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {memberProjects.map((p, idx) => (
                              <span
                                key={p.id}
                                onClick={() => setSelectedProjectId(p.id)}
                                className="text-slate-600 font-medium hover:text-[#0084d4] hover:underline cursor-pointer"
                              >
                                {p.name}{idx < memberProjects.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>ID: {emp.employeeId}</span>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        )}
      </div>

      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />

      <CreateMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
      />
    </div>
  );
}

export default function TeamDirectoryPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-7 text-slate-400">Loading directory...</div>}>
      <TeamDirectoryContent />
    </Suspense>
  );
}
