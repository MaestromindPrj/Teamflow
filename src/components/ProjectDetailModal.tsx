"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  Shield,
  FileText,
  Download,
  UploadCloud,
  Trash2,
  ExternalLink,
  Archive,
  Image as ImageIcon,
  Edit3,
  Users,
  Crown,
  AlertTriangle
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { Task } from "@/data/teamflowData";
import CreateTaskModal from "@/components/CreateTaskModal";
import EditTaskModal from "@/components/EditTaskModal";
import UploadMediaModal from "@/components/UploadMediaModal";
import InPageSubTabs from "@/components/InPageSubTabs";

interface ProjectDetailModalProps {
  projectId: string | null;
  onClose: () => void;
}

export default function ProjectDetailModal({ projectId, onClose }: ProjectDetailModalProps) {
  const {
    currentUser,
    users,
    projects,
    tasks,
    updateTask,
    deleteTask,
    deleteProject,
    getProjectTeamLead,
    getProjectManager,
    isUserTeamLead
  } = useTeamFlow();

  const [activeTab, setActiveTab] = useState<"tasks" | "media" | "team">("tasks");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [uploadTaskTarget, setUploadTaskTarget] = useState<{ id: string; title: string } | null>(null);
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>("All");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showDeleteConfirm) {
        setShowDeleteConfirm(false);
      }
    };
    if (showDeleteConfirm) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteConfirm]);

  if (!projectId) return null;
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  const teamLead = getProjectTeamLead(project.id);
  const projectManager = getProjectManager(project.id);
  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";
  const isLead = isUserTeamLead(currentUser.id, project.id);
  const isRegularEmployer = currentUser.role === "employer" && !isLead;
  const canDeleteProject = isCeo || isPm;

  const allProjectTasks = tasks.filter((t) => t.projectId === project.id);

  const visibleTasks = allProjectTasks.filter((t) => {
    if (selectedTaskFilter !== "All") {
      return t.status === selectedTaskFilter;
    }
    return true;
  });

  const canManageProject = isCeo || isPm || isLead;
  const canAddOrEditTask = canManageProject;

  const projectMedia = allProjectTasks.flatMap((t) =>
    t.attachments.map((att) => ({
      ...att,
      taskId: t.id,
      taskTitle: t.title,
      taskAssignee: users.find((u) => u.id === t.assignedTo)?.fullName || "Team Member"
    }))
  ).filter((m) => {
    if (isRegularEmployer) {
      const parentTask = allProjectTasks.find((t) => t.id === m.taskId);
      return parentTask?.assignedTo === currentUser.id;
    }
    return true;
  });

  const projectMembers = users.filter((u) => project.teamMemberIds.includes(u.id));

  const totalTasksCount = allProjectTasks.length;
  const completedTasksCount = allProjectTasks.filter((t) => t.status === "Completed").length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const handleStatusChange = (taskId: string, newStatus: "To Do" | "In Progress" | "Review" | "Completed") => {
    updateTask(taskId, { status: newStatus });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "figma":
        return <span className="font-bold text-[10px] text-purple-600">FIG</span>;
      case "zip":
        return <Archive className="w-4 h-4 text-[#ffa500]" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-[#4ade1d]" />;
      default:
        return <FileText className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 tracking-wider uppercase">
                {project.code}
              </span>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
              <span className="text-[12px] text-slate-400 font-medium">
                {project.category}
              </span>
            </div>
            <h2 className="text-[19px] font-bold text-slate-900 tracking-tight leading-snug">
              {project.name}
            </h2>
            <p className="text-[12px] text-slate-500 font-normal mt-1 leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canDeleteProject && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#de2d1d] bg-[#de2d1d]/15 hover:bg-[#de2d1d]/25 border border-[#de2d1d]/30 transition-colors cursor-pointer shadow-2xs"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex flex-wrap items-center gap-4">
            {projectManager && (
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-400">PM:</span>
                <span className="font-semibold text-slate-800">{projectManager.fullName}</span>
              </div>
            )}
            {teamLead && (
              <div className="flex items-center gap-1.5 bg-[#ffa500]/15 px-2 py-0.5 rounded-md border border-[#ffa500]/30">
                <Crown className="w-3.5 h-3.5 text-[#ffa500]" />
                <span className="text-[#ffa500] font-medium">Team Lead:</span>
                <span className="font-bold text-[#ffa500]">
                  {teamLead.id === currentUser.id ? "(You)" : teamLead.fullName}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Deadline: <strong className="text-slate-800">{project.deadline}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Progress</span>
            <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0084d4] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-800">{progressPercent}%</span>
          </div>
        </div>


        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/40">
          <InPageSubTabs<"tasks" | "media" | "team">
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            tabs={[
              {
                id: "tasks",
                label: "Tasks",
                icon: <CheckCircle2 className="w-4 h-4" />,
                count: visibleTasks.length,
              },
              {
                id: "media",
                label: "Deliverables & Media",
                icon: <UploadCloud className="w-4 h-4" />,
                count: projectMedia.length,
              },
              {
                id: "team",
                label: "Team Roster",
                icon: <Users className="w-4 h-4" />,
                count: projectMembers.length,
              },
            ]}
            rightAction={
              activeTab === "tasks" && canManageProject ? (
                <button
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              ) : null
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {["All", "To Do", "In Progress", "Review", "Completed"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedTaskFilter(filter)}
                      className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        selectedTaskFilter === filter
                          ? "bg-white text-slate-900 shadow-2xs font-semibold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <span className="text-[12px] text-slate-400">
                  Viewing all project tasks
                </span>
              </div>

              {visibleTasks.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-slate-700">No tasks found</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    No tasks found in this project under the selected filter.
                  </p>
                  {canManageProject && (
                    <button
                      onClick={() => setIsCreateTaskOpen(true)}
                      className="mt-3 px-4 py-1.5 bg-[#0084d4] text-white rounded-lg text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Task Now</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleTasks.map((task) => {
                    const assignee = users.find((u) => u.id === task.assignedTo);
                    const isAssignee = task.assignedTo === currentUser.id;

                    return (
                      <div
                        key={task.id}
                        className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <StatusBadge status={task.status} />
                              <PriorityBadge priority={task.priority} />
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Deadline: {task.deadline}
                              </span>
                            </div>
                            <h4 className="text-[14px] font-semibold text-slate-900 leading-tight">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-[12px] text-slate-500 font-normal mt-1 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {canAddOrEditTask ? (
                            <div className="flex items-center gap-2 self-start shrink-0">
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    task.id,
                                    e.target.value as "To Do" | "In Progress" | "Review" | "Completed"
                                  )
                                }
                                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-pointer focus:outline-hidden focus:border-[#0084d4]"
                                title="Change task status"
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Review">In Review</option>
                                <option value="Completed">Mark Completed</option>
                              </select>

                              <button
                                onClick={() => setEditingTask(task)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200/90 inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Edit Task Details"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => setUploadTaskTarget({ id: task.id, title: task.title })}
                                className="px-2.5 py-1 bg-sky-50 text-[#0084d4] hover:bg-sky-100 rounded-lg text-[11px] font-semibold border border-sky-200/70 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Upload deliverable or media"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Deliverable</span>
                              </button>

                              <button
                                onClick={() => deleteTask(task.id)}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-[#de2d1d] hover:bg-[#de2d1d]/15 flex items-center justify-center transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-[12px]">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[11px]">Assigned to:</span>
                            {assignee ? (
                              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/80">
                                <img
                                  src={assignee.avatar}
                                  alt={assignee.name}
                                  className="w-4.5 h-4.5 rounded-full object-cover"
                                />
                                <span className="text-[11px] font-semibold text-slate-800">
                                  {isAssignee ? `${assignee.fullName} (You)` : assignee.fullName}
                                </span>
                                {assignee.id === project.teamLeadId && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-[#ffa500] font-bold">
                                    <Crown className="w-2.5 h-2.5 text-[#ffa500]" />
                                    <span>Lead</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 font-medium">Unassigned</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">Progress:</span>
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#0084d4] h-full rounded-full"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">{task.progress}%</span>
                          </div>
                        </div>

                        {task.attachments.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                              Attached Deliverables &amp; Media ({task.attachments.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {task.attachments.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]"
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                      {getFileIcon(file.type)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-800 truncate leading-tight">
                                        {file.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {file.size} &bull; by {file.uploadedByName}
                                      </p>
                                    </div>
                                  </div>
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-400 hover:text-slate-800 p-1"
                                    title="View / Download"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900">
                    Project Deliverables &amp; Asset Vault
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    All Figma prototypes, build artifacts, architecture diagrams, and milestone media
                  </p>
                </div>
              </div>

              {projectMedia.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg">
                  <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-slate-700">No media attached yet</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    Deliverables can be uploaded directly from any task in the tasks list.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {projectMedia.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {file.size} &bull; {file.type.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                        <p className="text-slate-500 truncate">
                          Task: <span className="font-medium text-slate-800">{file.taskTitle}</span>
                        </p>
                        <p className="text-slate-400">
                          Uploaded by: <strong className="text-slate-700">{file.uploadedByName}</strong>
                        </p>
                      </div>

                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold text-center border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3 h-3" />
                        <span>Access Deliverable</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "team" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projectManager && (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <img
                      src={projectManager.avatar}
                      alt={projectManager.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-blue-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          Managing Project Manager
                        </span>
                      </div>
                      <h4 className="text-[13px] font-bold text-slate-900 mt-0.5">
                        {projectManager.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-500">{projectManager.email}</p>
                    </div>
                  </div>
                )}

                {teamLead && (
                  <div className="bg-[#ffa500]/15 border border-[#ffa500]/30 rounded-lg p-4 flex items-center gap-3">
                    <img
                      src={teamLead.avatar}
                      alt={teamLead.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-[#ffa500]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-[#ffa500]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffa500]">
                          Designated Team Lead
                        </span>
                      </div>
                      <h4 className="text-[13px] font-bold text-slate-900 mt-0.5">
                        {teamLead.id === currentUser.id ? "(You)" : teamLead.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-500">{teamLead.jobTitle}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[13px] font-bold text-slate-900 mb-2">
                  Project Team Members ({projectMembers.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {projectMembers.map((member) => {
                    const memberTasks = allProjectTasks.filter((t) => t.assignedTo === member.id);
                    const memberDone = memberTasks.filter((t) => t.status === "Completed").length;

                    return (
                      <div
                        key={member.id}
                        className="bg-white border border-slate-200/90 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <img
                            src={member.avatar}
                            alt={member.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[12px] font-semibold text-slate-900 truncate">
                                {member.id === currentUser.id ? `${member.fullName} (You)` : member.fullName}
                              </p>
                              {member.id === project.teamLeadId && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#ffa500] bg-[#ffa500]/15 border border-[#ffa500]/30 px-1 py-0.2 rounded">
                                  <Crown className="w-2.5 h-2.5 text-[#ffa500]" />
                                  <span>Lead</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">
                              {member.jobTitle}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-bold text-[#0084d4]">
                            {memberDone}/{memberTasks.length} tasks
                          </span>
                          <span className="block text-[10px] text-slate-400">completed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <CreateTaskModal
          project={project}
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
        />

        <EditTaskModal
          task={editingTask}
          project={project}
          isOpen={editingTask !== null}
          onClose={() => setEditingTask(null)}
        />

        {uploadTaskTarget && (
          <UploadMediaModal
            taskId={uploadTaskTarget.id}
            taskTitle={uploadTaskTarget.title}
            isOpen={true}
            onClose={() => setUploadTaskTarget(null)}
          />
        )}

        {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#de2d1d]/15 border border-[#de2d1d]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-[#de2d1d]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      Delete Project
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      Are you sure you want to delete <span className="font-semibold text-slate-800">"{project.name}"</span>? This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[12px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Project Code:</span>
                    <span className="font-bold text-slate-800 uppercase">{project.code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Associated Tasks:</span>
                    <span className="font-semibold text-[#de2d1d]">
                      {allProjectTasks.length} task{allProjectTasks.length === 1 ? "" : "s"} will be removed
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Members:</span>
                    <span className="font-semibold text-slate-800">
                      {projectMembers.length} member{projectMembers.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteProject(project.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#de2d1d] hover:bg-[#c92517] transition-colors cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
