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
  AlertTriangle,
  ChevronDown,
  Send,
  Cpu
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { Task } from "@/data/teamflowData";
import CreateTaskModal from "@/components/CreateTaskModal";
import EditTaskModal from "@/components/EditTaskModal";
import UploadMediaModal from "@/components/UploadMediaModal";
import UploadProjectMediaModal from "@/components/UploadProjectMediaModal";
import AddTeamMemberModal from "@/components/AddTeamMemberModal";
import UserAvatar from "@/components/UserAvatar";
import InPageSubTabs from "@/components/InPageSubTabs";
import DeleteMediaConfirmModal from "@/components/DeleteMediaConfirmModal";
import RequestMediaDeletionModal from "@/components/RequestMediaDeletionModal";

interface ProjectDetailModalProps {
  projectId: string | null;
  onClose: () => void;
  initialTaskId?: string | null;
  initialTab?: "tasks" | "media" | "team";
}

export default function ProjectDetailModal({
  projectId,
  onClose,
  initialTaskId,
  initialTab,
}: ProjectDetailModalProps) {
  const {
    currentUser,
    users,
    projects,
    tasks,
    updateProject,
    updateTask,
    deleteTask,
    deleteProject,
    getProjectTeamLead,
    getProjectManager,
    isUserTeamLead,
    deleteTaskMedia,
    deleteProjectMedia,
    canUserDeleteMedia,
    mediaDeletionRequests
  } = useTeamFlow();

  const [activeTab, setActiveTab] = useState<"tasks" | "media" | "team">("tasks");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [uploadTaskTarget, setUploadTaskTarget] = useState<{ id: string; title: string } | null>(null);
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>("All");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [mediaDeleteTarget, setMediaDeleteTarget] = useState<{
    taskId: string;
    attachmentId: string;
    fileName: string;
    projectName: string;
    taskTitle: string;
  } | null>(null);

  const [mediaRequestTarget, setMediaRequestTarget] = useState<{
    attachmentId: string;
    attachmentName: string;
    taskId: string;
    taskTitle: string;
    projectId: string;
    projectName: string;
    projectCode: string;
  } | null>(null);
  
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

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, projectId]);

  useEffect(() => {
    if (initialTaskId && projectId) {
      const target = tasks.find((t) => t.id === initialTaskId);
      if (target) {
        setEditingTask(target);
      }
    }
  }, [initialTaskId, projectId, tasks]);

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
  const canAddTeamMember = isCeo || isPm;

  const currentProject = projects.find((p) => p.id === project.id) || project;

  const allProjectTasks = tasks.filter(
    (t) =>
      t.projectId === currentProject.id &&
      t.title !== "Project Assets & Deliverables" &&
      t.title !== "Project Deliverables & Assets"
  );

  const visibleTasks = allProjectTasks.filter((t) => {
    if (selectedTaskFilter !== "All") {
      return t.status === selectedTaskFilter;
    }
    return true;
  });

  const canManageProject = isCeo || isPm || isLead;
  const canAddOrEditTask = canManageProject;

  const projectLevelMedia = (currentProject.attachments || []).map((att) => ({
    ...att,
    taskId: "",
    taskTitle: "Project Deliverable",
    taskAssignee: "Project Level",
    isProjectMedia: true
  }));

  const taskLevelMedia = allProjectTasks.flatMap((t) =>
    (t.attachments || []).map((att) => ({
      ...att,
      taskId: t.id,
      taskTitle: t.title,
      taskAssignee: users.find((u) => u.id === t.assignedTo)?.fullName || "Team Member",
      isProjectMedia: false
    }))
  );

  const projectMedia = [...projectLevelMedia, ...taskLevelMedia];

  const projectMembers = users.filter((u) => project.teamMemberIds.includes(u.id));

  const totalTasksCount = allProjectTasks.length;
  const completedTasksCount = allProjectTasks.filter((t) => t.status === "Completed").length;
  const hasCompletedTasks = completedTasksCount > 0;
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
              {canManageProject ? (
                <div className="relative inline-flex items-center">
                  <select
                    value={project.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as any;
                      if (nextStatus === "Planning" && hasCompletedTasks) return;
                      updateProject(project.id, { status: nextStatus });
                    }}
                    className={`text-[11px] font-semibold rounded-md pl-2.5 pr-6 py-0.5 border cursor-pointer appearance-none focus:outline-hidden transition-colors ${
                      project.status === "In Progress"
                        ? "bg-[#e0f2fe] text-[#0284c7] border-sky-200/70 hover:bg-sky-100"
                        : project.status === "In Review"
                        ? "bg-[#ffa500]/15 text-[#ffa500] border-[#ffa500]/30 hover:bg-[#ffa500]/25"
                        : project.status === "Completed"
                        ? "bg-[#4ade1d]/15 text-[#4ade1d] border-[#4ade1d]/30 hover:bg-[#4ade1d]/25"
                        : "bg-purple-50 text-purple-700 border-purple-200/70 hover:bg-purple-100"
                    }`}
                    title={
                      hasCompletedTasks
                        ? "Planning is disabled because one or more tasks are completed"
                        : "Click to change project status"
                    }
                  >
                    <option
                      value="Planning"
                      disabled={hasCompletedTasks}
                      className={hasCompletedTasks ? "text-slate-400 bg-slate-100" : ""}
                    >
                      {hasCompletedTasks ? "Planning (Locked)" : "Planning"}
                    </option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-current absolute right-1.5 pointer-events-none opacity-70" />
                </div>
              ) : (
                <StatusBadge status={project.status} />
              )}
              <PriorityBadge priority={project.priority} />
              <span className="text-[12px] text-slate-400 font-medium">
                {project.category}
              </span>
            </div>
            <h2 className="text-[19px] font-bold text-slate-900 tracking-tight leading-snug">
              {project.name}
            </h2>
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
            {project.status === "Planning" && project.startDate && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Planned Start: <strong className="text-purple-700">{project.startDate}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Deadline: <strong className="text-slate-800">{project.deadline}</strong></span>
            </div>
            {project.techStack && project.techStack.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-[#0084d4]" />
                  <span>Tech:</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-[#0084d4] border border-sky-200/60"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
              ) : activeTab === "media" ? (
                <button
                  onClick={() => setIsAddMediaOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Media</span>
                </button>
              ) : activeTab === "team" && canAddTeamMember ? (
                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Team Member</span>
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
                                <UserAvatar
                                  src={assignee.avatar}
                                  name={assignee.name}
                                  role={assignee.role}
                                  className="w-4.5 h-4.5 rounded-full"
                                  textClassName="text-[8px]"
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
                                  <div className="flex items-center gap-1">
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-slate-400 hover:text-slate-800 p-1"
                                      title="View / Download"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    {canUserDeleteMedia(project.id) ? (
                                      <button
                                        onClick={() =>
                                          setMediaDeleteTarget({
                                            taskId: task.id,
                                            attachmentId: file.id,
                                            fileName: file.name,
                                            projectName: project.name,
                                            taskTitle: task.title,
                                          })
                                        }
                                        className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                                        title="Delete deliverable"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          setMediaRequestTarget({
                                            attachmentId: file.id,
                                            attachmentName: file.name,
                                            taskId: task.id,
                                            taskTitle: task.title,
                                            projectId: project.id,
                                            projectName: project.name,
                                            projectCode: project.code,
                                          })
                                        }
                                        className="text-amber-600 hover:text-amber-700 p-1 transition-colors cursor-pointer"
                                        title="Request Team Lead to delete"
                                      >
                                        <Send className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
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
                        {file.isProjectMedia ? (
                          <p className="text-slate-500 truncate">
                            Source: <span className="font-semibold text-[#0084d4] bg-sky-50 px-1.5 py-0.5 rounded">Project Deliverable</span>
                          </p>
                        ) : (
                          <p className="text-slate-500 truncate">
                            Task: <span className="font-medium text-slate-800">{file.taskTitle}</span>
                          </p>
                        )}
                        <p className="text-slate-400">
                          Uploaded by: <strong className="text-slate-700">{file.uploadedByName}</strong>
                        </p>
                      </div>

                      {mediaDeletionRequests.find((r) => r.attachmentId === file.id && r.status === "Pending") && (
                        <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
                          Deletion requested by <strong>{mediaDeletionRequests.find((r) => r.attachmentId === file.id && r.status === "Pending")?.requestedByName}</strong>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-8 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold text-center border border-slate-200 transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3 h-3" />
                          <span>Access</span>
                        </a>

                        {canUserDeleteMedia(project.id) ? (
                          <button
                            onClick={() =>
                              setMediaDeleteTarget({
                                taskId: file.taskId,
                                attachmentId: file.id,
                                fileName: file.name,
                                projectName: project.name,
                                taskTitle: file.taskTitle,
                              })
                            }
                            className="w-8 h-8 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
                            title="Delete deliverable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : mediaDeletionRequests.find((r) => r.attachmentId === file.id && r.status === "Pending") ? (
                          <span className="h-8 px-2.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200 shrink-0 inline-flex items-center justify-center">
                            Requested
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              setMediaRequestTarget({
                                attachmentId: file.id,
                                attachmentName: file.name,
                                taskId: file.taskId,
                                taskTitle: file.taskTitle,
                                projectId: project.id,
                                projectName: project.name,
                                projectCode: project.code,
                              })
                            }
                            className="h-8 px-2.5 text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 shrink-0"
                            title="Request designated Team Lead to delete this media"
                          >
                            <Send className="w-3 h-3" />
                            <span>Request</span>
                          </button>
                        )}
                      </div>
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
                    <UserAvatar
                      src={projectManager.avatar}
                      name={projectManager.fullName}
                      role={projectManager.role}
                      className="w-10 h-10 rounded-full border border-blue-300"
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
                    <UserAvatar
                      src={teamLead.avatar}
                      name={teamLead.fullName}
                      role={teamLead.role}
                      className="w-10 h-10 rounded-full border border-[#ffa500]"
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
                      <p className="text-[11px] text-slate-500">{teamLead.jobTitle || "Team Lead"}</p>
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
                          <UserAvatar
                            src={member.avatar}
                            name={member.fullName}
                            role={member.role}
                            className="w-8 h-8 rounded-full"
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
                              {member.jobTitle || "Employer"}
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

        <AddTeamMemberModal
          project={project}
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
        />

        <UploadProjectMediaModal
          project={project}
          isOpen={isAddMediaOpen}
          onClose={() => setIsAddMediaOpen(false)}
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
        <DeleteMediaConfirmModal
          isOpen={Boolean(mediaDeleteTarget)}
          onClose={() => setMediaDeleteTarget(null)}
          onConfirm={async () => {
            if (mediaDeleteTarget) {
              if (mediaDeleteTarget.taskId) {
                await deleteTaskMedia(mediaDeleteTarget.taskId, mediaDeleteTarget.attachmentId);
              } else {
                await deleteProjectMedia(project.id, mediaDeleteTarget.attachmentId);
              }
            }
          }}
          fileName={mediaDeleteTarget?.fileName || ""}
          projectName={mediaDeleteTarget?.projectName || ""}
          taskTitle={mediaDeleteTarget?.taskTitle || ""}
        />

        <RequestMediaDeletionModal
          isOpen={Boolean(mediaRequestTarget)}
          onClose={() => setMediaRequestTarget(null)}
          mediaItem={mediaRequestTarget}
        />
      </div>
    </div>
  );
}
