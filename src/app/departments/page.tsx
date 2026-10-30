"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Check,
  X,
  Trash2,
  Users,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FolderTree
} from "lucide-react";
import Header from "@/components/Header";
import CreateDepartmentModal from "@/components/CreateDepartmentModal";
import { useTeamFlow } from "@/context/TeamFlowContext";

export default function DepartmentsPage() {
  const { currentUser, users, departments, updateDepartment, deleteDepartment } = useTeamFlow();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";
  const isAuthorized = isCeo || isPm;

  const handleStartEdit = (id: string, name: string) => {
    setEditingDeptId(id);
    setEditingDeptName(name);
  };

  const handleSaveEdit = async (id: string, oldName: string) => {
    const trimmed = editingDeptName.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      setEditingDeptId(null);
      return;
    }

    if (departments.some((d) => d.id !== id && d.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage("A department with this name already exists.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const success = await updateDepartment(id, trimmed, oldName);
    if (success) {
      setEditingDeptId(null);
      setSuccessMessage(`Department updated to "${trimmed}".`);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const memberCount = users.filter((u) => u.department === name).length;
    if (memberCount > 0) {
      if (!confirm(`There are ${memberCount} staff members in "${name}". Are you sure you want to remove this department?`)) {
        return;
      }
    }
    await deleteDepartment(id);
    setSuccessMessage(`Department "${name}" removed.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs"
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
        subtitle="Configure organizational job roles used when onboarding and categorizing employers"
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

        {/* Existing Departments Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-slate-500" />
              <span>Active Job Roles ({departments.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Job Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const assignedMembers = users.filter((u) => u.department === dept.name);
              const isEditing = editingDeptId === dept.id;

              return (
                <div
                  key={dept.id}
                  className="bg-white border border-slate-200/90 rounded-lg p-4.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3.5"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      {isEditing ? (
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingDeptName}
                              onChange={(e) => setEditingDeptName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(dept.id, dept.name);
                                if (e.key === "Escape") setEditingDeptId(null);
                              }}
                              autoFocus
                              className="w-full px-2.5 py-1 text-[13px] bg-white border border-[#0084d4] rounded-md focus:outline-hidden text-slate-900 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(dept.id, dept.name)}
                              className="p-1.5 rounded-md bg-[#0084d4] hover:bg-[#0277bd] text-white transition-colors cursor-pointer shrink-0"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDeptId(null)}
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
                            {dept.name}
                          </h4>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(dept.id, dept.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0084d4] hover:bg-sky-50 transition-colors cursor-pointer"
                            title={`Edit ${dept.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(dept.id, dept.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Remove ${dept.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Staff Preview */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {assignedMembers.slice(0, 3).map((member) => (
                        <img
                          key={member.id}
                          src={member.avatar}
                          alt={member.fullName}
                          title={`${member.fullName} (${member.department})`}
                          className="w-6 h-6 rounded-full object-cover border-2 border-white ring-1 ring-slate-200"
                        />
                      ))}
                    </div>
                    {assignedMembers.length > 3 && (
                      <span className="text-[11px] font-semibold text-slate-500">
                        +{assignedMembers.length - 3} more
                      </span>
                    )}
                    {assignedMembers.length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">No employers assigned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CreateDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(name) => {
          setSuccessMessage(`Department "${name}" created successfully.`);
          setTimeout(() => setSuccessMessage(""), 3000);
        }}
      />
    </div>
  );
}

