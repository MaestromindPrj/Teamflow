"use client";

import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Building2,
  Shield,
  UserCheck,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  Mail
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function generateInitialPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const specials = "!@#$%";
  let pwd = "MM-";
  for (let i = 0; i < 4; i++) pwd += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 2; i++) pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
  pwd += specials.charAt(Math.floor(Math.random() * specials.length));
  pwd += letters.charAt(Math.floor(Math.random() * letters.length));
  return pwd;
}

export default function CreateMemberModal({ isOpen, onClose }: CreateMemberModalProps) {
  const { users, jobRoles, departments, addTeamMember } = useTeamFlow();
  const availableRoles = jobRoles && jobRoles.length > 0 ? jobRoles : departments;

  const [fullName, setFullName] = useState("");
  const [emailUsername, setEmailUsername] = useState("");
  const [role, setRole] = useState<"employer" | "project_manager">("employer");
  const [selectedJobRole, setSelectedJobRole] = useState<string>(
    availableRoles[0]?.name || ""
  );

  useEffect(() => {
    if (availableRoles.length > 0 && !selectedJobRole) {
      setSelectedJobRole(availableRoles[0].name);
    }
  }, [availableRoles, selectedJobRole]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const normalizedInputEmail = emailUsername.trim().toLowerCase();
  const computedEmail = normalizedInputEmail.includes("@")
    ? normalizedInputEmail
    : `${normalizedInputEmail}@maestrominds.co.in`;

  const isEmailTaken = Boolean(
    normalizedInputEmail &&
    normalizedInputEmail !== "@maestrominds.co.in" &&
    users.some((u) => u.email.trim().toLowerCase() === computedEmail)
  );

  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    role: string;
    jobTitle: string;
    password: string;
    emailSent?: boolean;
    emailError?: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setFullName("");
        setEmailUsername("");
        setRole("employer");
        setCreatedCredentials(null);
        setErrorMessage("");
        setCopied(false);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyAllCredentials = () => {
    if (!createdCredentials) return;
    const portalUrl = typeof window !== "undefined" && !window.location.origin.includes("localhost")
      ? `${window.location.origin}/login`
      : "https://teamflow-topaz.vercel.app/login";
    const text = `MaestroMinds TeamFlow Account Created:\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nRole: ${createdCredentials.role}\nJob Role: ${createdCredentials.jobTitle}\nInitial Password: ${createdCredentials.password}\nLogin Portal: ${portalUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setFullName("");
    setEmailUsername("");
    setRole("employer");
    setCreatedCredentials(null);
    setErrorMessage("");
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = fullName.trim();
    const rawEmailInput = emailUsername.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage("Please provide the full name.");
      return;
    }
    if (!rawEmailInput) {
      setErrorMessage("Please enter an email address or username.");
      return;
    }

    const companyEmail = rawEmailInput.includes("@")
      ? rawEmailInput
      : `${rawEmailInput}@maestrominds.co.in`;

    if (isEmailTaken || users.some((u) => u.email.trim().toLowerCase() === companyEmail)) {
      setErrorMessage("User already exists with this email address.");
      return;
    }

    const passwordToUse = generateInitialPassword();
    const finalJobTitle = role === "employer" ? (selectedJobRole || "Software Developer") : "Project Manager";

    setIsSubmitting(true);
    try {
      const result = await addTeamMember({
        fullName: trimmedName,
        email: companyEmail,
        role,
        jobTitle: finalJobTitle,
        initialPassword: passwordToUse,
      });

      setIsSubmitting(false);
      setCreatedCredentials({
        name: trimmedName,
        email: companyEmail,
        role: role === "employer" ? "Employer" : "Project Manager",
        jobTitle: finalJobTitle,
        password: passwordToUse,
        emailSent: result?.emailSent,
        emailError: result?.emailError,
      });
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to add team member");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                Add Team Member
              </h2>
              <p className="text-[12px] text-slate-400">
                Onboard a new employer or project manager with initial login credentials
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

        {createdCredentials ? (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="text-[14px] font-bold text-emerald-950 text-left">
                  Team Member Account Created!
                </h3>
              </div>

              {createdCredentials.emailSent ? (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0 flex-1 text-left">
                    <p className="text-[12px] text-emerald-800 font-medium text-left leading-snug">
                      Credentials automatically sent to{" "}
                      <strong className="font-semibold text-emerald-950">{createdCredentials.email}</strong>{" "}
                      via Gmail.
                    </p>
                    <p className="text-[11px] text-emerald-600/90 text-left">
                      (If not visible in Inbox, please check Spam/Junk folder)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-5 shrink-0" />
                  <p className="text-[12px] text-slate-600 text-left">
                    Account is active and ready. Share or copy credentials below.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Login Credentials
                </span>
                <span className="text-[11px] font-semibold text-[#0084d4] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  {createdCredentials.role}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[12px]">
                <span className="text-slate-500 font-medium">Full Name:</span>
                <span className="col-span-2 font-semibold text-slate-900">{createdCredentials.name}</span>

                <span className="text-slate-500 font-medium">Company Email:</span>
                <span className="col-span-2 font-mono font-semibold text-slate-900">{createdCredentials.email}</span>

                <span className="text-slate-500 font-medium">Job Role:</span>
                <span className="col-span-2 font-semibold text-slate-700">{createdCredentials.jobTitle}</span>

                <span className="text-slate-500 font-medium">Temporary Password:</span>
                <span className="col-span-2 font-mono font-bold text-[#0084d4] bg-white px-2 py-1 rounded border border-sky-200 inline-block w-fit">
                  {createdCredentials.password}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCopyAllCredentials}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Credentials"}</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[13px]">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Role Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("employer")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-[13px] font-semibold transition-all cursor-pointer ${
                    role === "employer"
                      ? "bg-sky-50 border-[#0084d4] text-[#0084d4] shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Employer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("project_manager")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-[13px] font-semibold transition-all cursor-pointer ${
                    role === "project_manager"
                      ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Project Manager</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter member's full name"
                className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Work Email Address *
              </label>
              <input
                type="text"
                required
                value={emailUsername}
                onChange={(e) => {
                  setEmailUsername(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="name@maestrominds.co.in or username"
                className={`w-full px-3.5 py-2 text-[13px] bg-white border rounded-lg focus:outline-hidden text-slate-900 shadow-2xs transition-colors ${
                  isEmailTaken
                    ? "border-red-400 focus:border-red-500 ring-1 ring-red-200"
                    : "border-slate-200 focus:border-[#0084d4]"
                }`}
              />
              {isEmailTaken ? (
                <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>User already exists with this email address.</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  Assigned login email:{" "}
                  <span className="font-mono text-slate-600 font-semibold">
                    {emailUsername.trim()
                      ? emailUsername.trim().toLowerCase().includes("@")
                        ? emailUsername.trim().toLowerCase()
                        : `${emailUsername.trim().toLowerCase()}@maestrominds.co.in`
                      : "username@maestrominds.co.in"}
                  </span>
                </p>
              )}
            </div>

            {role === "employer" ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-semibold text-slate-700">
                    Job Role *
                  </label>
                </div>
                <select
                  value={selectedJobRole}
                  onChange={(e) => setSelectedJobRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 font-medium"
                >
                  {availableRoles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[12px] text-blue-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Project Managers oversee project portfolios and manage team leads across the organization.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-[12px] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isEmailTaken}
                className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Onboarding..." : "Add Team Member"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
