"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Mail,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
}: ForgotPasswordModalProps) {
  const router = useRouter();
  const { setCurrentUserId } = useTeamFlow();

  const [step, setStep] = useState<"email" | "otp" | "password" | "success">("email");
  const [email, setEmail] = useState(initialEmail);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep("email");
      setEmail(initialEmail);
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage(null);
      setSuccessMessage(null);
      setResendCountdown(0);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setMaskedEmail(data.maskedEmail || cleanEmail);
      setStep("otp");
      setResendCountdown(45);
      setSuccessMessage("Verification code sent to your inbox.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: cleanCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid or expired verification code.");
      }

      setStep("password");
      setSuccessMessage("Code verified. Please set your new password.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code.");
      }

      setResendCountdown(45);
      setSuccessMessage("A fresh 6-digit code was sent to your email.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      if (data.user?.id) {
        setCurrentUserId(data.user.id);
      }

      setStep("success");
      setTimeout(() => {
        onClose();
        router.push("/");
      }, 2000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Reset Password
              </h2>
              <p className="text-[11px] text-slate-400">
                Email Verification Code
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span className={step === "email" ? "font-bold text-[#0084d4]" : "text-slate-500"}>
            1. Email
          </span>
          <span className="w-6 h-px bg-slate-200" />
          <span className={step === "otp" ? "font-bold text-[#0084d4]" : "text-slate-500"}>
            2. Verify Code
          </span>
          <span className="w-6 h-px bg-slate-200" />
          <span className={step === "password" || step === "success" ? "font-bold text-[#0084d4]" : "text-slate-500"}>
            3. New Password
          </span>
        </div>

        <div className="px-6 pt-3 space-y-2">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && step !== "success" && (
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-[12px] text-[#0084d4] flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#0084d4] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {step === "email" && (
          <form onSubmit={handleSendCode} className="p-6 space-y-4">
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
              <p className="text-[11px] text-slate-400 mt-1.5">
                We will send a secure 6-digit verification code to your email address.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[12px] font-semibold text-slate-700">
                  6-Digit Verification Code
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Sent to {maskedEmail}
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center py-3 text-[22px] tracking-[10px] font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] focus:bg-white text-slate-900 shadow-2xs"
              />
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-slate-400">Valid for 10 minutes</span>
                {resendCountdown > 0 ? (
                  <span className="text-slate-400">
                    Resend code in <strong className="text-slate-600">{resendCountdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-[#0084d4] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-100 text-[11px] text-slate-600 space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Mail className="w-3.5 h-3.5 text-[#0084d4]" />
                <span>Verification sent to {maskedEmail}</span>
              </p>
              <p className="text-slate-500 leading-relaxed">
                Please check your inbox &amp; spam folder for your 6-digit verification code.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-[12px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                &larr; Change Email
              </button>
              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="p-6 space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  autoFocus
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900 shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Update Password &amp; Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-900">
              Password Updated Successfully!
            </h3>
            <p className="text-[13px] text-slate-500">
              Your credentials have been securely updated. Redirecting you to your workspace...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
