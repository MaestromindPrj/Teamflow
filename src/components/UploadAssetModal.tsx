"use client";

import { useState, useRef, useMemo } from "react";
import {
  X,
  UploadCloud,
  FolderKanban,
  FileText,
  Image as ImageIcon,
  Archive,
  CheckCircle2,
  Paperclip,
  Plus,
  AlertCircle,
  Ban
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

interface UploadAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedFileItem {
  id: string;
  file: File;
  name: string;
  size: string;
  type: "image" | "pdf" | "figma" | "zip" | "doc";
  isDuplicate: boolean;
  duplicateReason?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ALLOWED_EXTS = ["doc", "docx", "pdf", "fig", "png", "jpeg", "jpg"];

function detectFileType(fileName: string, mimeType?: string): "image" | "pdf" | "figma" | "doc" {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg"].includes(ext || "") || mimeType?.startsWith("image/")) {
    return "image";
  }
  if (ext === "pdf" || mimeType === "application/pdf") {
    return "pdf";
  }
  if (ext === "fig") {
    return "figma";
  }
  return "doc";
}

export default function UploadAssetModal({ isOpen, onClose }: UploadAssetModalProps) {
  const { currentUser, projects, tasks, uploadTaskMedia, uploadProjectMedia } = useTeamFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPm = currentUser.role === "project_manager";
  const isEmployer = currentUser.role === "employer";

  const availableProjects = useMemo(() => {
    return isEmployer
      ? projects.filter((p) => p.teamMemberIds.includes(currentUser.id) || p.teamLeadId === currentUser.id)
      : projects;
  }, [projects, currentUser, isEmployer]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    availableProjects[0]?.id || ""
  );

  const projectTasks = useMemo(() => {
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    projectTasks[0]?.id || ""
  );

  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteName, setRemoteName] = useState("");
  const [remoteType, setRemoteType] = useState<"image" | "pdf" | "figma" | "zip" | "doc">("doc");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const existingProjectFileNames = useMemo(() => {
    const names = new Set<string>();
    projectTasks.forEach((t) => {
      (t.attachments || []).forEach((att) => {
        if (att.name) names.add(att.name.trim().toLowerCase());
      });
    });
    return names;
  }, [projectTasks]);

  if (!isOpen) return null;

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    const projTasks = tasks.filter((t) => t.projectId === projId);
    setSelectedTaskId(projTasks[0]?.id || "");
    const otherTasks = tasks.filter((t) => t.projectId === projId);
    const names = new Set<string>();
    otherTasks.forEach((t) => {
      (t.attachments || []).forEach((att) => {
        if (att.name) names.add(att.name.trim().toLowerCase());
      });
    });
    const seen = new Set<string>();
    setSelectedFiles((prev) =>
      prev.map((f) => {
        const lower = f.name.trim().toLowerCase();
        if (names.has(lower)) {
          return { ...f, isDuplicate: true, duplicateReason: "Already uploaded to this project" };
        }
        if (seen.has(lower)) {
          return { ...f, isDuplicate: true, duplicateReason: "Duplicate in selected files" };
        }
        seen.add(lower);
        return { ...f, isDuplicate: false, duplicateReason: undefined };
      })
    );
  };

  const handleFilesAdd = (filesList: FileList | File[] | null) => {
    if (!filesList || filesList.length === 0) return;
    setErrorMessage("");

    const invalidFiles: string[] = [];
    const validFilesList: File[] = [];

    Array.from(filesList).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTS.includes(ext)) {
        invalidFiles.push(file.name);
      } else {
        validFilesList.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setErrorMessage(`Disallowed file: ${invalidFiles.join(", ")}. Only .doc, .docx, .pdf, .fig, .png, and .jpeg files are allowed.`);
    }

    if (validFilesList.length === 0) return;

    const newItems: SelectedFileItem[] = [];
    const currentBatchNames = new Set(selectedFiles.map((f) => f.name.trim().toLowerCase()));

    validFilesList.forEach((file) => {
      const lower = file.name.trim().toLowerCase();
      let isDup = false;
      let dupReason = "";

      if (existingProjectFileNames.has(lower)) {
        isDup = true;
        dupReason = "Already uploaded to this project";
      } else if (currentBatchNames.has(lower)) {
        isDup = true;
        dupReason = "Duplicate in selected files";
      }

      currentBatchNames.add(lower);
      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: detectFileType(file.name, file.type),
        isDuplicate: isDup,
        duplicateReason: dupReason
      });
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      const seen = new Set<string>();
      return updated.map((f) => {
        const lower = f.name.trim().toLowerCase();
        if (existingProjectFileNames.has(lower)) {
          return { ...f, isDuplicate: true, duplicateReason: "Already uploaded to this project" };
        }
        if (seen.has(lower)) {
          return { ...f, isDuplicate: true, duplicateReason: "Duplicate in selected files" };
        }
        seen.add(lower);
        return { ...f, isDuplicate: false, duplicateReason: undefined };
      });
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFilesAdd(e.dataTransfer.files);
    }
  };

  const validFilesToUpload = selectedFiles.filter((f) => !f.isDuplicate);
  const duplicateFilesCount = selectedFiles.filter((f) => f.isDuplicate).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (validFilesToUpload.length === 0 && !remoteUrl.trim()) {
      if (duplicateFilesCount > 0) {
        setErrorMessage("All selected files are duplicates already present in this project.");
      } else {
        setErrorMessage("Please select at least one file or enter an asset link.");
      }
      return;
    }

    setIsUploading(true);

    try {
      let uploadedCount = 0;
      const skippedDupes: string[] = [];

      for (let i = 0; i < validFilesToUpload.length; i++) {
        const item = validFilesToUpload[i];
        setUploadProgress(`Uploading ${i + 1} of ${validFilesToUpload.length}: ${item.name}...`);

        const res = selectedTaskId
          ? await uploadTaskMedia(selectedTaskId, {
              name: item.name,
              size: item.size,
              type: item.type,
              url: URL.createObjectURL(item.file),
              rawFile: item.file
            })
          : await uploadProjectMedia(selectedProjectId, {
              name: item.name,
              size: item.size,
              type: item.type,
              url: URL.createObjectURL(item.file),
              rawFile: item.file
            });

        if (res?.isDuplicate) {
          skippedDupes.push(item.name);
        } else if (res?.success) {
          uploadedCount++;
        }
      }

      if (remoteUrl.trim() && remoteName.trim()) {
        const lowerRemote = remoteName.trim().toLowerCase();
        if (existingProjectFileNames.has(lowerRemote)) {
          skippedDupes.push(remoteName.trim());
        } else {
          setUploadProgress("Attaching external link...");
          const res = selectedTaskId
            ? await uploadTaskMedia(selectedTaskId, {
                name: remoteName.trim(),
                size: "External Link",
                type: remoteType,
                url: remoteUrl.trim(),
                rawFile: null
              })
            : await uploadProjectMedia(selectedProjectId, {
                name: remoteName.trim(),
                size: "External Link",
                type: remoteType,
                url: remoteUrl.trim(),
                rawFile: null
              });
          if (res?.isDuplicate) {
            skippedDupes.push(remoteName.trim());
          } else if (res?.success) {
            uploadedCount++;
          }
        }
      }

      if (skippedDupes.length > 0 && uploadedCount === 0) {
        setErrorMessage(`Skipped duplicate file(s): ${skippedDupes.join(", ")}`);
        setIsUploading(false);
        return;
      }

      setSuccessMessage(
        `Successfully uploaded ${uploadedCount} deliverable${uploadedCount !== 1 ? "s" : ""}!` +
          (skippedDupes.length > 0 ? ` (Skipped ${skippedDupes.length} duplicate${skippedDupes.length !== 1 ? "s" : ""})` : "")
      );

      setTimeout(() => {
        setIsUploading(false);
        setSelectedFiles([]);
        setRemoteUrl("");
        setRemoteName("");
        onClose();
      }, 700);
    } catch {
      setErrorMessage("An error occurred while uploading. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                Upload Project Deliverable &bull; Media
              </h2>
              <p className="text-[12px] text-slate-400">
                Attach prototypes, documentation, build packages, or design assets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-[#de2d1d] text-[12px] animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-700 text-[12px] animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Select Project *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
                required
              >
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Target Project Task
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
              >
                <option value="">General Project Deliverable (No Task)</option>
                {projectTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Task: {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".doc,.docx,.pdf,.fig,.png,.jpeg,.jpg"
            onChange={(e) => handleFilesAdd(e.target.files)}
            className="hidden"
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[12px] font-semibold text-slate-700">
                Upload Media / Files
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Multiple files supported &bull; Duplicate files auto-blocked
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-200 hover:border-[#0084d4] bg-slate-50/60 hover:bg-sky-50/20 rounded-lg p-5 text-center cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-2xs text-[#0084d4] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-bold text-slate-800">
                Choose files or drag & drop here
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Allowed formats: .doc, .pdf, .fig, .docx, .png, .jpeg only
              </p>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-slate-700">
                  Selected Files ({selectedFiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-semibold text-[#0084d4] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add more</span>
                </button>
              </div>

              {duplicateFilesCount > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    {duplicateFilesCount} duplicate file{duplicateFilesCount !== 1 ? "s" : ""} detected in this project. Same files cannot be uploaded twice to save storage. Duplicates will be skipped.
                  </span>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      item.isDuplicate
                        ? "bg-rose-50/60 border-rose-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs ${
                          item.isDuplicate
                            ? "bg-rose-100 text-rose-600"
                            : "bg-sky-50 text-[#0084d4]"
                        }`}
                      >
                        {item.type === "image" ? (
                          <ImageIcon className="w-3.5 h-3.5" />
                        ) : item.type === "zip" ? (
                          <Archive className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-slate-900 truncate max-w-[280px]">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {item.size} &bull; {item.type.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.isDuplicate ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-[#de2d1d] flex items-center gap-1">
                          <Ban className="w-3 h-3" />
                          <span>Duplicate</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ready</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item.id)}
                        disabled={isUploading}
                        className="text-slate-400 hover:text-[#de2d1d] p-1 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Or Attach External Link (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={remoteName}
                onChange={(e) => setRemoteName(e.target.value)}
                placeholder="Link Title (e.g. Design Specs)"
                className="w-full px-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
              />
              <select
                value={remoteType}
                onChange={(e) => setRemoteType(e.target.value as "image" | "pdf" | "figma" | "zip" | "doc")}
                className="w-full px-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
              >
                <option value="figma">Figma File (.fig)</option>
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="image">Image Asset</option>
                <option value="zip">Archive / ZIP</option>
                <option value="doc">Document (.doc, .docx)</option>
              </select>
            </div>
            <input
              type="text"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="https://... (or leave blank when uploading device files)"
              className="w-full px-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
            />
          </div>

          {isUploading && (
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-[#0084d4] border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-[12px] font-semibold text-[#0084d4] truncate">
                {uploadProgress || "Uploading files..."}
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || (validFilesToUpload.length === 0 && !remoteUrl.trim())}
              className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] disabled:opacity-50 text-white text-[12px] font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {isUploading
                  ? "Uploading..."
                  : `Upload ${validFilesToUpload.length > 0 ? `${validFilesToUpload.length} File${validFilesToUpload.length !== 1 ? "s" : ""}` : "Deliverable"}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
