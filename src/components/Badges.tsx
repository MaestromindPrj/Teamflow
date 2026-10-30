export function PriorityBadge({ priority }: { priority: "High" | "Medium" | "Low" }) {
  if (priority === "High") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ffa500]/15 text-[#ffa500] border border-[#ffa500]/30">
        High
      </span>
    );
  }
  if (priority === "Medium") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#e0f2fe]/80 text-[#0284c7] border border-sky-200/60">
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f1f5f9] text-[#64748b] border border-slate-200/60">
      Low
    </span>
  );
}

export function StatusBadge({
  status,
}: {
  status: "In Progress" | "Review" | "In Review" | "To Do" | "Completed" | "Present" | "Late" | "Leave" | "Remote" | "Planning" | "Checked Out" | "Not Clocked In";
}) {
  switch (status) {
    case "In Progress":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#e0f2fe] text-[#0284c7] border border-sky-200/70">
          In Progress
        </span>
      );
    case "Review":
    case "In Review":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#ffa500]/15 text-[#ffa500] border border-[#ffa500]/30">
          In Review
        </span>
      );
    case "To Do":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#f1f5f9] text-[#64748b] border border-slate-200/70">
          To Do
        </span>
      );
    case "Planning":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/70">
          Planning
        </span>
      );
    case "Completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30">
          Completed
        </span>
      );
    case "Present":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#4ade1d]/15 text-[#4ade1d] border border-[#4ade1d]/30">
          Present
        </span>
      );
    case "Remote":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/70">
          Remote
        </span>
      );
    case "Late":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#ffa500]/15 text-[#ffa500] border border-[#ffa500]/30">
          Late
        </span>
      );
    case "Leave":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#de2d1d]/15 text-[#de2d1d] border border-[#de2d1d]/30">
          Leave
        </span>
      );
    case "Checked Out":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Checked Out
        </span>
      );
    case "Not Clocked In":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200/80">
          Not Clocked In
        </span>
      );
  }
}
