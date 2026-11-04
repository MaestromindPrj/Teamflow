"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Check,
  X,
  Trash2,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Cpu,
  FolderKanban
} from "lucide-react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";

export default function TechStacksPage() {
  const {
    currentUser,
    users,
    projects,
    techStacks,
    createTechStack,
    updateTechStack,
    deleteTechStack,
    hasHydrated,
  } = useTeamFlow();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const effectiveUser = currentUser.id ? currentUser : (users[0] || currentUser);
  const isCeo = effectiveUser.role === "ceo";
  const isPm = effectiveUser.role === "project_manager";
  const isAuthorized = isCeo || isPm;

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMessage("Please enter a technology name.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    if (techStacks.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`"${trimmed}" already exists in the tech stack list.`);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setIsAdding(true);
    const ok = await createTechStack(trimmed);
    setIsAdding(false);
    if (ok) {
      setNewName("");
      setSuccessMessage(`"${trimmed}" added to tech stacks.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } else {
      setErrorMessage("Failed to add tech stack. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = async (id: string, oldName: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      setEditingId(null);
      return;
    }
    if (techStacks.some((t) => t.id !== id && t.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`"${trimmed}" already exists.`);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    const ok = await updateTechStack(id, trimmed);
    if (ok) {
      setEditingId(null);
      setSuccessMessage(`Renamed to "${trimmed}".`);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const projectCount = projects.filter((p) =>
      (p.techStack || []).some((t: string) => t.toLowerCase() === name.toLowerCase())
    ).length;
    if (projectCount > 0) {
      if (!confirm(`"${name}" is used in ${projectCount} project(s). Remove it from the catalogue?`)) return;
    } else {
      if (!confirm(`Remove "${name}" from the tech stack catalogue?`)) return;
    }
    const ok = await deleteTechStack(id);
    if (ok) {
      setSuccessMessage(`"${name}" removed.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  if (!mounted || !hasHydrated) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header title="Tech Stack" subtitle="Loading..." />
        <div className="px-7 py-6">
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header
          title="Tech Stack"
          subtitle="Technology catalogue configuration"
        />
        <div className="px-7 py-12 max-w-xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
            Restricted Access
          </h2>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            The technology catalogue is reserved for the Chief Executive Officer and Project Managers to manage technology options for projects.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs"
          >
            <span>Return to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Tech Stack"
        subtitle="Configure technologies available for selection when creating or editing projects"
      />

      <div className="px-7 py-6 space-y-6">
        {successMessage && (
          <div className="p-3 bg-[#4ade1d]/15 border border-[#4ade1d]/30 text-emerald-800 rounded-lg text-[12px] font-medium flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-[#4ade1d] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[12px] font-medium flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span>Technology Catalogue ({techStacks.length})</span>
            </h3>
            {/* Inline add row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New technology (e.g. Redis, Go)…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="h-9 px-3.5 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084d4] placeholder-slate-400 w-64"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isAdding ? "Adding…" : "Add"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {techStacks.map((tech) => {
              const usedInProjects = projects.filter((p) =>
                (p.techStack || []).some((t: string) => t.toLowerCase() === tech.name.toLowerCase())
              );
              const isEditing = editingId === tech.id;

              return (
                <div
                  key={tech.id}
                  className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      {isEditing ? (
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(tech.id, tech.name);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              autoFocus
                              placeholder="Technology name..."
                              className="w-full px-2.5 py-1 text-[13px] bg-white border border-[#0084d4] rounded-md focus:outline-hidden text-slate-900 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(tech.id, tech.name)}
                              className="p-1.5 rounded-md bg-[#0084d4] hover:bg-[#0277bd] text-white transition-colors cursor-pointer shrink-0"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-sky-50 text-[#0084d4] flex items-center justify-center shrink-0">
                            <Cpu className="w-3.5 h-3.5" />
                          </div>
                          <h4 className="text-[14px] font-bold text-slate-900 truncate">
                            {tech.name}
                          </h4>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(tech.id, tech.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0084d4] hover:bg-sky-50 transition-colors cursor-pointer"
                            title={`Edit ${tech.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tech.id, tech.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Remove ${tech.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                        <span>{usedInProjects.length} Project{usedInProjects.length === 1 ? "" : "s"}</span>
                      </span>
                    </div>

                    {usedInProjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {usedInProjects.slice(0, 3).map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            title={p.name}
                          >
                            {p.code}
                          </span>
                        ))}
                        {usedInProjects.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium self-center">
                            +{usedInProjects.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic block">
                        Not used in any project yet
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
