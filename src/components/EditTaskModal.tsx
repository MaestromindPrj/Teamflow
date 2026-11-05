"use client";

import { useState, useEffect } from "react";
import { X, Edit3, CheckSquare, Calendar, User, AlertCircle } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { Task, Project } from "@/data/teamflowData";

interface EditTaskModalProps {
  task: Task | null;
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditTaskModal({ task, project, isOpen, onClose }: EditTaskModalProps) {
  const { users, updateTask, currentUser } = useTeamFlow();

  const projectMembers = users.filter((u) => project.teamMemberIds.includes(u.id));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<"To Do" | "In Progress" | "Review" | "Completed">("To Do");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setAssignedTo(task.assignedTo);
      setPriority(task.priority);
      setDeadline(task.deadline);
      setStatus(task.status);
      setProgress(task.progress);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo) return;

    updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      priority,
      deadline,
      status,
      progress: status === "Completed" ? 100 : progress
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Edit Project Task
              </h3>
              <p className="text-[11px] text-slate-400">
                {project.name} ({project.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Responsive Navigation Menu"
              className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Task Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions, requirements and deliverables..."
              className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Assign To Team Member *
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 cursor-pointer"
            >
              {projectMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.id === currentUser.id ? `${member.fullName} (You)` : member.fullName} ({member.jobTitle || "Employer"})
                  {member.id === project.teamLeadId ? " — [Team Lead]" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "High" | "Medium" | "Low")}
                className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 cursor-pointer"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const nextStatus = e.target.value as "To Do" | "In Progress" | "Review" | "Completed";
                  setStatus(nextStatus);
                  if (nextStatus === "To Do") setProgress(0);
                  else if (nextStatus === "In Progress" && (status === "Review" || status === "Completed" || status === "To Do" || progress >= 90 || progress === 0)) setProgress(50);
                  else if (nextStatus === "Review") setProgress(90);
                  else if (nextStatus === "Completed") setProgress(100);
                }}
                className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 cursor-pointer"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Progress ({progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProgress(val);
                  if (val === 100) setStatus("Completed");
                  else if (val === 0 && status === "Completed") setStatus("To Do");
                  else if (val > 0 && val < 90 && (status === "To Do" || status === "Completed")) setStatus("In Progress");
                  else if (val >= 90 && val < 100 && status === "Completed") setStatus("Review");
                }}
                className="w-full mt-2 cursor-pointer accent-[#0084d4]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[12px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
