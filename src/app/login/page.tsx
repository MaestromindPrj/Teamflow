"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Network,
  Sparkles
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useTeamFlow();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const [quickUsers, setQuickUsers] = useState<
    Array<{ name: string; email: string; role: string; roleColor: string }>
  >([
    { name: "Elena Rostova", email: "elena.rostova@maestrominds.co.in", role: "CEO", roleColor: "bg-purple-500" },
    { name: "Marcus Vance", email: "marcus.vance@maestrominds.co.in", role: "Project Manager", roleColor: "bg-blue-500" },
    { name: "Ajay Shanmugam", email: "ajay@maestrominds.co.in", role: "UI/UX Designer", roleColor: "bg-emerald-500" },
  ]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.users) && data.users.length > 0) {
          const ceo = data.users.find((u: { role: string }) => u.role === "ceo");
          const pm = data.users.find((u: { role: string }) => u.role === "project_manager");
          const emp = data.users.find((u: { role: string }) => u.role === "employer");
          const mapped: Array<{ name: string; email: string; role: string; roleColor: string }> = [];
          if (ceo) mapped.push({ name: ceo.fullName || ceo.name, email: ceo.email, role: "CEO", roleColor: "bg-purple-500" });
          if (pm) mapped.push({ name: pm.fullName || pm.name, email: pm.email, role: pm.jobTitle || "Project Manager", roleColor: "bg-blue-500" });
          if (emp) mapped.push({ name: emp.fullName || emp.name, email: emp.email, role: emp.jobTitle || "Employer", roleColor: "bg-emerald-500" });
          if (mapped.length > 0) setQuickUsers(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your company email address or username.");
      return;
    }
    if (!trimmedPass) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(trimmedEmail, trimmedPass);
    setIsSubmitting(false);

    if (result.success) {
      router.push("/");
    } else {
      setErrorMessage(result.error || "Authentication failed. Please verify credentials.");
    }
  };

  const handleQuickFill = (quickEmail: string, quickPass: string = "Maestro@2026!") => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0084d4] text-white shadow-md shadow-sky-500/20 mb-1">
          <Network className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">TeamFlow</h1>
        <p className="text-[13px] text-slate-500 font-medium">
          MaestroMinds Enterprise Operations &amp; Delivery Suite
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/90 sm:px-8 space-y-6">
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Enter your <span className="font-semibold text-slate-700">@maestrominds.co.in</span> credentials
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Company Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ajay@maestrominds.co.in"
                  className="w-full pl-10 pr-3.5 py-2.5 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 shadow-2xs font-medium"
                />
              </div>
              
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[12px] font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-[#0084d4] hover:text-[#0277bd] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[13px] font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Role Credentials</span>
              </span>
              
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
              {quickUsers.map((qu) => (
                <button
                  key={qu.email}
                  type="button"
                  onClick={() => handleQuickFill(qu.email)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${qu.roleColor} shrink-0`} />
                    <span className="font-semibold text-slate-800">{qu.name}</span>
                    <span className="text-slate-400 text-[10px]">{qu.role}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono group-hover:text-[#0084d4]">Select &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={email}
      />
    </div>
  );
}

