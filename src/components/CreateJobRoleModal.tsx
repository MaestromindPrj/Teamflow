"use client";

import { useState, useEffect } from "react";
import { X, Briefcase, Plus, AlertCircle } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

interface CreateJobRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (name: string) => void;
}

export default function CreateJobRoleModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateJobRoleModalProps) {
  const { jobRoles, createJobRole } = useTeamFlow();
  const [roleName, setRoleName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setRoleName("");
        setErrorMessage("");
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmed = roleName.trim();
    if (!trimmed) {
      setErrorMessage("Please enter a job role name.");
      return;
    }

    if (
      jobRoles.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setErrorMessage("A job role with this name already exists.");
      return;
    }

    setIsSubmitting(true);
    const success = await createJobRole(trimmed);
    setIsSubmitting(false);

    if (success) {
      if (onSuccess) onSuccess(trimmed);
      setRoleName("");
      setErrorMessage("");
      onClose();
    } else {
      setErrorMessage("Failed to create job role. Please try again.");
    }
  };

  const handleClose = () => {
    setRoleName("");
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                Add New Job Role
              </h2>
              <p className="text-[12px] text-slate-400">
                Define a new organizational role for onboarding team members
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[12px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Job Role Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Cloud Architect, QA Engineer, Product Designer"
              autoFocus
              className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] focus:bg-white text-slate-900 transition-colors font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !roleName.trim()}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Creating..." : "Create Job Role"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

