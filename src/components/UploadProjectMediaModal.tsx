"use client";

import { useState, useRef, useMemo } from "react";
import {
  X,
  UploadCloud,
  Paperclip,
  Plus,
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Archive,
  Ban
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { Project } from "@/data/teamflowData";

interface UploadProjectMediaModalProps {
  project: Project;
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
  isSizeExceeded?: boolean;
  sizeError?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ALLOWED_EXTS = ["doc", "docx", "pdf", "fig", "png", "jpeg", "jpg"];
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB limit

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

export default function UploadProjectMediaModal({ project, isOpen, onClose }: UploadProjectMediaModalProps) {
  const { tasks, uploadProjectMedia, projects } = useTeamFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === project.id) || project;
  }, [projects, project]);

  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === currentProject.id), [tasks, currentProject.id]);
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
    (currentProject.attachments || []).forEach((att) => {
      if (att.name) names.add(att.name.trim().toLowerCase());
    });
    projectTasks.forEach((t) => {
      (t.attachments || []).forEach((att) => {
        if (att.name) names.add(att.name.trim().toLowerCase());
      });
    });
    return names;
  }, [currentProject.attachments, projectTasks]);

  if (!isOpen) return null;

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
    const oversizedFiles: string[] = [];

    validFilesList.forEach((file) => {
      const lower = file.name.trim().toLowerCase();
      let isDup = false;
      let dupReason = "";
      let isSizeExceeded = false;
      let sizeError = "";

      if (file.size > MAX_FILE_SIZE_BYTES) {
        isSizeExceeded = true;
        sizeError = `File exceeds the 100 MB limit (${formatFileSize(file.size)})`;
        oversizedFiles.push(`"${file.name}" (${formatFileSize(file.size)})`);
      }

      if (existingProjectFileNames.has(lower)) {
        isDup = true;
        dupReason = "Already uploaded to this project";
      } else if (currentBatchNames.has(lower)) {
        isDup = true;
        dupReason = "Duplicate file in current selection";
      }

      currentBatchNames.add(lower);

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: detectFileType(file.name, file.type),
        isDuplicate: isDup,
        duplicateReason: dupReason,
        isSizeExceeded,
        sizeError,
      });
    });

    if (oversizedFiles.length > 0) {
      setErrorMessage(
        `File size exceeds limit: ${oversizedFiles.join(", ")} exceeds the maximum upload limit of 100 MB. Please choose a smaller file or attach as a Remote Link.`
      );
    }

    setSelectedFiles((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      const batchNames = new Set<string>();
      return next.map((item) => {
        const lower = item.name.trim().toLowerCase();
        let isDup = false;
        let dupReason = "";
        if (existingProjectFileNames.has(lower)) {
          isDup = true;
          dupReason = "Already uploaded to this project";
        } else if (batchNames.has(lower)) {
          isDup = true;
          dupReason = "Duplicate file in current selection";
        }
        batchNames.add(lower);
        return { ...item, isDuplicate: isDup, duplicateReason: dupReason };
      });
    });
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setRemoteUrl("");
    setRemoteName("");
    setErrorMessage("");
    setSuccessMessage("");
    setUploadProgress("");
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    resetForm();
    onClose();
  };

  const validFilesToUpload = selectedFiles.filter((f) => !f.isDuplicate && !f.isSizeExceeded);
  const duplicateFilesCount = selectedFiles.filter((f) => f.isDuplicate).length;
  const sizeExceededFilesCount = selectedFiles.filter((f) => f.isSizeExceeded).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (selectedFiles.length === 0 && !remoteUrl.trim()) {
      setErrorMessage("Please select one or more files to upload.");
      return;
    }

    if (selectedFiles.length > 0 && validFilesToUpload.length === 0) {
      if (sizeExceededFilesCount > 0 && duplicateFilesCount === 0) {
        setErrorMessage("All selected files exceed the 100 MB upload limit. Please select files under 100 MB or attach as a Remote Link.");
      } else if (duplicateFilesCount > 0 && sizeExceededFilesCount === 0) {
        setErrorMessage("All selected files are duplicates of files already uploaded to this project.");
      } else {
        setErrorMessage("Selected files cannot be uploaded due to size limits or duplicate filenames.");
      }
      return;
    }

    setIsUploading(true);

    let uploadedCount = 0;
    const errors: string[] = [];

    if (validFilesToUpload.length > 0) {
      for (let i = 0; i < validFilesToUpload.length; i++) {
        const item = validFilesToUpload[i];
        setUploadProgress(`Uploading ${i + 1} of ${validFilesToUpload.length}: ${item.name}...`);

        const res = await uploadProjectMedia(currentProject.id, {
          name: item.name.trim(),
          size: item.size,
          type: item.type,
          rawFile: item.file,
        });

        if (res && res.success) {
          uploadedCount++;
        } else if (res && res.error) {
          errors.push(`${item.name}: ${res.error}`);
        }
      }
    } else if (remoteUrl.trim()) {
      const finalName = remoteName.trim() || "Remote Asset";
      const lower = finalName.toLowerCase();
      if (existingProjectFileNames.has(lower)) {
        setIsUploading(false);
        setErrorMessage(`A file named "${finalName}" is already uploaded to this project.`);
        return;
      }

      setUploadProgress("Linking remote deliverable...");
      const res = await uploadProjectMedia(currentProject.id, {
        name: finalName,
        size: "Remote Link",
        type: remoteType,
        url: remoteUrl.trim(),
        rawFile: null,
      });
      if (res && res.success) uploadedCount++;
      else if (res && res.error) errors.push(res.error);
    }

    setIsUploading(false);

    if (errors.length > 0) {
      setErrorMessage(errors.join(", "));
    } else {
      setSuccessMessage(`${uploadedCount} file${uploadedCount === 1 ? "" : "s"} added to project media!`);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 900);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-600" />;
      case "zip":
        return <Archive className="w-4 h-4 text-amber-600" />;
      case "figma":
        return <span className="font-bold text-[9px] text-purple-600">FIG</span>;
      default:
        return <Paperclip className="w-4 h-4 text-[#0084d4]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Add Project Media &amp; Deliverables
              </h3>
              <p className="text-[11px] text-slate-400">
                Upload documents, designs, and files for <span className="font-semibold text-slate-700">{currentProject.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isUploading}
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[12px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {isUploading && (
            <div className="p-3 bg-sky-50 border border-sky-200 text-[#0084d4] rounded-lg text-[12px] flex items-center gap-2 animate-pulse">
              <UploadCloud className="w-4 h-4 shrink-0 animate-bounce" />
              <span className="font-medium">{uploadProgress}</span>
            </div>
          )}

          <input
            type="file"
            multiple
            accept=".doc,.docx,.pdf,.fig,.png,.jpeg,.jpg"
            ref={fileInputRef}
            onChange={(e) => handleFilesAdd(e.target.files)}
            className="hidden"
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-semibold text-slate-700 block">
                Choose Media Files <span className="text-slate-400 font-normal">(Multiple files supported)</span>
              </label>
              {selectedFiles.length > 0 && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 font-medium">
                    {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesAdd(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-slate-200 hover:border-[#0084d4] bg-slate-50/60 hover:bg-sky-50/20 rounded-lg p-5 text-center cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-2xs text-[#0084d4] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-bold text-slate-800">
                Drop files here or click to browse
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Allowed formats: .doc, .pdf, .fig, .docx, .png, .jpeg (Max 100 MB per file)
              </p>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Selected Files for Upload</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[#0084d4] hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add more files</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50/40">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-[12px] transition-colors ${
                      item.isDuplicate || item.isSizeExceeded
                        ? "bg-rose-50/80 border-rose-200 text-rose-900"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                        {getFileIcon(item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate leading-tight" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          {item.size} &bull; {item.type.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.isSizeExceeded ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1"
                          title={item.sizeError}
                        >
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Exceeds 100 MB</span>
                        </span>
                      ) : item.isDuplicate ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 flex items-center gap-1"
                          title={item.duplicateReason}
                        >
                          <Ban className="w-3 h-3" />
                          <span>Duplicate</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Ready
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {sizeExceededFilesCount > 0 && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    {sizeExceededFilesCount} file{sizeExceededFilesCount === 1 ? "" : "s"} exceed{sizeExceededFilesCount === 1 ? "s" : ""} the 100 MB upload limit. Please remove oversized files or attach as a Remote Link.
                  </span>
                </div>
              )}

              {duplicateFilesCount > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    {duplicateFilesCount} duplicate file{duplicateFilesCount === 1 ? "" : "s"} detected. Duplicates will be skipped automatically to save memory and avoid redundant storage.
                  </span>
                </div>
              )}
            </div>
          )}

          {selectedFiles.length === 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Or Attach by Remote URL
              </p>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Remote Link / URL
                </label>
                <input
                  type="text"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/... or cloud document link"
                  className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800"
                />
              </div>

              {remoteUrl.trim() && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Deliverable Name
                    </label>
                    <input
                      type="text"
                      value={remoteName}
                      onChange={(e) => setRemoteName(e.target.value)}
                      placeholder="e.g. Design Prototype"
                      className="w-full px-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Asset Type
                    </label>
                    <select
                      value={remoteType}
                      onChange={(e) => setRemoteType(e.target.value as "image" | "pdf" | "figma" | "zip" | "doc")}
                      className="w-full px-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800"
                    >
                      <option value="figma">Figma Link</option>
                      <option value="doc">Document</option>
                      <option value="pdf">PDF</option>
                      <option value="image">Image</option>
                      <option value="zip">Archive</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || (selectedFiles.length === 0 && !remoteUrl.trim()) || (selectedFiles.length > 0 && validFilesToUpload.length === 0)}
              className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all shadow-xs flex items-center gap-1.5 ${
                !isUploading && (validFilesToUpload.length > 0 || remoteUrl.trim())
                  ? "bg-[#0084d4] hover:bg-[#0277bd] text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>
                {isUploading
                  ? "Uploading..."
                  : validFilesToUpload.length > 1
                  ? `Upload ${validFilesToUpload.length} Files`
                  : validFilesToUpload.length === 1
                  ? "Upload File"
                  : remoteUrl.trim()
                  ? "Link Deliverable"
                  : "Upload Media"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
