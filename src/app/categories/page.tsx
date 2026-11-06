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
  Layers,
  FolderKanban
} from "lucide-react";
import Header from "@/components/Header";
import CreateCategoryModal from "@/components/CreateCategoryModal";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { CardGridSkeleton } from "@/components/Skeletons";

export default function CategoriesPage() {
  const { currentUser, users, projects, categories, updateCategory, deleteCategory, hasHydrated } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingCatDesc, setEditingCatDesc] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const effectiveUser = currentUser.id ? currentUser : (users[0] || currentUser);
  const isCeo = effectiveUser.role === "ceo";
  const isPm = effectiveUser.role === "project_manager";
  const isAuthorized = isCeo || isPm;

  const handleStartEdit = (id: string, name: string, description: string = "") => {
    setEditingCatId(id);
    setEditingCatName(name);
    setEditingCatDesc(description);
  };

  const handleSaveEdit = async (id: string, oldName: string) => {
    const trimmedName = editingCatName.trim();
    if (!trimmedName) return;

    if (categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setErrorMessage("A category with this name already exists.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const success = await updateCategory(id, trimmedName, oldName, editingCatDesc.trim());
    if (success) {
      setEditingCatId(null);
      setSuccessMessage(`Category updated to "${trimmedName}".`);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const projectCount = projects.filter((p) => (p.category || "").toLowerCase() === name.toLowerCase()).length;
    if (projectCount > 0) {
      if (!confirm(`There are ${projectCount} project(s) assigned to "${name}". Are you sure you want to remove this category?`)) {
        return;
      }
    }
    await deleteCategory(id);
    setSuccessMessage(`Category "${name}" removed.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  if (!mounted || !hasHydrated) {
    return (
      <CardGridSkeleton
        title="Project Categories"
        subtitle="Loading organizational categories..."
        cardCount={6}
      />
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header
          title="Project Categories"
          subtitle="Organizational delivery categories configuration"
        />
        <div className="px-7 py-12 max-w-xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
            Restricted Access
          </h2>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Project categories are reserved for the Chief Executive Officer and Project Managers to organize delivery pipelines.
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
        title="Project Categories"
        subtitle="Configure organizational categories used to categorize projects, milestones, and deliverables"
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
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Active Project Categories ({categories.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categories.map((cat) => {
              const assignedProjects = projects.filter(
                (p) => (p.category || "").toLowerCase() === cat.name.toLowerCase()
              );
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      {isEditing ? (
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(cat.id, cat.name);
                                if (e.key === "Escape") setEditingCatId(null);
                              }}
                              autoFocus
                              placeholder="Category name..."
                              className="w-full px-2.5 py-1 text-[13px] bg-white border border-[#0084d4] rounded-md focus:outline-hidden text-slate-900 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(cat.id, cat.name)}
                              className="p-1.5 rounded-md bg-[#0084d4] hover:bg-[#0277bd] text-white transition-colors cursor-pointer shrink-0"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[14px] font-bold text-slate-900 truncate flex items-center gap-2">
                            <span>{cat.name}</span>
                          </h4>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat.id, cat.name, cat.description)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0084d4] hover:bg-sky-50 transition-colors cursor-pointer"
                            title={`Edit ${cat.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Remove ${cat.name}`}
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
                        <span>{assignedProjects.length} Project{assignedProjects.length === 1 ? "" : "s"}</span>
                      </span>
                    </div>

                    {assignedProjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedProjects.slice(0, 3).map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            title={p.name}
                          >
                            {p.code}
                          </span>
                        ))}
                        {assignedProjects.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium self-center">
                            +{assignedProjects.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic block">
                        No projects currently in this category
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CreateCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(name) => {
          setSuccessMessage(`Category "${name}" created successfully.`);
          setTimeout(() => setSuccessMessage(""), 3000);
        }}
      />
    </div>
  );
}
