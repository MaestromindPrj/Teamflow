"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import CeoDashboard from "@/components/dashboards/CeoDashboard";
import ProjectManagerDashboard from "@/components/dashboards/ProjectManagerDashboard";
import EmployeeDashboard from "@/components/dashboards/EmployeeDashboard";
import { DashboardSkeleton } from "@/components/Skeletons";

export default function DashboardPage() {
  const { currentUser, hasHydrated } = useTeamFlow();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hasHydrated || !currentUser?.id) {
    return <DashboardSkeleton />;
  }

  const activeRole = currentUser.role;
  const activeFullName = currentUser.fullName;

  const getHeaderInfo = () => {
    switch (activeRole) {
      case "ceo":
        return {
          title: `Welcome Back, ${activeFullName}`,
          subtitle: "Enterprise oversight, cross-project deliverables, and full organization attendance"
        };
      case "project_manager":
        return {
          title: `Welcome Back, ${activeFullName}`,
          subtitle: "Manage projects under your portfolio, assign team leads, and oversee delivery timelines"
        };
      default:
        return {
          title: `Welcome Back, ${activeFullName}`,
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
