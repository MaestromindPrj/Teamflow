"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarRange,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import Header from "@/components/Header";
import { useTeamFlow, getLocalDateString, OfficeLeave } from "@/context/TeamFlowContext";

export default function OfficeLeavesPage() {
  const { currentUser, users, officeLeaves, createOfficeLeave, deleteOfficeLeave, hasHydrated } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const effectiveUser = currentUser.id ? currentUser : (users[0] || currentUser);
  const isCeo = effectiveUser.role === "ceo";
  const isPm = effectiveUser.role === "project_manager";
  const isAuthorized = isCeo || isPm;

  const todayStr = getLocalDateString(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      setErrorMessage("Please provide both Title and Date.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setIsSubmitting(true);
    const success = await createOfficeLeave({
      title: title.trim(),
      date,
      endDate: endDate || date,
    });
    setIsSubmitting(false);

    if (success) {
      setTitle("");
      setDate("");
      setEndDate("");
      setIsModalOpen(false);
      setSuccessMessage(`Company holiday "${title}" declared successfully. It is now highlighted in blue across all dashboards.`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } else {
      setErrorMessage("Failed to add company holiday. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleDelete = async (id: string, holidayTitle: string) => {
    if (!confirm(`Are you sure you want to remove "${holidayTitle}" from company holidays?`)) {
      return;
    }
    await deleteOfficeLeave(id);
    setSuccessMessage(`Company holiday "${holidayTitle}" removed.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  if (!mounted || !hasHydrated) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header title="Company Holidays" subtitle="Loading..." />
        <div className="px-7 py-6">
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col pb-12">
        <Header title="Company Holidays" subtitle="Restricted Access" />
        <div className="px-7 py-8 max-w-xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-[18px] font-bold text-slate-900">Leadership Management Only</h2>
          <p className="text-[13px] text-slate-600">
            Official company holidays and closures are managed exclusively by the CEO and Project Managers. You can view all upcoming company holidays directly on your Dashboard calendar.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0084d4] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0277bd]"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const upcomingLeaves = officeLeaves.filter((l: OfficeLeave) => (l.endDate || l.date) >= todayStr);
  const nextHoliday = upcomingLeaves[0];

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Company Holidays"
        subtitle="Manage official company holidays, festival closures, and declared non-working days across all organization dashboards"
      />

      <div className="px-7 py-6 space-y-6">
        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2.5 text-[13px] shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2.5 text-[13px] shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
              <span>Total Declared Leaves</span>
              <div className="w-7 h-7 rounded-md bg-blue-50 text-[#0084d4] flex items-center justify-center">
                <CalendarRange className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-[26px] font-bold text-slate-900 leading-none">
              {officeLeaves.length}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Official company closures</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs">
            <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
              <span>Next Upcoming Holiday</span>
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-[17px] font-bold text-slate-900 leading-tight truncate">
              {nextHoliday ? nextHoliday.title : "None Scheduled"}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {nextHoliday ? nextHoliday.date : "All upcoming days are workdays"}
            </p>
          </div>
        </div>

        {/* Company Holidays Table Card */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Official Company Holidays & Observances
              </h2>
              <p className="text-[12px] text-slate-500">
                Manage holiday declarations of the organisation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company Holiday</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 pr-4">Holiday / Occasion</th>
                  <th className="py-2.5 px-4">Start Date</th>
                  <th className="py-2.5 px-4">End Date</th>
                  <th className="py-2.5 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {officeLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-[13px]">
                      No company holidays declared yet. Click &quot;Add Company Holiday&quot; above to create one.
                    </td>
                  </tr>
                ) : (
                  officeLeaves.map((item: OfficeLeave) => {
                    const isUpcoming = (item.endDate || item.date) >= todayStr;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pr-4 font-bold text-slate-900 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isUpcoming ? "bg-[#0084d4]" : "bg-slate-300"}`} />
                          <span>{item.title}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[12px] font-semibold text-slate-800">
                          {item.date}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[12px] text-slate-600">
                          {item.endDate || item.date}
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Remove company holiday"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Company Holiday Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0084d4] flex items-center justify-center">
                  <CalendarRange className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 leading-tight">Add Company Holiday</h3>
                  <p className="text-[11px] text-slate-400">Declare an official company holiday or closure</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Holiday / Occasion Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Festival, Christmas, New Year's Day"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0084d4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (!endDate || endDate < e.target.value) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0084d4]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    min={date}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0084d4]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-[12px] font-semibold bg-[#0084d4] hover:bg-[#0277bd] text-white rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Adding..." : "Add Company Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
