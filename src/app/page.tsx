"use client";

import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import CeoDashboard from "@/components/dashboards/CeoDashboard";
import ProjectManagerDashboard from "@/components/dashboards/ProjectManagerDashboard";
import EmployerDashboard from "@/components/dashboards/EmployerDashboard";

export default function DashboardPage() {
  const { currentUser } = useTeamFlow();

  const getHeaderInfo = () => {
    switch (currentUser.role) {
      case "ceo":
        return {
          title: `Executive Command • ${currentUser.fullName}`,
          subtitle: "Enterprise oversight, cross-project deliverables, and full organization attendance"
        };
      case "project_manager":
        return {
          title: `Project Operations • ${currentUser.fullName}`,
          subtitle: "Manage projects under your portfolio, assign team leads, and oversee delivery timelines"
        };
      default:
        return {
          title: `Employer Workspace • ${currentUser.fullName}`,
          subtitle: "Assigned tasks, deadlines, and media deliverables"
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header title={headerInfo.title} subtitle={headerInfo.subtitle} />

      <main className="flex-1">
        {currentUser.role === "ceo" && <CeoDashboard />}
        {currentUser.role === "project_manager" && <ProjectManagerDashboard />}
        {currentUser.role === "employer" && <EmployerDashboard />}
      </main>
    </div>
  );
}
