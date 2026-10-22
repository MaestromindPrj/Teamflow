"use client";

import { useState } from "react";
import {
  FolderKanban,
  Plus,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Clock,
  Shield,
  Search,
  Crown
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import NewProjectModal from "@/components/NewProjectModal";
import CheckInStatusBar from "@/components/CheckInStatusBar";
import RewardLeaderboardWidget from "@/components/RewardLeaderboardWidget";

export default function ProjectManagerDashboard() {
  const { currentUser, users, projects, tasks } = useTeamFlow();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const myProjects = projects.filter((p) => p.projectManagerId === currentUser.id);

  const myProjectIds = myProjects.map((p) => p.id);
  const myTasks = tasks.filter((t) => myProjectIds.includes(t.projectId));
  const completedTasks = myTasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = myTasks.filter((t) => t.status === "In Progress").length;
  const reviewTasks = myTasks.filter((t) => t.status === "Review").length;

  const allTeamMemberIds = Array.from(new Set(myProjects.flatMap((p) => p.teamMemberIds)));
  const teamMembers = users.filter((u) => allTeamMemberIds.includes(u.id));

  const filteredProjects = myProjects.filter((p) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    const lead = users.find((u) => u.id === p.teamLeadId);
    return (
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      lead?.fullName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="px-7 py-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        

        <div className="flex flex-col justify-between gap-4 bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-lg p-5 shadow-md">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-200 text-[11px] font-semibold border border-blue-400/30">
                <Shield className="w-3 h-3" />
                <span>Project Management Oversight</span>
              </div>

              <button
                onClick={() => setIsNewProjectOpen(true)}
                className="px-4.5 py-2.5 bg-white text-blue-950 hover:bg-blue-50 text-[13px] font-bold rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add New Project</span>
              </button>
            </div>
            <h2 className="text-[19px] font-bold tracking-tight">
              Managing Portfolio &bull; {currentUser.fullName}
            </h2>
            <p className="text-[13px] text-blue-200/80">
              You are managing {myProjects.length} active initiatives. Create new projects, assign team leads, and manage task pipelines directly within each project view.
            </p>
          </div>
        </div>
        <CheckInStatusBar />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Projects Under Me</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {myProjects.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Active managed initiatives
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Team Members</span>
            <div className="w-7 h-7 rounded-md bg-[#4ade1d]/15 text-[#4ade1d] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {teamMembers.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Across your project teams
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Tasks In Progress</span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-[#0084d4] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {inProgressTasks}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {reviewTasks} pending review
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Completed Tasks</span>
            <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {completedTasks}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Out of {myTasks.length} total tasks
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
              Projects Under My Management
            </h2>
            <p className="text-[12px] text-slate-500">
              Click any project to view &amp; manage its task board, assign deliverables, and coordinate with the team lead
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search your projects..."
              className="pl-8 pr-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-56"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-lg bg-white p-6">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-[15px] font-bold text-slate-800">No Projects Found</h3>
            <p className="text-[12px] text-slate-400 mt-1 max-w-sm mx-auto">
              You do not have any projects matching your search criteria. Click below to add a new project and designate a team lead.
            </p>
            <button
              onClick={() => setIsNewProjectOpen(true)}
              className="mt-4 px-4 py-2 bg-[#0084d4] hover:bg-[#0277bd] text-white rounded-lg text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredProjects.map((project) => {
              const lead = users.find((u) => u.id === project.teamLeadId);
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              const doneTasks = projectTasks.filter((t) => t.status === "Completed").length;
              const percent = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
              const members = users.filter((u) => project.teamMemberIds.includes(u.id));

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className="bg-white border border-slate-200/90 hover:border-[#0084d4] rounded-lg p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                          {project.code}
                        </span>
                        <StatusBadge status={project.status} />
                        <PriorityBadge priority={project.priority} />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0084d4] transition-colors" />
                    </div>

                    <div>
                      <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-[#0084d4] transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-[12px] text-slate-500 font-normal line-clamp-2 mt-1">
                        {project.description}
                      </p>
                    </div>

                    {lead && (
                      <div className="p-2.5 rounded-lg bg-[#ffa500]/15 border border-[#ffa500]/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={lead.avatar}
                            alt={lead.fullName}
                            className="w-6 h-6 rounded-full object-cover border border-[#ffa500]"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-[#ffa500] uppercase tracking-wider flex items-center gap-1">
                              <Crown className="w-3 h-3 text-[#ffa500]" />
                              <span>Designated Team Lead</span>
                            </span>
                            <span className="text-[12px] font-bold text-slate-900">
                              {lead.id === currentUser.id ? "(You)" : lead.fullName}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center -space-x-1.5">
                          {members.slice(0, 3).map((m) => (
                            <img
                              key={m.id}
                              src={m.avatar}
                              alt={m.name}
                              title={m.fullName}
                              className="w-6 h-6 rounded-full border-2 border-white object-cover"
                            />
                          ))}
                          {members.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-[9px] font-bold flex items-center justify-center text-slate-600">
                              +{members.length - 3}
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

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                        <span className="text-slate-500">Tasks Progress ({doneTasks}/{projectTasks.length})</span>
                        <span className="text-[#0084d4]">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0084d4] h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RewardLeaderboardWidget />

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
