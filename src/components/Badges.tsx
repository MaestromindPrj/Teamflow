export function PriorityBadge({ priority }: { priority: "High" | "Medium" | "Low" }) {
  if (priority === "High") {
    return (
      <span className="h-[22px] inline-flex items-center px-2 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 leading-none">
        High
      </span>
    );
  }
  if (priority === "Medium") {
    return (
      <span className="h-[22px] inline-flex items-center px-2 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 leading-none">
        Medium
      </span>
    );
  }
  return (
    <span className="h-[22px] inline-flex items-center px-2 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 leading-none">
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
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 leading-none">
          In Progress
        </span>
      );
    case "Review":
    case "In Review":
      return (
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 leading-none">
          In Review
        </span>
      );
    case "To Do":
      return (
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 leading-none">
          To Do
        </span>
      );
    case "Planning":
      return (
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 leading-none">
          Planning
        </span>
      );
    case "Completed":
      return (
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">
          Completed
        </span>
      );
    case "Present":
    case "Late":
      return (
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">
          Present
        </span>
      );
    case "Remote":
      return (
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 leading-none">
          Remote
        </span>
      );
    case "Leave":
      return (
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 leading-none">
          Leave
        </span>
      );
    case "Checked Out":
      return (
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 leading-none">
          Checked Out
        </span>
      );
    case "Not Clocked In":
      return (
        <span className="h-[22px] inline-flex items-center px-2.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200 leading-none">
          Not Clocked In
        </span>
      );
  }
}
