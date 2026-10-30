"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Crown,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck,
  ShieldAlert
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import CheckInStatusBar from "@/components/CheckInStatusBar";
import RewardLeaderboardWidget from "@/components/RewardLeaderboardWidget";

export default function EmployerDashboard() {
  const { currentUser, users, projects, tasks, isUserTeamLead } = useTeamFlow();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const myProjects = projects.filter(
    (p) => p.teamMemberIds.includes(currentUser.id) || p.teamLeadId === currentUser.id
  );

  const teamLeadProjects = projects.filter((p) => p.teamLeadId === currentUser.id);

  const myAssignedTasks = tasks.filter((t) => t.assignedTo === currentUser.id);
  const myInProgressTasks = myAssignedTasks.filter((t) => t.status === "In Progress");
  const myReviewTasks = myAssignedTasks.filter((t) => t.status === "Review");
  const myCompletedTasks = myAssignedTasks.filter((t) => t.status === "Completed");

  return (
    <div className="px-7 py-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="flex flex-col justify-between gap-4 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-lg p-5 shadow-md border border-slate-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[11px] font-semibold border border-white/20">
              <UserCheck className="w-3 h-3 text-[#4ade1d]" />
              <span>Employer Workspace</span>
            </div>
            <h2 className="text-[19px] font-bold tracking-tight">
              Welcome back, {currentUser.name}
            </h2>
            <p className="text-[13px] text-slate-300">
              You are active on {myProjects.length} projects. You are the designated Team Lead on {teamLeadProjects.length} {teamLeadProjects.length === 1 ? "project" : "projects"}. Click any project to access tasks, deadlines, and deliverables.
            </p>
          </div>
        </div>
          <CheckInStatusBar />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>My Assigned Tasks</span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-[#0084d4] flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {myAssignedTasks.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Assigned directly to you
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>In Progress Work</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {myInProgressTasks.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Currently actively working
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
            {myCompletedTasks.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {myReviewTasks.length} pending review
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Team Lead Projects</span>
            <div className="w-7 h-7 rounded-md bg-[#ffa500]/15 text-[#ffa500] flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-[#ffa500] leading-none">
            {teamLeadProjects.length}
          </div>
          <div className="mt-2 text-[11px] text-[#ffa500] font-medium">
            Leading the projects
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
              My Assigned Projects
            </h2>
            <p className="text-[12px] text-slate-500">
              Click any project to view tasks, deliverables, and upcoming deadlines.
            </p>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#0084d4] hover:text-[#0277bd] bg-sky-50/70 hover:bg-sky-100/70 border border-sky-200/60 transition-colors self-start sm:self-auto shrink-0 group cursor-pointer shadow-2xs"
          >
            <span>View All ({myProjects.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {myProjects.length === 0 ? (
          <div className="py-10 text-center bg-white rounded-lg border border-slate-200/90 p-6 text-slate-400 text-[13px]">
            No projects currently assigned to you.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myProjects.slice(0, 2).map((project) => {
            const isLead = project.teamLeadId === currentUser.id;
            const pm = users.find((u) => u.id === project.projectManagerId);
            const lead = users.find((u) => u.id === project.teamLeadId);
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const myTasksInProj = projectTasks.filter((t) => t.assignedTo === currentUser.id);
            const doneTasks = projectTasks.filter((t) => t.status === "Completed").length;
            const percent = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`bg-white border rounded-lg p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4 ${
                  isLead
                    ? "border-[#ffa500]/50 ring-1 ring-[#ffa500]/30 hover:border-[#ffa500]"
                    : "border-slate-200/90 hover:border-[#0084d4]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                        {project.code}
                      </span>
                      <StatusBadge status={project.status} />
                      <PriorityBadge priority={project.priority} />
                    </div>

                    {isLead ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#ffa500]/15 text-[#ffa500] border border-[#ffa500]/30 shadow-2xs">
                        <Crown className="w-3.5 h-3.5 text-[#ffa500]" />
                        <span>Team Lead</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Team Member</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-[#0084d4] transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-[12px] text-slate-500 font-normal line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-[#ffa500]" />
                      <span>Team Lead: <strong className="text-slate-900">{lead?.fullName}</strong></span>
                    </span>
                    <span className="text-slate-500 font-medium">PM: {pm?.fullName}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[11px] text-slate-600 font-semibold">
                      {isLead
                        ? `Project Tasks: ${projectTasks.length} total`
                        : `My Tasks: ${myTasksInProj.length} assigned to me`}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Deadline: <strong className="text-slate-800">{project.deadline}</strong>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                      <span className="text-slate-500">Overall Progress</span>
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

      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
              My Assigned Work &amp; Deadlines
            </h2>
            <p className="text-[12px] text-slate-500">
              Tasks assigned directly to you across all your projects
            </p>
          </div>
          <span className="text-[12px] font-semibold text-[#0084d4] bg-sky-50 px-2.5 py-1 rounded-lg">
            {myAssignedTasks.length} Assigned
          </span>
        </div>

        {myAssignedTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-[13px]">
            No tasks assigned directly to you at the moment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myAssignedTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedProjectId(task.projectId)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded">
                        {project?.code || "PROJ"}
                      </span>
                      <span className="text-[11px] text-slate-400">{project?.name}</span>
                    </div>
                    <h4 className="text-[13px] font-semibold text-slate-900 group-hover:text-[#0084d4] transition-colors leading-tight">
                      {task.title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-[72px_116px_98px_20px] items-center gap-3 sm:gap-4 shrink-0 text-left">
                    <div className="flex items-center justify-start">
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      Due: {task.deadline}
                    </span>
                    <div className="flex items-center justify-start">
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="flex items-center justify-end">
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0084d4] transition-colors" />
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
    </div>
  );
}
