"use client";

import { useState } from "react";
import {
  FolderKanban,
  Search,
  Plus,
  ArrowUpRight,
  Layers,
  Sparkles,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Crown
} from "lucide-react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import NewProjectModal from "@/components/NewProjectModal";
import InPageSubTabs from "@/components/InPageSubTabs";
import UserAvatar from "@/components/UserAvatar";

export default function ProjectsPage() {
  const { users, projects, tasks, currentUser } = useTeamFlow();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("All");

  const isEmployer = currentUser.role === "employer";
  const isPm = currentUser.role === "project_manager";
  const canCreateProject = currentUser.role === "ceo" || isPm;

  const baseProjects = isEmployer
    ? projects.filter((p) => p.teamMemberIds.includes(currentUser.id) || p.teamLeadId === currentUser.id)
    : isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : projects;

  const filteredProjects = baseProjects.filter((p) => {
    if (projectStatusFilter !== "All" && p.status !== projectStatusFilter) return false;
    if (projectSearch.trim()) {
      const q = projectSearch.toLowerCase();
      const pm = users.find((u) => u.id === p.projectManagerId);
      const lead = users.find((u) => u.id === p.teamLeadId);
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        pm?.fullName.toLowerCase().includes(q) ||
        lead?.fullName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title={
          isEmployer
            ? "My Assigned Projects"
            : isPm
            ? "Projects Under My Management"
            : "Company Projects"
        }
        subtitle={
          isEmployer
            ? "View initiatives assigned to you, appointed team leads, milestones, and deliverables"
            : isPm
            ? "Manage and track initiatives under your management, appointed team leads, and execution milestones"
            : "Manage and track company projects, appointed leads, execution teams, and delivery milestones"
        }
      />

      <div className="px-7 py-6 space-y-6">
        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#0084d4]" />
                <span>
                  {isEmployer
                    ? "My Assigned Projects"
                    : isPm
                    ? "Managed Projects Portfolio"
                    : "Company Projects Portfolio"}{" "}
                  ({baseProjects.length})
                </span>
              </h2>
              <p className="text-[12px] text-slate-500">
                {isEmployer
                  ? "Initiatives where you are allocated as a team member or team lead."
                  : isPm
                  ? "Initiatives under your direct management, designated leads, and execution teams."
                  : "Detailed portfolio of all company projects, assigned project managers, designated team leads, and workforce allocations."}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search projects, PMs, leads..."
                  className="pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-full sm:w-60"
                />
              </div>

              {canCreateProject && (
                <button
                  onClick={() => setIsNewProjectOpen(true)}
                  className="h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Project</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <InPageSubTabs
          activeTab={projectStatusFilter}
          onChange={(status) => setProjectStatusFilter(status)}
          tabs={[
            {
              id: "All",
              label: "All Projects",
              icon: <FolderKanban className="w-4 h-4" />,
              count: baseProjects.length,
            },
            {
              id: "In Progress",
              label: "In Progress",
              icon: <Clock className="w-4 h-4" />,
              count: baseProjects.filter((p) => p.status === "In Progress").length,
            },
            {
              id: "Planning",
              label: "Planning",
              icon: <Layers className="w-4 h-4" />,
              count: baseProjects.filter((p) => p.status === "Planning").length,
            },
            {
              id: "In Review",
              label: "In Review",
              icon: <Sparkles className="w-4 h-4" />,
              count: baseProjects.filter((p) => p.status === "In Review").length,
            },
            {
              id: "Completed",
              label: "Completed",
              icon: <CheckCircle2 className="w-4 h-4" />,
              count: baseProjects.filter((p) => p.status === "Completed").length,
            },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const pm = users.find((u) => u.id === project.projectManagerId);
            const lead = users.find((u) => u.id === project.teamLeadId);
            const members = users.filter((u) => project.teamMemberIds.includes(u.id));
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const doneTasks = projectTasks.filter((t) => t.status === "Completed").length;
            const percent = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="bg-white border border-slate-200/90 hover:border-[#0084d4] rounded-lg p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                        {project.code}
                      </span>
                      <StatusBadge status={project.status} />
                      <PriorityBadge priority={project.priority} />
                      <span className="text-[11px] text-slate-400 font-medium">
                        {project.category}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0084d4] transition-colors shrink-0" />
                  </div>

                  <div>
                    <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-[#0084d4] transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-[12px] text-slate-500 font-normal line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-[11px]">
                    {pm && (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <UserAvatar src={pm.avatar} name={pm.name} role={pm.role} className="w-6 h-6 rounded-full" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Managing PM</span>
                          <span className="font-semibold text-slate-800 truncate block">{pm.fullName}</span>
                        </div>
                      </div>
                    )}

                    {lead && (
                      <div className="flex items-center gap-2 bg-[#ffa500]/15 p-2 rounded-lg border border-[#ffa500]/30">
                        <UserAvatar src={lead.avatar} name={lead.name} role={lead.role} className="w-6 h-6 rounded-full border border-[#ffa500]" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-[#ffa500] uppercase flex items-center gap-1">
                            <Crown className="w-3 h-3 text-[#ffa500]" />
                            <span>Team Lead</span>
                          </span>
                          <span className="font-semibold text-slate-900 truncate block">
                            {lead.id === currentUser.id ? "(You)" : lead.fullName}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1.5">
                        {members.slice(0, 4).map((m) => (
                          <UserAvatar
                            key={m.id}
                            src={m.avatar}
                            name={m.name}
                            role={m.role}
                            title={m.fullName}
                            className="w-6 h-6 rounded-full border-2 border-white"
                          />
                        ))}
                        {members.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-[9px] font-bold flex items-center justify-center text-slate-600">
                            +{members.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {members.length} team members
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      Due: <strong className="text-slate-800">{project.deadline}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                    <span className="text-slate-500">Progress ({doneTasks}/{projectTasks.length} tasks)</span>
                    <span className="text-[#0084d4]">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0084d4] h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreated={(id) => setSelectedProjectId(id)}
      />
    </div>
  );
}
