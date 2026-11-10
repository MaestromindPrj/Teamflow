"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import CeoDashboard from "@/components/dashboards/CeoDashboard";
import ProjectManagerDashboard from "@/components/dashboards/ProjectManagerDashboard";
import EmployeeDashboard from "@/components/dashboards/EmployeeDashboard";

export default function DashboardPage() {
  const { currentUser, hasHydrated } = useTeamFlow();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hasHydrated || !currentUser.id) {
    return (
      <div className="flex-1 flex flex-col pb-12" suppressHydrationWarning>
        <Header
          title="Maestrominds Enterprise"
          subtitle="Loading workspace..."
        />
        <main className="flex-1 px-7 py-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-24 bg-slate-100 rounded-lg" />
              <div className="h-24 bg-slate-100 rounded-lg" />
              <div className="h-24 bg-slate-100 rounded-lg" />
              <div className="h-24 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-64 bg-slate-100 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  const activeRole = currentUser.role;
  const activeFullName = currentUser.fullName;

  const getHeaderInfo = () => {
    switch (activeRole) {
      case "ceo":
        return {
          title: `Welcome Back,  ${activeFullName}`,
          subtitle: "Enterprise oversight, cross-project deliverables, and full organization attendance"
        };
      case "project_manager":
        return {
          title: `Welcome Back,  ${activeFullName}`,
          subtitle: "Manage projects under your portfolio, assign team leads, and oversee delivery timelines"
        };
      default:
        return {
          title: `Welcome Back,  ${activeFullName}`,
          subtitle: "Assigned tasks, deadlines, and media deliverables"
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header title={headerInfo.title} subtitle={headerInfo.subtitle} />

      <main className="flex-1">
        {activeRole === "ceo" && <CeoDashboard />}
        {activeRole === "project_manager" && <ProjectManagerDashboard />}
        {activeRole === "employee" && <EmployeeDashboard />}
      </main>
    </div>
  );
}
