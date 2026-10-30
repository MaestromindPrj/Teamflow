"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Download, ExternalLink, Archive, FileText, Image as ImageIcon, Search, Filter, Shield, ArrowRight, Plus, UploadCloud } from "lucide-react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import UploadAssetModal from "@/components/UploadAssetModal";
import InPageSubTabs from "@/components/InPageSubTabs";

export default function MediaHubPage() {
  const { currentUser, projects, tasks, isUserTeamLead } = useTeamFlow();
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";

  const allMediaItems = tasks.flatMap((t) => {
    const proj = projects.find((p) => p.id === t.projectId);
    return t.attachments.map((att) => ({
      ...att,
      projectId: t.projectId,
      projectCode: proj?.code || "PROJ",
      projectName: proj?.name || "Unknown Project",
      projectManagerId: proj?.projectManagerId,
      taskTitle: t.title,
      taskAssignedTo: t.assignedTo
    }));
  });

  const visibleMedia = allMediaItems.filter((item) => {
    if (isCeo) return false;
    if (isPm) return item.projectManagerId === currentUser.id;

    const isLeadOnProj = isUserTeamLead(currentUser.id, item.projectId);
    if (isLeadOnProj) return true;
    return item.taskAssignedTo === currentUser.id;
  }).filter((item) => {
    if (selectedType !== "All" && item.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q) ||
        item.taskTitle.toLowerCase().includes(q) ||
        item.uploadedByName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case "figma":
        return <span className="font-bold text-[10px] text-purple-600">FIG</span>;
      case "zip":
        return <Archive className="w-5 h-5 text-[#ffa500]" />;
      case "image":
        return <ImageIcon className="w-5 h-5 text-[#4ade1d]" />;
      default:
        return <FileText className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Deliverables &amp; Asset Vault"
        subtitle={
          isCeo
            ? "Executive Oversight • Media and deliverables are managed directly by project teams"
            : isPm
            ? "Portfolio media vault: All deliverables submitted across your managed projects"
            : "Project deliverables repository for your assigned work and lead projects"
        }
      />

      <div className="px-7 py-6 space-y-6">
        {isCeo ? (
          <div className="bg-white rounded-lg border border-slate-200/90 p-8 text-center max-w-xl mx-auto shadow-2xs space-y-4 my-8">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-200">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
                CEO Deliverables Notice
              </h2>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                As Chief Executive Officer, hands-on media asset uploads and deliverable files are handled by Project Managers and Team Leads within their respective project workspaces.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs"
              >
                <span>Return to Executive Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <InPageSubTabs
              activeTab={selectedType}
              onChange={(type) => setSelectedType(type)}
              tabs={[
                {
                  id: "All",
                  label: "All Assets",
                  icon: <FolderKanban className="w-4 h-4" />,
                  count: visibleMedia.length,
                },
                {
                  id: "figma",
                  label: "Figma UI",
                  icon: <span className="font-bold text-[10px] leading-none">FIG</span>,
                  count: visibleMedia.filter((m) => m.type === "figma").length,
                },
                {
                  id: "pdf",
                  label: "PDF Documents",
                  icon: <FileText className="w-4 h-4" />,
                  count: visibleMedia.filter((m) => m.type === "pdf").length,
                },
                {
                  id: "image",
                  label: "Images",
                  icon: <ImageIcon className="w-4 h-4" />,
                  count: visibleMedia.filter((m) => m.type === "image").length,
                },
                {
                  id: "zip",
                  label: "ZIP Packages",
                  icon: <Archive className="w-4 h-4" />,
                  count: visibleMedia.filter((m) => m.type === "zip").length,
                },
                {
                  id: "doc",
                  label: "Doc Files",
                  icon: <FileText className="w-4 h-4" />,
                  count: visibleMedia.filter((m) => m.type === "doc").length,
                },
              ]}
            />

            <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[12px] text-slate-500">
                {isPm
                  ? "All deliverables and assets submitted across your managed initiatives"
                  : "All deliverables and assets associated with your assigned work and designated leads"}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assets by file, project..."
                    className="pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-56"
                  />
                </div>

                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Asset</span>
                </button>
              </div>
            </div>

            {visibleMedia.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-lg bg-white p-6">
                <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-[15px] font-bold text-slate-800">No media assets found</h3>
                <p className="text-[12px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Attachments can be uploaded directly under tasks within each project view.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleMedia.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white border border-slate-200/90 rounded-lg p-4.5 shadow-2xs hover:border-[#0084d4] transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-[#0084d4] transition-colors">
                              {file.name}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {file.size} &bull; {file.type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                          title="Open asset"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                        <div
                          onClick={() => setSelectedProjectId(file.projectId)}
                          className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer hover:text-[#0084d4]"
                        >
                          <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[9px]">
                            {file.projectCode}
                          </span>
                          <span className="truncate">{file.projectName}</span>
                        </div>
                        <p className="text-slate-500 truncate">
                          Task: <strong className="text-slate-700">{file.taskTitle}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Uploaded by: <strong className="text-slate-700">{file.uploadedByName}</strong></span>
                      <span>{file.uploadedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />

      <UploadAssetModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
