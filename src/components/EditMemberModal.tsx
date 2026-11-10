"use client";

import { useState, useEffect } from "react";
import {
  X,
  Pencil,
  Shield,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Briefcase
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { User, DEFAULT_JOB_ROLES } from "@/data/teamflowData";

interface EditMemberModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditMemberModal({ user, isOpen, onClose }: EditMemberModalProps) {
  const { users, jobRoles, departments, updateTeamMember } = useTeamFlow();
  const [activeRoles, setActiveRoles] = useState<{ id: string; name: string }[]>(() => {
    return (jobRoles && jobRoles.length > 0) ? jobRoles : DEFAULT_JOB_ROLES;
  });

  useEffect(() => {
    if (jobRoles && jobRoles.length > 0) {
      setActiveRoles(jobRoles);
    }
  }, [jobRoles]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/job-roles")
        .then((res) => res.json())
        .then((data) => {
          const list = data.jobRoles || data.departments;
          if (Array.isArray(list) && list.length > 0) {
            setActiveRoles(list);
          }
        })
        .catch(() => null);
    }
  }, [isOpen]);

  const availableRoles = activeRoles;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"employee" | "project_manager" | "ceo">("employee");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Sync state whenever selected user changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "employee");
      const matchedRole = availableRoles.find(
        (r) => r.name.toLowerCase() === (user.jobTitle || "").trim().toLowerCase()
      );
      setJobTitle(matchedRole ? matchedRole.name : (user.jobTitle || ""));
      setPhone(user.phone || "");
      setBio(user.bio || "");
      setNewPassword("");
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [user, availableRoles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const normalizedInputEmail = email.trim().toLowerCase();
  const isInvalidDomain = Boolean(
    normalizedInputEmail &&
    normalizedInputEmail.length > 0 &&
    !normalizedInputEmail.endsWith("@maestrominds.co.in")
  );
  const isEmailTaken = users.some(
    (u) => u.id !== user.id && u.email.trim().toLowerCase() === normalizedInputEmail
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Email address is required.");
      return;
    }

    if (!trimmedEmail.endsWith("@maestrominds.co.in")) {
      setErrorMessage("Only @maestrominds.co.in email addresses are accepted.");
      return;
    }

    if (isEmailTaken) {
      setErrorMessage("Another team member already uses this email address.");
      return;
    }

    if (role === "employee" && !jobTitle.trim()) {
      setErrorMessage("Please select a job role.");
      return;
    }

    setIsSubmitting(true);

    const finalJobTitle =
      user.role === "ceo"
        ? "Chief Executive Officer"
        : role === "project_manager"
        ? "Project Manager"
        : jobTitle.trim();

    const updates: Partial<User> & { password?: string } = {
      fullName: trimmedName,
      name: trimmedName,
      email: trimmedEmail,
      role: user.role === "ceo" ? "ceo" : (role as "employee" | "project_manager"),
      jobTitle: finalJobTitle,
      phone: phone.trim(),
      bio: bio.trim(),
    };

    if (newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        setIsSubmitting(false);
        setErrorMessage("New password must be at least 6 characters long.");
        return;
      }
      updates.password = newPassword.trim();
    }

    const result = await updateTeamMember(user.id, updates);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage("Team member details updated successfully!");
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.error || "Failed to update team member. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Edit Team Member
              </h3>
              <p className="text-[11px] text-slate-400">
                Update account details, role &amp; credentials for <span className="font-semibold text-slate-700">{user.fullName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[12px] font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-[#4ade1d]/15 border border-[#4ade1d]/30 text-emerald-800 rounded-lg text-[12px] font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-[#4ade1d] shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Selva Karthik"
                className="w-full pl-9 pr-3.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Company Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@maestrominds.co.in"
                className={`w-full pl-9 pr-3.5 py-2 text-[12px] bg-white border rounded-lg focus:outline-hidden text-slate-900 font-medium ${
                  isEmailTaken || isInvalidDomain
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 focus:border-[#0084d4]"
                }`}
              />
            </div>
            {isInvalidDomain ? (
              <p className="mt-1 text-[11px] text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                Only @maestrominds.co.in email addresses are accepted.
              </p>
            ) : isEmailTaken ? (
              <p className="mt-1 text-[11px] text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                This email address is already in use by another user.
              </p>
            ) : null}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Account Role
            </label>
            {user.role === "ceo" ? (
              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/60 flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-purple-700" />
                <span className="text-[12px] font-bold text-purple-900">Chief Executive Officer (Primary Executive)</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole("employee");
                    if (jobTitle === "Project Manager") {
                      setJobTitle(
                        user.jobTitle && user.jobTitle !== "Project Manager"
                          ? user.jobTitle
                          : ""
                      );
                    }
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    role === "employee"
                      ? "border-[#0084d4] bg-sky-50/50 text-[#0084d4]"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[12px] font-bold">Employee</div>
                    <div className="text-[10px] text-slate-400">Developer, Designer, QA</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole("project_manager");
                    setJobTitle("Project Manager");
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    role === "project_manager"
                      ? "border-purple-500 bg-purple-50/50 text-purple-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[12px] font-bold">Project Manager</div>
                    <div className="text-[10px] text-slate-400">Lead &amp; delivery manager</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Job Role / Title */}
          {role === "employee" ? (
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Assign Job Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  required
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  className={`w-full pl-9 pr-3.5 py-2 text-[12px] bg-white border rounded-lg focus:outline-hidden text-slate-900 font-medium cursor-pointer ${
                    role === "employee" && !jobTitle
                      ? "border-amber-300 focus:border-amber-500"
                      : "border-slate-200 focus:border-[#0084d4]"
                  }`}
                >
                  <option value="">Select job role...</option>
                  {availableRoles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                  {jobTitle && jobTitle !== "Project Manager" && !availableRoles.some((r) => r.name.toLowerCase() === jobTitle.toLowerCase()) && (
                    <option value={jobTitle}>{jobTitle}</option>
                  )}
                </select>
              </div>
            </div>
          ) : role === "project_manager" ? (
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Designation &amp; Role
              </label>
              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/60 flex items-center gap-2.5 text-[12px] text-purple-900">
                <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold">Project Manager</div>
                  <div className="text-[11px] text-purple-700">
                    Project Managers do not have a specialized job role.
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Phone */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Bio / Experience Summary <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="e.g. Full-stack developer with 3+ years experience..."
              className="w-full p-2.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
            />
          </div>

          {/* Reset Password */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Reset Password <span className="text-slate-400 font-normal">(Leave blank to keep existing password)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password to reset..."
                className="w-full pl-9 pr-3.5 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              If entered, this updates the member&apos;s password immediately.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !fullName.trim() ||
                !email.trim() ||
                isEmailTaken ||
                isInvalidDomain ||
                (role === "employee" && !jobTitle.trim())
              }
              className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

