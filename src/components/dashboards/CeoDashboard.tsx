"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Calendar,
  Shield,
  Layers,
  ArrowUpRight,
  ArrowRight,
  TrendingUp,
  Clock,
  Search,
  Filter,
  Plus,
  Briefcase,
  UserCheck,
  ChevronRight,
  Crown
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import NewProjectModal from "@/components/NewProjectModal";
import RewardLeaderboardWidget from "@/components/RewardLeaderboardWidget";

export default function CeoDashboard() {
  const { users, projects, tasks, attendance, currentUser } = useTeamFlow();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  const projectManagers = users.filter((u) => u.role === "project_manager");
  const employers = users.filter((u) => u.role === "employer");

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "In Progress" || p.status === "Planning").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayAttendance = attendance;
  const presentCount = todayAttendance.filter((a) => a.status === "Present" || a.status === "Remote").length;
  const attendanceRate = todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 100;

  return (
    <div className="px-7 py-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Total Projects</span>
            <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {totalProjects}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <span className="text-[#4ade1d] font-semibold">{activeProjects} active</span>
            <span>&bull;</span>
            <span>{totalProjects - activeProjects} closed/review</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Total Workforce</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {users.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {projectManagers.length} PMs &bull; {employers.length} Employers
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Company Attendance</span>
            <div className="w-7 h-7 rounded-md bg-[#4ade1d]/15 text-[#4ade1d] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {attendanceRate}%
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {presentCount} checked in today
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Management &amp; PMs</span>
            <div className="w-7 h-7 rounded-md bg-[#ffa500]/15 text-[#ffa500] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {projectManagers.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Overseeing {projects.length} initiatives
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <span>Work Completion</span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-[#0084d4] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
            {overallProgress}%
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {completedTasks}/{totalTasks} total tasks done
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
              Project Managers, Portfolios &amp; Assigned Teams
            </h2>
            <p className="text-[12px] text-slate-500">
              Clear hierarchy: inspect each Project Manager, what projects are below him, who is leading each team, and what team executes the work.
            </p>
          </div>
          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        <div className="space-y-6">
          {projectManagers.map((pm) => {
            const pmProjects = projects.filter((p) => p.projectManagerId === pm.id);
            const pmTasks = tasks.filter((t) => pmProjects.some((p) => p.id === t.projectId));
            const pmCompletedTasks = pmTasks.filter((t) => t.status === "Completed").length;
            const pmProgress = pmTasks.length > 0 ? Math.round((pmCompletedTasks / pmTasks.length) * 100) : 0;

            return (
              <div
                key={pm.id}
                className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/70">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={pm.avatar}
                      alt={pm.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-300 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-bold text-slate-900">
                          {pm.fullName}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          Project Manager
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          ID: {pm.employeeId}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 font-medium">
                        {pm.jobTitle} &bull; {pm.department}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {pm.email} &bull; {pm.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-right shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Managed Portfolio
                      </span>
                      <span className="text-[14px] font-bold text-purple-700">
                        {pmProjects.length} Projects &bull; {pmTasks.length} Tasks
                      </span>
                    </div>

                    <div className="bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-right shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Completion Rate
                      </span>
                      <span className="text-[14px] font-bold text-slate-900">
                        {pmProgress}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Projects Below {pm.fullName} ({pmProjects.length}):
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {pmProjects.map((proj) => {
                      const lead = users.find((u) => u.id === proj.teamLeadId);
                      const members = users.filter((u) => proj.teamMemberIds.includes(u.id));
                      const pTasks = tasks.filter((t) => t.projectId === proj.id);
                      const pDone = pTasks.filter((t) => t.status === "Completed").length;
                      const pPercent = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

                      return (
                        <div
                          key={proj.id}
                          onClick={() => setSelectedProjectId(proj.id)}
                          className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs hover:border-[#0084d4] transition-all space-y-3 cursor-pointer group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {proj.code}
                              </span>
                              <h4
                                className="text-[14px] font-bold text-slate-900 group-hover:text-[#0084d4] transition-colors"
                              >
                                {proj.name}
                              </h4>
                              <StatusBadge status={proj.status} />
                              <PriorityBadge priority={proj.priority} />
                            </div>
                            <p className="text-[12px] text-slate-500 max-w-2xl line-clamp-2">
                              {proj.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 bg-slate-50/60 p-3 rounded-lg">
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Who is leading that team:
                              </span>
                              {lead ? (
                                <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                                  <img
                                    src={lead.avatar}
                                    alt={lead.fullName}
                                    className="w-8 h-8 rounded-full object-cover border border-[#ffa500] shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <Crown className="w-3.5 h-3.5 text-[#ffa500]" />
                                      <p className="text-[12px] font-bold text-slate-900 truncate">
                                        {lead.id === currentUser.id ? "(You)" : lead.fullName}
                                      </p>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate">
                                      {lead.jobTitle}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[12px] text-slate-400 italic">No designated lead</span>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                What team does that ({members.length} members):
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {members.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs"
                                    title={`${member.fullName} (${member.jobTitle})`}
                                  >
                                    <img
                                      src={member.avatar}
                                      alt={member.fullName}
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                    <span className="text-[11px] font-medium text-slate-800">
                                      {member.fullName}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      ({member.department.split(" ")[0]})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <div className="flex items-center gap-2">
                              <span>Deadline: <strong className="text-slate-700">{proj.deadline}</strong></span>
                              <span>&bull;</span>
                              <span>Tasks: <strong className="text-slate-700">{pDone}/{pTasks.length} Completed</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#0084d4] h-full rounded-full transition-all duration-300"
                                  style={{ width: `${pPercent}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-800 w-8 text-right">
                                {pPercent}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
              All Company Projects &amp; Live Status
            </h2>
            <p className="text-[12px] text-slate-500">
              Master register: click any project to view tasks, assigned owners, and deliverables
            </p>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0084d4] hover:text-[#0277bd] transition-colors self-start sm:self-auto shrink-0 group"
          >
            <span>View Projects</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-3">Project</th>
                <th className="pb-3 px-3">Project Manager</th>
                <th className="pb-3 px-3">Team Lead</th>
                <th className="pb-3 px-3">Team Members</th>
                <th className="pb-3 px-3">Deadline</th>
                <th className="pb-3 px-3 w-36">Progress</th>
                <th className="pb-3 pl-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {projects.map((project) => {
                const pm = users.find((u) => u.id === project.projectManagerId);
                const lead = users.find((u) => u.id === project.teamLeadId);
                const pTasks = tasks.filter((t) => t.projectId === project.id);
                const pDone = pTasks.filter((t) => t.status === "Completed").length;
                const pPercent = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                const members = users.filter((u) => project.teamMemberIds.includes(u.id));

                return (
                  <tr
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 pr-3">
                      <p className="font-semibold text-slate-900 group-hover:text-[#0084d4] transition-colors">
                        {project.name}
                      </p>
                    </td>

                    <td className="py-3.5 px-3">
                      {pm && (
                        <div className="flex items-center gap-1.5">
                          <img src={pm.avatar} alt={pm.name} className="w-5 h-5 rounded-full object-cover" />
                          <span className="text-[12px] font-medium text-slate-800">{pm.fullName}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {lead && (
                        <div className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-[#ffa500]" />
                          <span className="text-[12px] font-bold text-[#ffa500]">
                            {lead.id === currentUser.id ? "(You)" : lead.fullName}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center -space-x-1.5">
                        {members.slice(0, 4).map((m) => (
                          <img
                            key={m.id}
                            src={m.avatar}
                            alt={m.name}
                            title={m.fullName}
                            className="w-6 h-6 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                        {members.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-[9px] font-bold flex items-center justify-center text-slate-600">
                            +{members.length - 4}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-[12px] text-slate-600 font-medium">
                      {project.deadline}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#0084d4] h-full rounded-full" style={{ width: `${pPercent}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 w-8 text-right">
                          {pPercent}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 pl-3 text-right">
                      <StatusBadge status={project.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
              Company Attendance Roster
            </h2>
            <p className="text-[12px] text-slate-500">
              Live clock-in and duration monitoring across the entire company roster
            </p>
          </div>

          <Link
            href="/attendance"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0084d4] hover:text-[#0277bd] transition-colors self-start sm:self-auto shrink-0 group"
          >
            <span>View Attendance</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-3">Staff Member</th>
                <th className="pb-3 px-3">Role</th>
                <th className="pb-3 px-3">Department</th>
                <th className="pb-3 px-3">Clock In</th>
                <th className="pb-3 px-3">Clock Out</th>
                <th className="pb-3 px-3">Worked Duration</th>
                <th className="pb-3 pl-3 text-right">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {todayAttendance.slice(0, 5).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 pr-3">
                    <span className="font-semibold text-slate-900">{row.userName}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium ${
                        row.userRole === "project_manager"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30"
                      }`}
                    >
                      {row.userRole === "project_manager" ? "Project Manager" : "Employer"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[12px] text-slate-500">{row.department}</td>
                  <td className="py-3 px-3 text-[12px] text-slate-800 font-medium">{row.clockIn}</td>
                  <td className="py-3 px-3 text-[12px] text-slate-500">{row.clockOut}</td>
                  <td className="py-3 px-3 text-[12px] font-bold text-[#0084d4]">{row.duration}</td>
                  <td className="py-3 pl-3 text-right">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
