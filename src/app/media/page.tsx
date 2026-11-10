"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FolderKanban,
  Download,
  ExternalLink,
  Archive,
  FileText,
  Image as ImageIcon,
  Search,
  Trash2,
  AlertTriangle,
  UploadCloud,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Send,
  Eye
} from "lucide-react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import UploadAssetModal from "@/components/UploadAssetModal";
import InPageSubTabs from "@/components/InPageSubTabs";
import DeleteMediaConfirmModal from "@/components/DeleteMediaConfirmModal";
import RequestMediaDeletionModal from "@/components/RequestMediaDeletionModal";
import { MediaVaultSkeleton } from "@/components/Skeletons";

function MediaHubContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const {
    currentUser,
    projects,
    tasks,
    isUserTeamLead,
    canUserDeleteMedia,
    deleteTaskMedia,
    deleteProjectMedia,
    mediaDeletionRequests,
    resolveMediaDeletionRequest,
    hasHydrated
  } = useTeamFlow();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [selectedType, setSelectedType] = useState<string>("All");

  useEffect(() => {
    if (tabParam === "requests") {
      setSelectedType("requests");
    }
  }, [tabParam]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{
    taskId: string;
    attachmentId: string;
    fileName: string;
    projectName: string;
    taskTitle: string;
    projectId?: string;
  } | null>(null);

  // Request deletion modal state (for Team Members)
  const [requestTarget, setRequestTarget] = useState<{
    attachmentId: string;
    attachmentName: string;
    taskId: string;
    taskTitle: string;
    projectId: string;
    projectName: string;
    projectCode: string;
  } | null>(null);

  const isCeo = currentUser.role === "ceo";
  const isPm = currentUser.role === "project_manager";

  const allMediaItems = useMemo(() => {
    const projectMediaList = projects.flatMap((p) => {
      return (p.attachments || []).map((att) => ({
        ...att,
        taskId: "",
        projectId: p.id,
        projectCode: p.code || "PROJ",
        projectName: p.name || "Unknown Project",
        projectManagerId: p.projectManagerId,
        teamLeadId: p.teamLeadId,
        taskTitle: "Project Deliverable",
        taskAssignedTo: "",
        isProjectMedia: true
      }));
    });

    const taskMediaList = tasks
      .filter((t) => t.title !== "Project Assets & Deliverables" && t.title !== "Project Deliverables & Assets")
      .flatMap((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        return (t.attachments || []).map((att) => ({
          ...att,
          taskId: t.id,
          projectId: t.projectId,
          projectCode: proj?.code || "PROJ",
          projectName: proj?.name || "Unknown Project",
          projectManagerId: proj?.projectManagerId,
          teamLeadId: proj?.teamLeadId,
          taskTitle: t.title,
          taskAssignedTo: t.assignedTo,
          isProjectMedia: false
        }));
      });

    return [...projectMediaList, ...taskMediaList];
  }, [tasks, projects]);

  // Filter media visible to current user based on roles
  const visibleMedia = useMemo(() => {
    return allMediaItems.filter((item) => {
      // CEO and PM can view all company deliverables
      if (isCeo || isPm) return true;
      // Team Lead can view deliverables for projects they lead
      const isLeadOnProj = isUserTeamLead(currentUser.id, item.projectId);
      if (isLeadOnProj) return true;
      // Team members assigned to the project can view project deliverables
      const proj = projects.find((p) => p.id === item.projectId);
      if (proj && (proj.teamMemberIds.includes(currentUser.id) || proj.teamLeadId === currentUser.id)) return true;
      // Team Member can view deliverables assigned to them or uploaded by them
      return item.taskAssignedTo === currentUser.id || item.uploadedBy === currentUser.id;
    }).filter((item) => {
      if (selectedType !== "All" && selectedType !== "requests" && item.type !== selectedType) {
        return false;
      }
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
  }, [allMediaItems, isCeo, isPm, currentUser.id, isUserTeamLead, selectedType, searchQuery]);

  // Filter deletion requests relevant to current user
  const relevantRequests = useMemo(() => {
    return mediaDeletionRequests.filter((r) => {
      if (isCeo || isPm) return true;
      if (r.teamLeadId === currentUser.id) return true;
      return r.requestedBy === currentUser.id;
    });
  }, [mediaDeletionRequests, isCeo, isPm, currentUser.id]);

  const pendingRequestsCount = useMemo(() => {
    return relevantRequests.filter((r) => r.status === "Pending").length;
  }, [relevantRequests]);

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

  const getPendingRequestForMedia = (attachmentId: string) => {
    return mediaDeletionRequests.find(
      (r) => r.attachmentId === attachmentId && r.status === "Pending"
    );
  };

  if (!mounted || !hasHydrated || !currentUser.id) {
    return <MediaVaultSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Deliverables &amp; Asset Vault"
        subtitle={
          isCeo || isPm
            ? "Enterprise Deliverables • Full deletion authority across all initiatives"
            : "Project Deliverables Vault • Direct deletion for Team Leads, request deletion for Team Members"
        }
      />

      <div className="px-7 py-6 space-y-6">
        <InPageSubTabs
          activeTab={selectedType}
          onChange={(type) => setSelectedType(type)}
          tabs={[
            {
              id: "All",
              label: "All",
              icon: <FolderKanban className="w-4 h-4" />,
              count: allMediaItems.filter((item) => {
                if (isCeo || isPm) return true;
                const isLead = isUserTeamLead(currentUser.id, item.projectId);
                return isLead || item.taskAssignedTo === currentUser.id || item.uploadedBy === currentUser.id;
              }).length,
            },
            {
              id: "figma",
              label: "Figma",
              icon: <span className="font-bold text-[10px] leading-none">FIG</span>,
              count: visibleMedia.filter((m) => m.type === "figma").length,
            },
            {
              id: "pdf",
              label: "PDFs",
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
              label: "ZIPs",
              icon: <Archive className="w-4 h-4" />,
              count: visibleMedia.filter((m) => m.type === "zip").length,
            },
            {
              id: "doc",
              label: "Docs",
              icon: <FileText className="w-4 h-4" />,
              count: visibleMedia.filter((m) => m.type === "doc").length,
            },
            {
              id: "requests",
              label: "Deletion Requests",
              icon: <ShieldAlert className="w-4 h-4" />,
              count: pendingRequestsCount,
            },
          ]}
        />

        {selectedType === "requests" ? (
          /* ================= DELETION REQUESTS QUEUE ================= */
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200/90 p-4.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900">
                  Media Deletion Review Queue
                </h3>
                <p className="text-[12px] text-slate-500">
                  Team members request Team Leads to delete deliverables. Review and approve or decline requests below.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingRequestsCount} Pending Deletion {pendingRequestsCount === 1 ? "Request" : "Requests"}</span>
              </span>
            </div>

            {relevantRequests.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-lg bg-white p-6">
                <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-[15px] font-bold text-slate-800">No media deletion requests</h3>
                <p className="text-[12px] text-slate-400 mt-1 max-w-sm mx-auto">
                  When team members request deletion of deliverables, they will appear here for Team Lead or Manager review.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relevantRequests.map((req) => {
                  const canResolve = canUserDeleteMedia(req.projectId);
                  const isPending = req.status === "Pending";

                  return (
                    <div
                      key={req.id}
                      className={`bg-white border rounded-lg p-4 shadow-2xs space-y-3.5 transition-all ${
                        isPending
                          ? "border-amber-200/90 hover:border-amber-400 bg-amber-50/10"
                          : "border-slate-200 opacity-80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                            {getFileIcon(req.attachmentType || "doc")}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-bold text-slate-900 truncate" title={req.attachmentName}>
                              {req.attachmentName}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {req.projectName} &bull; {req.taskTitle}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            req.status === "Pending"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : req.status === "Approved"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {req.status === "Pending" ? (
                            <>
                              <Clock className="w-2.5 h-2.5" />
                              <span>Pending Review</span>
                            </>
                          ) : req.status === "Approved" ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Deleted (Approved)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-2.5 h-2.5" />
                              <span>Declined</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-[12px] space-y-1.5">
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>
                            Requested by: <strong className="text-slate-800">{req.requestedByName}</strong>
                          </span>
                          <span>{req.requestedAt}</span>
                        </div>
                        <div className="pt-1 border-t border-slate-200/50">
                          <p className="text-slate-700 italic">
                            &ldquo;{req.reason}&rdquo;
                          </p>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-0.5">
                          Assigned Team Lead: <strong className="text-slate-600">{req.teamLeadName}</strong>
                        </div>
                        {req.status !== "Pending" && req.reviewedByName && (
                          <div className="pt-1 border-t border-slate-200/50 text-[11px] text-slate-600">
                            {req.status === "Approved" ? "Accepted" : "Rejected"} by: <strong className="text-slate-800">{req.reviewedByName} {req.reviewedByRole ? `(${req.reviewedByRole})` : ""}</strong> &bull; {req.reviewedAt}
                          </div>
                        )}
                      </div>

                      {isPending && (
                        <div className="pt-1 flex items-center justify-end gap-2">
                          {canResolve ? (
                            <>
                              <button
                                onClick={() => resolveMediaDeletionRequest(req.id, "reject")}
                                className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Decline Request
                              </button>
                              <button
                                onClick={() => resolveMediaDeletionRequest(req.id, "approve")}
                                className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Approve &amp; Delete Deliverable</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                              Awaiting {req.teamLeadName} to review
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ================= MEDIA ASSETS VAULT GRID ================= */
          <>
            <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[12px] text-slate-500">
                {isCeo
                  ? "All company deliverables across all project initiatives • Direct deletion authority enabled"
                  : isPm
                  ? "All deliverables across your managed projects • Direct deletion authority enabled"
                  : "All deliverables for your projects • Team Leads can delete directly, team members can request deletion"}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assets by file, project..."
                    className="h-9 pl-8 pr-3 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 w-56 shadow-2xs"
                  />
                </div>

                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="h-9 px-4 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
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
                  Attachments can be uploaded directly under tasks within each project view or via the Upload button above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleMedia.map((file) => {
                  const canDelete = canUserDeleteMedia(file.projectId);
                  const pendingReq = getPendingRequestForMedia(file.id);

                  return (
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
                              {file.url && !file.url.startsWith("blob:") && file.url !== "#" ? (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[13px] font-bold text-slate-900 hover:text-[#0084d4] transition-colors truncate block hover:underline cursor-pointer"
                                  title={`Open ${file.name}`}
                                >
                                  {file.name}
                                </a>
                              ) : (
                                <h4 className="text-[13px] font-bold text-slate-900 truncate" title={file.name}>
                                  {file.name}
                                </h4>
                              )}
                              <span className="text-[11px] text-slate-400 font-medium">
                                {file.size} &bull; {file.type.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {file.url && !file.url.startsWith("blob:") && file.url !== "#" ? (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Open or download asset"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <span
                                className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg"
                                title="Asset link is unavailable"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </span>
                            )}

                            {canDelete && (
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    taskId: file.taskId,
                                    attachmentId: file.id,
                                    fileName: file.name,
                                    projectName: file.projectName,
                                    taskTitle: file.taskTitle,
                                    projectId: file.projectId,
                                  })
                                }
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete deliverable"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Deletion Request Notice Banner (if pending) */}
                        {pendingReq && (
                          <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">
                                Deletion requested by <strong>{pendingReq.requestedByName}</strong>
                              </span>
                            </div>
                            {canDelete && (
                              <button
                                onClick={() => setSelectedType("requests")}
                                className="text-[10px] font-bold text-amber-900 underline hover:text-amber-950 shrink-0 cursor-pointer"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        )}

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
                        <div className="truncate pr-2">
                          <span>Uploaded by: <strong className="text-slate-700">{file.uploadedByName}</strong></span>
                        </div>

                        {/* Action Buttons: Delete (CEO/PM/TeamLead) or Request Deletion (Team Member) */}
                        <div className="shrink-0 flex items-center gap-2">
                          {canDelete ? (
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  taskId: file.taskId,
                                  attachmentId: file.id,
                                  fileName: file.name,
                                  projectName: file.projectName,
                                  taskTitle: file.taskTitle,
                                  projectId: file.projectId,
                                })
                              }
                              className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          ) : pendingReq ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Requested
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                setRequestTarget({
                                  attachmentId: file.id,
                                  attachmentName: file.name,
                                  taskId: file.taskId,
                                  taskTitle: file.taskTitle,
                                  projectId: file.projectId,
                                  projectName: file.projectName,
                                  projectCode: file.projectCode,
                                })
                              }
                              className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              title="Request designated Team Lead to delete this media"
                            >
                              <Send className="w-3 h-3" />
                              <span>Request Deletion</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <DeleteMediaConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            if (deleteTarget.taskId) {
              await deleteTaskMedia(deleteTarget.taskId, deleteTarget.attachmentId);
            } else if (deleteTarget.projectId) {
              await deleteProjectMedia(deleteTarget.projectId, deleteTarget.attachmentId);
            }
          }
        }}
        fileName={deleteTarget?.fileName || ""}
        projectName={deleteTarget?.projectName || ""}
        taskTitle={deleteTarget?.taskTitle || ""}
      />

      {/* Request Deletion Modal for Team Members */}
      <RequestMediaDeletionModal
        isOpen={Boolean(requestTarget)}
        onClose={() => setRequestTarget(null)}
        mediaItem={requestTarget}
      />

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

export default function MediaHubPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-7 text-slate-400">Loading media library...</div>}>
      <MediaHubContent />
    </Suspense>
  );
}
