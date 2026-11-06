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
  Briefcase
} from "lucide-react";
import Header from "@/components/Header";
import CreateJobRoleModal from "@/components/CreateJobRoleModal";
import { useTeamFlow } from "@/context/TeamFlowContext";
import UserAvatar from "@/components/UserAvatar";
import { CardGridSkeleton } from "@/components/Skeletons";

export default function JobRolesPage() {
  const { currentUser, users, jobRoles, updateJobRole, deleteJobRole, hasHydrated } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";
  const isAuthorized = isCeo || isPm;

  const handleStartEdit = (id: string, name: string) => {
    setEditingRoleId(id);
    setEditingRoleName(name);
  };

  const handleSaveEdit = async (id: string, oldName: string) => {
    const trimmed = editingRoleName.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      setEditingRoleId(null);
      return;
    }

    if (jobRoles.some((r) => r.id !== id && r.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage("A job role with this name already exists.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const success = await updateJobRole(id, trimmed, oldName);
    if (success) {
      setEditingRoleId(null);
      setSuccessMessage(`Job role updated to "${trimmed}".`);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const memberCount = users.filter((u) => (u.jobTitle || "").toLowerCase() === name.toLowerCase()).length;
    if (memberCount > 0) {
      if (!confirm(`There are ${memberCount} team members with the "${name}" role. Are you sure you want to remove this job role?`)) {
        return;
      }
    }
    await deleteJobRole(id);
    setSuccessMessage(`Job role "${name}" removed.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  if (!mounted || !hasHydrated || !currentUser.id) {
    return (
      <CardGridSkeleton
        title="Job Roles"
        subtitle="Loading organizational roles..."
        cardCount={6}
      />
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header
          title="Job Roles"
          subtitle="Organizational job roles configuration"
        />
        <div className="px-7 py-12 max-w-xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
            Restricted Access
          </h2>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Job role configuration is exclusively managed by the Chief Executive Officer and Project Managers.
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
        title="Job Role Management"
        subtitle="Configure organizational job roles used when onboarding and categorizing team members"
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
              <Briefcase className="w-4 h-4 text-slate-500" />
              <span>Active Job Roles ({jobRoles.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Job Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobRoles.map((role) => {
              const assignedMembers = users.filter(
                (u) => (u.jobTitle || "").toLowerCase() === role.name.toLowerCase()
              );
              const isEditing = editingRoleId === role.id;

              return (
                <div
                  key={role.id}
                  className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      {isEditing ? (
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingRoleName}
                              onChange={(e) => setEditingRoleName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(role.id, role.name);
                                if (e.key === "Escape") setEditingRoleId(null);
                              }}
                              autoFocus
                              className="w-full px-2.5 py-1 text-[13px] bg-white border border-[#0084d4] rounded-md focus:outline-hidden text-slate-900 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(role.id, role.name)}
                              className="p-1.5 rounded-md bg-[#0084d4] hover:bg-[#0277bd] text-white transition-colors cursor-pointer shrink-0"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRoleId(null)}
                              className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[14px] font-bold text-slate-900 truncate">
                            {role.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {assignedMembers.length} team member{assignedMembers.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(role.id, role.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0084d4] hover:bg-sky-50 transition-colors cursor-pointer"
                            title={`Edit ${role.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(role.id, role.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Remove ${role.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {assignedMembers.slice(0, 3).map((member) => (
                        <UserAvatar
                          key={member.id}
                          src={member.avatar}
                          name={member.fullName || member.name}
                          role={member.role}
                          title={`${member.fullName} (${member.jobTitle})`}
                          className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-slate-200"
                        />
                      ))}
                    </div>
                    {assignedMembers.length > 3 && (
                      <span className="text-[11px] font-semibold text-slate-500">
                        +{assignedMembers.length - 3} more
                      </span>
                    )}
                    {assignedMembers.length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">No members assigned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CreateJobRoleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(name) => {
          setSuccessMessage(`Job role "${name}" created successfully.`);
          setTimeout(() => setSuccessMessage(""), 3000);
        }}
      />
    </div>
  );
}

