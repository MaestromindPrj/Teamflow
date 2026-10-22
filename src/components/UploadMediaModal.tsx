"use client";

import { useState, useRef } from "react";
import { X, UploadCloud, FileText, Image as ImageIcon, Archive, Paperclip } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

interface UploadMediaModalProps {
  taskId: string;
  taskTitle: string;
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

export default function UploadMediaModal({ taskId, taskTitle, isOpen, onClose }: UploadMediaModalProps) {
  const { uploadTaskMedia } = useTeamFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [calculatedSize, setCalculatedSize] = useState("");
  const [type, setType] = useState<"image" | "pdf" | "figma" | "zip" | "doc">("figma");
  const [url, setUrl] = useState("");

  if (!isOpen) return null;

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    setSelectedFile(file);
    setName(file.name);
    const sizeStr = formatFileSize(file.size);
    setCalculatedSize(sizeStr);
    const detected = detectFileType(file.name, file.type);
    setType(detected);
    try {
      const objUrl = URL.createObjectURL(file);
      setUrl(objUrl);
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
    if (!name.trim()) return;

    uploadTaskMedia(taskId, {
      name: name.trim(),
      size: calculatedSize || (selectedFile ? formatFileSize(selectedFile.size) : "Cloud Link"),
      type,
      url: url.trim() || (selectedFile ? URL.createObjectURL(selectedFile) : "#")
    });

    setSelectedFile(null);
    setName("");
    setCalculatedSize("");
    setUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <UploadCloud className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Upload Task Deliverable
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                {taskTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            className="hidden"
          />

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Upload from Media
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
                      {calculatedSize} &bull; Auto-detected: {type.toUpperCase()}
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
                className="border-2 border-dashed border-slate-200 hover:border-[#0084d4] bg-slate-50/60 hover:bg-sky-50/20 rounded-lg p-5 text-center cursor-pointer transition-all group"
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
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              File / Deliverable Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. final-redesign-spec.fig"
              className="w-full px-3.5 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Asset Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "image" | "pdf" | "figma" | "zip" | "doc")}
              className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
            >
              <option value="figma">Figma File (.fig)</option>
              <option value="pdf">PDF Document (.pdf)</option>
              <option value="image">Image Asset (.png, .jpg, .webp)</option>
              <option value="zip">Archive / ZIP (.zip)</option>
              <option value="doc">Document (.doc, .docx)</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              File Link / Remote URL (Optional)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://... (or leave blank when uploading local file)"
              className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Attach Deliverable</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
