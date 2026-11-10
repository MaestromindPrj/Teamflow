"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface DeleteMediaConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  fileName: string;
  projectName: string;
  taskTitle: string;
}

export default function DeleteMediaConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  projectName,
  taskTitle,
}: DeleteMediaConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200/90 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <Trash2 className="w-5 h-5 stroke-[2]" />
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">
              Delete Deliverable Media?
            </h3>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-800 break-all">{fileName}</strong> from project <span className="font-semibold text-slate-700">{projectName}</span>?
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[12px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This deliverable will be removed from task <strong>{taskTitle}</strong> and the asset vault. This action cannot be undone.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="h-9 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Deliverable</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

