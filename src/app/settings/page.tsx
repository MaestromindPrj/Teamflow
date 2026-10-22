"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Bell, Lock, Globe, Moon, Save } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

export default function SettingsPage() {
  const { currentUser } = useTeamFlow();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [taskAlerts, setTaskAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Settings &amp; Preferences"
        subtitle={`System configuration and alerts for ${currentUser.fullName}`}
      />

      <div className="px-7 py-6 space-y-6 max-w-4xl">
        {saved && (
          <div className="p-3 bg-[#4ade1d]/15 border border-[#4ade1d]/30 text-[#4ade1d] rounded-lg text-[12px] font-medium flex items-center gap-2">
            Preferences saved successfully.
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-[14px]">
            <Bell className="w-4 h-4 text-[#0084d4]" />
            <span>Notification Preferences</span>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between py-2 border-b border-slate-100 cursor-pointer">
              <div>
                <p className="text-[13px] font-semibold text-slate-800">
                  Email Notifications
                </p>
                <p className="text-[11px] text-slate-400">
                  Receive email digest for project milestones, approvals and review requests
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 accent-[#0084d4] rounded"
              />
            </label>

            <label className="flex items-center justify-between py-2 cursor-pointer">
              <div>
                <p className="text-[13px] font-semibold text-slate-800">
                  Task Assignment Alerts
                </p>
                <p className="text-[11px] text-slate-400">
                  Get notified in real-time when new tasks or deliverables are assigned to you
                </p>
              </div>
              <input
                type="checkbox"
                checked={taskAlerts}
                onChange={(e) => setTaskAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#0084d4] rounded"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-[14px]">
            <Lock className="w-4 h-4 text-[#0084d4]" />
            <span>Security &amp; Workspace Environment</span>
          </div>

          <div className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="flex items-center gap-2 text-slate-700 font-normal">
                <Globe className="w-4 h-4 text-slate-400" />
                Language
              </span>
              <span className="font-semibold text-slate-800">English (US)</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="flex items-center gap-2 text-slate-700 font-normal">
                <Moon className="w-4 h-4 text-slate-400" />
                Theme
              </span>
              <span className="font-semibold text-slate-800">Executive Light (Active)</span>
            </div>

            <div className="pt-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
