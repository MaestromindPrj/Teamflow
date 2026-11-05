"use client";

import { useState, useRef } from "react";
import { X, CheckSquare, UploadCloud, Paperclip } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { Project } from "@/data/teamflowData";

interface CreateTaskModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFileType(fileName: string, mimeType?: string): "image" | "pdf" | "figma" | "zip" | "doc" {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "") || mimeType?.startsWith("image/")) {
    return "image";
  }
  if (ext === "pdf" || mimeType === "application/pdf") {
    return "pdf";
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
    return "zip";
  }
  if (ext === "fig") {
    return "figma";
  }
  return "doc";
}

export default function CreateTaskModal({ project, isOpen, onClose }: CreateTaskModalProps) {
  const { users, createTask, uploadTaskMedia, currentUser } = useTeamFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectMembers = users.filter((u) => project.teamMemberIds?.includes(u.id));
  const assignableUsers = projectMembers.length > 0 ? projectMembers : users;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(assignableUsers[0]?.id || currentUser.id);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [status, setStatus] = useState<"To Do" | "In Progress" | "Review" | "Completed">("To Do");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calculatedSize, setCalculatedSize] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "pdf" | "figma" | "zip" | "doc">("figma");

  if (!isOpen) return null;

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    setSelectedFile(file);
    setCalculatedSize(formatFileSize(file.size));
    setMediaType(detectFileType(file.name, file.type));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setCalculatedSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedFile(null);
    setCalculatedSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo) return;

    const newTask = createTask({
      projectId: project.id,
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      priority,
      deadline,
      status
    });

    if (selectedFile) {
      uploadTaskMedia(newTask.id, {
        name: selectedFile.name,
        size: calculatedSize || formatFileSize(selectedFile.size),
        type: mediaType,
        url: URL.createObjectURL(selectedFile),
        rawFile: selectedFile
      });
    }

    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <CheckSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Add Task to Project
              </h3>
              <p className="text-[11px] text-slate-400">
                {project.name} ({project.code})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
              required
              className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
            >
              {assignableUsers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.id === currentUser.id ? `${member.fullName} (You)` : member.fullName} ({member.jobTitle || "Employer"}) {member.id === project.teamLeadId ? "• [Team Lead]" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "High" | "Medium" | "Low")}
                className="w-full px-2.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "To Do" | "In Progress" | "Review" | "Completed")}
                className="w-full px-2.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-2.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Add Media <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center shrink-0 border border-sky-100">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {calculatedSize} &bull; {mediaType.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-medium text-[#0084d4] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-[11px] font-medium text-[#de2d1d] hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-slate-200 hover:border-[#0084d4] bg-slate-50/50 hover:bg-sky-50/20 rounded-lg p-3 text-center cursor-pointer transition-all group flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4 text-[#0084d4] group-hover:scale-110 transition-transform" />
                <span className="text-[12px] font-medium text-slate-600 group-hover:text-[#0084d4]">
                  Upload media attachment
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  (.png, .jpg, .pdf, .fig, .zip)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
