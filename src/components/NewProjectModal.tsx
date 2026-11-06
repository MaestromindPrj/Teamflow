"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus, Shield, Users, UserCheck, Crown, Sparkles, AlertCircle, Calendar, Plus } from "lucide-react";
import { useTeamFlow, TechStackItem } from "@/context/TeamFlowContext";
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
  const { currentUser, users, projects, categories, createProject, techStacks, createTechStack } = useTeamFlow();
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);
  const [customTechInput, setCustomTechInput] = useState("");
  const [isAddingTech, setIsAddingTech] = useState(false);

  const handleAddCustomTech = async () => {
    const trimmed = customTechInput.trim();
    if (!trimmed) return;

    const existing = techStacks.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      if (!selectedTechStack.includes(existing.name)) {
        setSelectedTechStack((prev) => [...prev, existing.name]);
      }
      setCustomTechInput("");
      return;
    }

    setIsAddingTech(true);
    const success = await createTechStack(trimmed);
    setIsAddingTech(false);

    if (success) {
      setSelectedTechStack((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed]
      );
      setCustomTechInput("");
    }
  };

  const projectManagers = users.filter((u) => u.role === "project_manager");
  const employers = users.filter((u) => u.role === "employer");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    setCode(generateProjectCode(name, projects));
  }, [name, projects]);
  const [category, setCategory] = useState(() => categories[0]?.name || "");

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.name === category)) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);
  const [status, setStatus] = useState<"Planning" | "In Progress" | "In Review" | "Completed">("Planning");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [selectedPmId, setSelectedPmId] = useState<string>(
    currentUser.role === "project_manager"
      ? currentUser.id
      : projectManagers[0]?.id || currentUser.id
  );

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    employers.map((e) => e.id)
  );

  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    employers[0]?.id || currentUser.id
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

    if (!selectedTechStack || selectedTechStack.length === 0) {
      setError("Please select at least one technology stack.");
      return;
    }

    if (status === "Planning" && !startDate) {
      setError("Please specify the Planned Start Date for this project.");
      return;
    }
    setError(null);

    const finalCode = (code.trim() || generateProjectCode(name, projects)).toUpperCase();

    const newProject = createProject({
      name: name.trim(),
      code: finalCode,
      description: "",
      category,
      status,
      priority,
      startDate: status === "Planning" ? startDate : new Date().toISOString().split("T")[0],
      deadline: deadline || (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split("T")[0];
      })(),
      budget: budget || "₹50,000",
      projectManagerId: selectedPmId || currentUser.id,
      teamLeadId: selectedLeadId || currentUser.id,
      teamMemberIds: selectedMemberIds,
      techStack: selectedTechStack,
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

          {/* Technology Stack FIRST */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[12px] font-semibold text-slate-700">
                Technology Stack <span className="text-[#de2d1d]">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedTechStack.length} selected
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-36 overflow-y-auto">
              {techStacks.length === 0 ? (
                <p className="text-[12px] text-slate-400">No tech stacks configured yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {techStacks.map((tech: TechStackItem) => {
                    const isSelected = selectedTechStack.includes(tech.name);
                    return (
                      <button
                        type="button"
                        key={tech.id}
                        onClick={() => {
                          setSelectedTechStack((prev) =>
                            isSelected ? prev.filter((t) => t !== tech.name) : [...prev, tech.name]
                          );
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0084d4] text-white shadow-2xs border border-[#0084d4]"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <span>{isSelected ? "✓" : "+"}</span>
                        <span>{tech.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Add Other Tech Stack Input */}
            <div className="mt-2 flex items-center gap-2.5 w-full">
              <input
                type="text"
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomTech();
                  }
                }}
                placeholder="Add other tech stack (e.g. Redis, Vue.js, Go)..."
                className="flex-1 w-full px-3.5 py-2.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleAddCustomTech}
                disabled={!customTechInput.trim() || isAddingTech}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold text-white bg-[#0084d4] hover:bg-[#0277bd] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingTech ? "Adding..." : "Add"}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Category & Status (BELOW Technology Stack) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Project Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Planning" | "In Progress" | "In Review" | "Completed")}
                className="w-full px-3.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Row 3: Priority & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "High" | "Medium" | "Low")}
                className="w-full px-3.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Budget
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="₹50,000"
                className="w-full px-3.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              />
            </div>
          </div>

          {/* Row 4: Target Deadline & (only for Planning) Planned Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {status === "Planning" ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-semibold text-slate-700">
                      Planned Start Date <span className="text-[#de2d1d]">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Required for Planning
                    </span>
                  </div>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full px-3.5 py-2 text-[12px] bg-white border border-purple-300 focus:border-purple-600 bg-purple-50/20 rounded-lg focus:outline-hidden text-slate-800 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    When is this project planned to start execution?
                  </p>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Target Deadline <span className="text-[#de2d1d]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  Target Deadline <span className="text-[#de2d1d]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-[#de2d1d]/10 border border-[#de2d1d]/30 rounded-lg text-[12px] text-[#de2d1d] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                {projectManagers.length === 0 ? (
                  <option value={currentUser.id}>
                    {currentUser.fullName || "CEO"} (Direct Executive Oversight)
                  </option>
                ) : (
                  projectManagers.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.fullName} (Project Manager)
                    </option>
                  ))
                )}
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
              {employers.length === 0 ? (
                <div className="col-span-full py-4 text-center text-slate-400 text-[12px]">
                  No employers onboarded yet. You can add employers in the Team page and assign them later.
                </div>
              ) : (
                employers.map((emp) => {
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
                          {emp.jobTitle || "Employer"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
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

            {eligibleLeads.length === 0 ? (
              <p className="text-[12px] text-amber-700 font-medium">
                No employers added to roster yet. The team lead will default to you or can be appointed after adding team members.
              </p>
            ) : (
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-white border border-[#ffa500]/40 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:border-[#ffa500] shadow-2xs"
              >
                {eligibleLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.id === currentUser.id ? `${lead.fullName} (You)` : lead.fullName} — {lead.jobTitle || "Employer"}
                  </option>
                ))}
              </select>
            )}
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
