"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus, Shield, Users, UserCheck, Crown, Sparkles } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import UserAvatar from "@/components/UserAvatar";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

function generateProjectCode(projectName: string, existingProjects: { code: string }[]): string {
  const existingCodes = new Set(existingProjects.map((p) => p.code.toUpperCase()));
  const trimmed = projectName.trim();

  let prefix = "";
  if (!trimmed) {
    prefix = "PRJ";
  } else {
    const stopWords = new Set(["a", "an", "the", "and", "for", "of", "in", "on", "with", "to", "at", "by", "from"]);
    const words = trimmed
      .split(/[\s\-_]+/)
      .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

    if (words.length >= 2) {
      prefix = words.slice(0, 4).map((w) => w[0].toUpperCase()).join("");
      if (prefix.length < 3 && words[0].length >= 3) {
        prefix = words[0].substring(0, 3).toUpperCase();
      }
    } else if (words.length === 1) {
      prefix = words[0].replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
    }

    if (!prefix || prefix.length < 2) {
      prefix = "PRJ";
    }
  }

  let num = 1;
  let candidate = `${prefix}-${String(num).padStart(2, "0")}`;
  while (existingCodes.has(candidate)) {
    num++;
    candidate = `${prefix}-${String(num).padStart(2, "0")}`;
  }

  return candidate;
}

export default function NewProjectModal({
  isOpen,
  onClose,
  onCreated
}: NewProjectModalProps) {
  const { currentUser, users, projects, createProject } = useTeamFlow();

  const projectManagers = users.filter((u) => u.role === "project_manager");
  const employers = users.filter((u) => u.role === "employer");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setCode(generateProjectCode(name, projects));
  }, [name, projects]);
  const [category, setCategory] = useState("Web Engineering");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");

  const [selectedPmId, setSelectedPmId] = useState<string>(
    currentUser.role === "project_manager" ? currentUser.id : projectManagers[0]?.id || ""
  );

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    employers.map((e) => e.id)
  );

  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    employers[0]?.id || ""
  );

  if (!isOpen) return null;

  const handleToggleMember = (empId: string) => {
    setSelectedMemberIds((prev) => {
      const exists = prev.includes(empId);
      if (exists) {
        if (prev.length === 1) return prev;
        const updated = prev.filter((id) => id !== empId);
        if (selectedLeadId === empId && updated.length > 0) {
          setSelectedLeadId(updated[0]);
        }
        return updated;
      } else {
        return [...prev, empId];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedLeadId) return;

    const finalCode = (code.trim() || generateProjectCode(name, projects)).toUpperCase();

    const newProject = createProject({
      name: name.trim(),
      code: finalCode,
      description: description.trim(),
      category,
      priority,
      deadline: deadline || "2026-12-31",
      budget: budget || "$50,000",
      projectManagerId: selectedPmId,
      teamLeadId: selectedLeadId,
      teamMemberIds: selectedMemberIds
    });

    onCreated(newProject.id);
    onClose();
  };

  const eligibleLeads = employers.filter((emp) => selectedMemberIds.includes(emp.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                Create New Project
              </h2>
              <p className="text-[12px] text-slate-400">
                Setup project details, team roster and designate the team lead
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setCode(generateProjectCode(e.target.value, projects));
                }}
                placeholder="e.g. NextGen Mobile Banking Gateway"
                className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Project Code
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={code}
                placeholder="PRJ-01"
                className="w-full px-3.5 py-2 text-[13px] uppercase font-mono font-bold tracking-wider bg-slate-100/90 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed select-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Project Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline high-level milestones, target deliverables, and technology stack..."
              className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              >
                <option value="Web Engineering">Web Engineering</option>
                <option value="Mobile Systems">Mobile Systems</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Design System">Design System</option>
                <option value="Security &amp; Compliance">Security &amp; Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "High" | "Medium" | "Low")}
                className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Target Deadline
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Budget
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="$50,000"
                className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              />
            </div>
          </div>

          {currentUser.role === "ceo" && (
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Assign Managing Project Manager
              </label>
              <select
                value={selectedPmId}
                onChange={(e) => setSelectedPmId(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              >
                {projectManagers.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.fullName} (Project Manager)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-semibold text-slate-700">
                Assign Team Members ({selectedMemberIds.length} selected)
              </label>
              <span className="text-[11px] text-slate-400">
                Select employers working on this project
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50/50">
              {employers.map((emp) => {
                const isSelected = selectedMemberIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleMember(emp.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg border text-[12px] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-[#0084d4] shadow-xs"
                        : "bg-white/60 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 accent-[#0084d4] rounded pointer-events-none"
                    />
                    <UserAvatar
                      src={emp.avatar}
                      name={emp.name}
                      role={emp.role}
                      className="w-6 h-6 rounded-full shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 truncate leading-tight">
                        {emp.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {emp.department}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-[#ffa500]/15 border border-[#ffa500]/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#ffa500]" />
              <label className="text-[13px] font-bold text-[#ffa500]">
                Designate Team Lead for this Project *
              </label>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              The designated Team Lead coordinates team tasks, member assignments, and deadlines for this project.
            </p>

            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] bg-white border border-[#ffa500]/40 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:border-[#ffa500] shadow-2xs"
            >
              {eligibleLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.id === currentUser.id ? `${lead.fullName} (You)` : lead.fullName} — {lead.department}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
