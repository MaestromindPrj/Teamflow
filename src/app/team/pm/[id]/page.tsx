"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  FolderKanban,
  ArrowUpRight,
  Crown,
  Briefcase,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles
} from "lucide-react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import InPageSubTabs from "@/components/InPageSubTabs";

function ProjectManagerDetailContent() {
  const params = useParams();
  const pmId = params?.id as string;

  const { users, projects, tasks, currentUser } = useTeamFlow();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [pmDetailTab, setPmDetailTab] = useState<"projects" | "workforce" | "tasks">("projects");

  const pm = users.find((u) => u.id === pmId && u.role === "project_manager") ||
    users.find((u) => u.role === "project_manager");

  if (!pm) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header title="Project Manager Details" subtitle="Executive portfolio and team roster" />
        <div className="px-7 py-6 space-y-4">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-[13px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Team Directory</span>
          </Link>
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-600 font-semibold text-[15px]">Project Manager not found</p>
            <Link
              href="/team"
              className="mt-3 inline-block px-4 py-2 bg-[#0084d4] text-white rounded-lg text-[13px] font-semibold"
            >
              Return to Team Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser.role === "project_manager" && pm.id !== currentUser.id) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header title="Project Manager Oversight" subtitle="Executive portfolio and team roster" />
        <div className="px-7 py-6 space-y-4">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-[13px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Team Directory</span>
          </Link>
          <div className="bg-white rounded-lg border border-slate-200/90 p-8 text-center max-w-md mx-auto shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-slate-800 font-bold text-[15px]">Access Restricted</h3>
            <p className="text-slate-500 text-[12px]">
              As a Project Manager, you can only view initiatives and teams under your own management. You cannot inspect other Project Managers&apos; portfolios.
            </p>
            <Link
              href={`/team/pm/${currentUser.id}`}
              className="mt-2 inline-block px-4 py-2 bg-[#0084d4] hover:bg-[#0277bd] text-white rounded-lg text-[12px] font-semibold transition-colors shadow-xs"
            >
              View My Managed Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser.role === "employer") {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header title="Team Directory" subtitle="Directory access restricted" />
        <div className="px-7 py-12 text-center">
          <div className="bg-white rounded-lg border border-slate-200/90 p-8 max-w-md mx-auto shadow-2xs space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">Restricted Access</h3>
              <p className="text-[12px] text-slate-500 mt-1">
                Employers manage their daily workflow from their personal dashboard.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-[#0084d4] text-white text-[12px] font-semibold rounded-lg"
            >
              Return to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pmProjects = projects.filter((p) => p.projectManagerId === pm.id);
  const pmTasks = tasks.filter((t) => pmProjects.some((p) => p.id === t.projectId));
  const pmCompletedTasks = pmTasks.filter((t) => t.status === "Completed").length;
  const pmProgress = pmTasks.length > 0 ? Math.round((pmCompletedTasks / pmTasks.length) * 100) : 0;
  const pmTeamMemberIds = Array.from(new Set(pmProjects.flatMap((p) => p.teamMemberIds)));
  const pmTeamMembers = users.filter((u) => pmTeamMemberIds.includes(u.id));

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title={`${pm.fullName} • Projects & Team Management`}
        subtitle={`Executive portfolio overview of all projects under ${pm.fullName}, designated project leads, and team rosters`}
      />

      <div className="px-7 py-6 space-y-6">
        <div>
          <Link
            href="/team?tab=project_managers"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-[12px] font-semibold shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to Project Managers Directory</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 bg-slate-50/70 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src={pm.avatar}
                alt={pm.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-400 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[20px] font-bold text-slate-900">
                    {pm.fullName}
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    Project Manager
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ID: {pm.employeeId}
                  </span>
                </div>
                <p className="text-[13px] text-slate-600 font-medium mt-0.5">
                  {pm.jobTitle} &bull; {pm.department}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {pm.email} &bull; {pm.phone} &bull; {pm.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-2xs text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Managed Portfolio
                </span>
                <span className="text-[16px] font-extrabold text-purple-700">
                  {pmProjects.length} Projects &bull; {pmTasks.length} Tasks
                </span>
              </div>

              <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-2xs text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Assigned Workforce
                </span>
                <span className="text-[16px] font-extrabold text-slate-900">
                  {pmTeamMembers.length} Members
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Projects</span>
              <span className="text-[15px] font-bold text-slate-800">{pmProjects.length} Initiatives</span>
            </div>
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Execution Progress</span>
              <span className="text-[15px] font-bold text-[#0084d4]">{pmProgress}% Completed</span>
            </div>
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed Tasks</span>
              <span className="text-[15px] font-bold text-[#4ade1d]">{pmCompletedTasks}/{pmTasks.length} Done</span>
            </div>
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery Health</span>
              <span className="text-[15px] font-bold text-[#4ade1d]">On Track</span>
            </div>
          </div>
        </div>

        <InPageSubTabs<"projects" | "workforce" | "tasks">
          activeTab={pmDetailTab}
          onChange={(tab) => setPmDetailTab(tab)}
          tabs={[
            {
              id: "projects",
              label: "Managed Projects",
              icon: <FolderKanban className="w-4 h-4" />,
              count: pmProjects.length,
            },
            {
              id: "workforce",
              label: "Assigned Workforce",
              icon: <Users className="w-4 h-4" />,
              count: pmTeamMembers.length,
            },
            {
              id: "tasks",
              label: "Task Pipeline",
              icon: <CheckCircle2 className="w-4 h-4" />,
              count: pmTasks.length,
            },
          ]}
        />

        {pmDetailTab === "projects" && (
          <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-5">
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#0084d4]" />
                <span>Projects Under {pm.fullName} ({pmProjects.length})</span>
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Complete breakdown of each initiative under this manager: designated team leads, workforce rosters, task allocations, and progress
              </p>
            </div>

            {pmProjects.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg p-6">
                <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-[14px] font-semibold text-slate-800">No projects currently under this manager</p>
                <p className="text-[12px] text-slate-400 mt-1">Assign a new project to {pm.fullName}.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pmProjects.map((project) => {
                  const lead = users.find((u) => u.id === project.teamLeadId);
                  const members = users.filter((u) => project.teamMemberIds.includes(u.id));
                  const projectTasks = tasks.filter((t) => t.projectId === project.id);
                  const doneTasks = projectTasks.filter((t) => t.status === "Completed").length;
                  const percent = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

                  return (
                    <div
                      key={project.id}
                      className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs hover:border-[#0084d4] transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {project.code}
                            </span>
                            <h4
                              onClick={() => setSelectedProjectId(project.id)}
                              className="text-[16px] font-bold text-slate-900 hover:text-[#0084d4] cursor-pointer transition-colors"
                            >
                              {project.name}
                            </h4>
                            <StatusBadge status={project.status} />
                            <PriorityBadge priority={project.priority} />
                            <span className="text-[11px] text-slate-400 font-medium">
                              {project.category}
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-500 max-w-3xl leading-relaxed">
                            {project.description}
                          </p>
                        </div>

                        <button
                          onClick={() => setSelectedProjectId(project.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                        >
                          <span>Inspect Project Board</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-lg border border-slate-200/80">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Who is leading that project:
                          </span>
                          {lead ? (
                            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                              <img
                                src={lead.avatar}
                                alt={lead.fullName}
                                className="w-10 h-10 rounded-full object-cover border border-[#ffa500] shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Crown className="w-3.5 h-3.5 text-[#ffa500]" />
                                  <p className="text-[13px] font-bold text-slate-900 truncate">
                                    {lead.id === currentUser.id ? "(You)" : lead.fullName}
                                  </p>
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#ffa500]/15 text-[#ffa500] border border-[#ffa500]/30">
                                    Team Lead
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {lead.jobTitle} &bull; {lead.department}
                                </p>
                                <p className="text-[10px] text-slate-400">{lead.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[12px] text-slate-400 italic">No designated lead</span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Who are under that project ({members.length} team members):
                          </span>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {members.map((member) => {
                              const memberTasksCount = projectTasks.filter(
                                (t) => t.assignedTo === member.id
                              ).length;

                              return (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <img
                                      src={member.avatar}
                                      alt={member.fullName}
                                      className="w-6 h-6 rounded-full object-cover shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-[12px] font-semibold text-slate-900 truncate leading-tight">
                                        {member.fullName}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {member.jobTitle}
                                      </p>
                                    </div>
                                  </div>

                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                    {memberTasksCount} {memberTasksCount === 1 ? "task" : "tasks"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <div className="flex items-center gap-2">
                          <span>Deadline: <strong className="text-slate-800">{project.deadline}</strong></span>
                          <span>&bull;</span>
                          <span>Budget: <strong className="text-slate-800">{project.budget || "$50,000"}</strong></span>
                          <span>&bull;</span>
                          <span>Tasks: <strong className="text-slate-800">{doneTasks}/{projectTasks.length} Completed</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#0084d4] h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 w-8 text-right">
                            {percent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {pmDetailTab === "workforce" && (
          <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0084d4]" />
                <span>Assigned Workforce Roster ({pmTeamMembers.length})</span>
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Staff members working across projects managed by {pm.fullName}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {pmTeamMembers.map((member) => {
                const memberProjects = pmProjects.filter((p) => p.teamMemberIds.includes(member.id));
                const isLeadOn = pmProjects.filter((p) => p.teamLeadId === member.id);
                const memberTasks = pmTasks.filter((t) => t.assignedTo === member.id);
                const completedTasks = memberTasks.filter((t) => t.status === "Completed").length;

                return (
                  <div
                    key={member.id}
                    className="bg-white border border-slate-200/90 p-4 rounded-lg shadow-2xs hover:border-[#0084d4] transition-all space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={member.avatar}
                        alt={member.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-bold text-slate-900 truncate">
                          {member.id === currentUser.id ? `${member.fullName} (You)` : member.fullName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{member.jobTitle}</p>
                        <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Assigned Projects</span>
                        <span className="font-bold text-slate-800">{memberProjects.length} initiatives</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Tasks Completed</span>
                        <span className="font-bold text-[#4ade1d]">{completedTasks}/{memberTasks.length} done</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pmDetailTab === "tasks" && (
          <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0084d4]" />
                <span>Task Pipeline Across Managed Initiatives ({pmTasks.length})</span>
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                All deliverable tasks, status states, and assigned workforce members
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pr-3">Task Details</th>
                    <th className="pb-3 px-3">Project</th>
                    <th className="pb-3 px-3">Assignee</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Priority</th>
                    <th className="pb-3 pl-3 text-right">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {pmTasks.map((t) => {
                    const assignee = users.find((u) => u.id === t.assignedTo);
                    const proj = pmProjects.find((p) => p.id === t.projectId);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pr-3 font-semibold text-slate-900">{t.title}</td>
                        <td className="py-3 px-3 text-[12px] text-slate-600 font-medium">{proj?.name}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {assignee && (
                              <img src={assignee.avatar} alt={assignee.fullName} className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <span className="text-[12px] text-slate-700">{assignee?.fullName || "Unassigned"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3"><StatusBadge status={t.status} /></td>
                        <td className="py-3 px-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="py-3 pl-3 text-right text-[12px] text-slate-500">{t.deadline}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  );
}

export default function ProjectManagerDetailPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-7 text-slate-400">Loading project manager portfolio...</div>}>
      <ProjectManagerDetailContent />
    </Suspense>
  );
}
