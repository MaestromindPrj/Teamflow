"use client";

import { useState, useRef } from "react";
import { X, UploadCloud, FolderKanban, FileText, CheckCircle2, Paperclip } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

interface UploadAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFileType(fileName: string, mimeType?: string): "image" | "pdf" | "figma" | "zip" | "doc" {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "") || mimeType?.startsWith("image/")) {
    return "image";
  }
  if (ext === "pdf" || mimeType === "application/pdf") {
    return "pdf";
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
    return "zip";
  }
  if (ext === "fig") {
    return "figma";
  }
  return "doc";
}

export default function UploadAssetModal({ isOpen, onClose }: UploadAssetModalProps) {
  const { currentUser, projects, tasks, uploadTaskMedia } = useTeamFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPm = currentUser.role === "project_manager";
  const isEmployer = currentUser.role === "employer";

  const availableProjects = isPm
    ? projects.filter((p) => p.projectManagerId === currentUser.id)
    : isEmployer
    ? projects.filter((p) => p.teamMemberIds.includes(currentUser.id) || p.teamLeadId === currentUser.id)
    : projects;

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    availableProjects[0]?.id || ""
  );

  const projectTasks = tasks.filter((t) => t.projectId === selectedProjectId);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    projectTasks[0]?.id || ""
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [calculatedSize, setCalculatedSize] = useState("");
  const [fileType, setFileType] = useState<"figma" | "pdf" | "image" | "zip" | "doc">("pdf");
  const [fileUrl, setFileUrl] = useState("");

  if (!isOpen) return null;

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    const projTasks = tasks.filter((t) => t.projectId === projId);
    setSelectedTaskId(projTasks[0]?.id || "");
  };

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    const sizeStr = formatFileSize(file.size);
    setCalculatedSize(sizeStr);
    const detected = detectFileType(file.name, file.type);
    setFileType(detected);
    try {
      const objUrl = URL.createObjectURL(file);
      setFileUrl(objUrl);
    } catch {
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setCalculatedSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !selectedTaskId) return;

    uploadTaskMedia(selectedTaskId, {
      name: fileName.trim(),
      type: fileType,
      size: calculatedSize || (selectedFile ? formatFileSize(selectedFile.size) : "Cloud Asset"),
      url: fileUrl.trim() || (selectedFile ? URL.createObjectURL(selectedFile) : "#")
    });

    setSelectedFile(null);
    setFileName("");
    setCalculatedSize("");
    setFileUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                Upload Project Asset &bull; Deliverable
              </h2>
              <p className="text-[12px] text-slate-400">
                Attach prototypes, documentation, build packages, or design assets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Select Managed Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
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
              Target Project Task *
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
              required
            >
              {projectTasks.length === 0 ? (
                <option value="">No tasks available for this project</option>
              ) : (
                projectTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.status})
                  </option>
                ))
              )}
            </select>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            className="hidden"
          />

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Upload From Media
            </label>
            {selectedFile ? (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center shrink-0 border border-sky-100">
                    <Paperclip className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {calculatedSize} &bull; Auto-detected: {fileType.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-[#0084d4] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-[11px] font-semibold text-[#de2d1d] hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#0084d4] bg-slate-50/60 hover:bg-sky-50/20 rounded-lg p-4.5 text-center cursor-pointer transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-2xs text-[#0084d4] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-bold text-slate-800">
                  Browse device files
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click to open file explorer and select any file (.fig, .pdf, .png, .zip, .doc)
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Deliverable / Asset Name *
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. system_architecture_v2.pdf"
              className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              File Type
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as any)}
              className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
            >
              <option value="pdf">PDF Document</option>
              <option value="figma">Figma UI/UX File</option>
              <option value="image">Image / Graphic</option>
              <option value="zip">ZIP Package / Build</option>
              <option value="doc">Word / Text Doc</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Resource URL (Optional)
            </label>
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="e.g. https://www.figma.com/file/... or leave blank when uploading local file"
              className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTaskId || !fileName.trim()}
              className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] disabled:opacity-50 text-white text-[12px] font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Confirm &bull; Upload Asset</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
