"use client";

import { useState } from "react";
import { X, UserPlus, Search, UserCheck, Plus } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { Project } from "@/data/teamflowData";
import UserAvatar from "@/components/UserAvatar";

interface AddTeamMemberModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTeamMemberModal({ project, isOpen, onClose }: AddTeamMemberModalProps) {
  const { users, updateProject } = useTeamFlow();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const availableEmployees = users.filter(
    (u) => u.role === "employee" && !project.teamMemberIds.includes(u.id)
  );

  const filteredEmployees = availableEmployees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.fullName.toLowerCase().includes(q) ||
      (emp.jobTitle || "").toLowerCase().includes(q)
    );
  });

  const toggleSelection = (empId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleAddSelected = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) return;

    const updatedMemberIds = Array.from(new Set([...project.teamMemberIds, ...selectedMemberIds]));
    updateProject(project.id, {
      teamMemberIds: updatedMemberIds
    });

    setSelectedMemberIds([]);
    setSearchQuery("");
    onClose();
  };

  const handleAddSingle = (empId: string) => {
    const updatedMemberIds = Array.from(new Set([...project.teamMemberIds, empId]));
    updateProject(project.id, {
      teamMemberIds: updatedMemberIds
    });

    setSelectedMemberIds([]);
    setSearchQuery("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0084d4] flex items-center justify-center border border-sky-100">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Add Team Member
              </h3>
              <p className="text-[11px] text-slate-400">
                Assign staff members to <span className="font-medium text-slate-600">{project.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAddSelected} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {availableEmployees.length === 0 ? (
              <div className="py-10 text-center space-y-2 bg-slate-50/60 rounded-lg border border-slate-100 p-6">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <UserCheck className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-semibold text-slate-700">All Team Members Assigned</p>
                <p className="text-[11px] text-slate-400">
                  All company employees are already members of this project.
                </p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search available members by name or role..."
                    className="w-full h-9 pl-8 pr-3 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 shadow-2xs"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Available Staff ({filteredEmployees.length})
                  </span>

                  {filteredEmployees.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-[12px]">
                      No members match &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {filteredEmployees.map((emp) => {
                        const isSelected = selectedMemberIds.includes(emp.id);

                        return (
                          <div
                            key={emp.id}
                            onClick={() => toggleSelection(emp.id)}
                            className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                              isSelected
                                ? "bg-sky-50/80 border-[#0084d4] ring-1 ring-[#0084d4]/30"
                                : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="w-4 h-4 accent-[#0084d4] rounded pointer-events-none"
                              />
                              <UserAvatar
                                src={emp.avatar}
                                name={emp.fullName}
                                role={emp.role}
                                className="w-8 h-8 rounded-full border border-slate-200 shrink-0"
                                textClassName="text-[11px]"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-[13px] text-slate-900 leading-tight truncate">
                                  {emp.fullName}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {emp.jobTitle || "Employee"}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddSingle(emp.id);
                              }}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold text-[#0084d4] bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {availableEmployees.length > 0 && (
              <button
                type="submit"
                disabled={selectedMemberIds.length === 0}
                className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1.5 ${
                  selectedMemberIds.length > 0
                    ? "bg-[#0084d4] hover:bg-[#0277bd] text-white shadow-2xs cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>
                  {selectedMemberIds.length > 0
                    ? `Add Selected (${selectedMemberIds.length})`
                    : "Add Team Member"}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

