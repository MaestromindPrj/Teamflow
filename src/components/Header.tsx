"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Check,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Clock,
  LogOut,
  Settings,
  User,
  X,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Award,
  FolderKanban,
  Sparkles
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import { NotificationPreferences } from "@/data/teamflowData";
import UserAvatar from "@/components/UserAvatar";

interface HeaderProps {
  title: string;
  subtitle: string;
  actionButton?: React.ReactNode;
}

export default function Header({ title, subtitle, actionButton }: HeaderProps) {
  const router = useRouter();
  const {
    currentUser,
    users,
    projects,
    tasks,
    rewardsLedger,
    leaveRequests,
    officeLeaves,
    isClockedIn,
    toggleClockInOut,
    logout,
    mediaDeletionRequests,
    isUserTeamLead,
    hasHydrated,
    notificationPreferences
  } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [showNotifications, setShowNotifications] = useState(false);

  const dynamicNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      detail: string;
      time: string;
      link?: string;
      category?: "leave" | "holiday" | "project" | "task" | "deadline" | "media" | "reward";
      badgeColor?: string;
    }> = [];

    const isEmployee = currentUser.role === "employee";
    const isPm = currentUser.role === "project_manager";
    const isCeo = currentUser.role === "ceo";

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Managed projects and employees for PM
    const myManagedProjects = isPm
      ? projects.filter((p) => p.projectManagerId === currentUser.id)
      : projects;
    const myEmployeeIds = new Set(
      myManagedProjects.flatMap((p) => [...p.teamMemberIds, p.teamLeadId].filter(Boolean))
    );

    // =========================================================================
    // 1. LEAVE APPLICATION NOTIFICATIONS (when user applies for leave)
    //    Notify: PM and CEO
    // =========================================================================
    if (isCeo || isPm) {
      const pendingLeaves = leaveRequests.filter((r) => r.status === "Pending");
      pendingLeaves.forEach((r) => {
        // Exclude notification if the PM/CEO themselves submitted it
        if (r.userId === currentUser.id) return;

        const dateRangeStr = r.endDate && r.endDate !== r.startDate ? `${r.startDate} → ${r.endDate}` : r.startDate;
        list.push({
          id: `notif-leave-applied-${r.id}`,
          title: "New Leave Application",
          detail: `${r.userName} applied for ${r.leaveType} (${dateRangeStr})${r.reason ? ` — "${r.reason}"` : ""}`,
          time: "Needs Review",
          link: `/attendance?view=requests&leaveId=${r.id}`,
          category: "leave",
          badgeColor: "bg-sky-50 text-[#0084d4] border-sky-200/80"
        });
      });
    }

    // =========================================================================
    // 2. LEAVE APPROVAL / REJECTION DECISIONS
    //    - Only notify applicant employee regarding their upcoming leave decision
    //    - Past leaves that already concluded are excluded from active notifications
    // =========================================================================
    const decidedLeaves = leaveRequests.filter((r) => r.status === "Approved" || r.status === "Rejected");
    decidedLeaves.forEach((r) => {
      const leaveEnd = r.endDate || r.startDate;
      if (leaveEnd < todayStr) return;

      const isApproved = r.status === "Approved";
      const statusTitle = isApproved ? "Approved" : "Rejected";
      const dateRangeStr = r.endDate && r.endDate !== r.startDate ? `${r.startDate} → ${r.endDate}` : r.startDate;

      // The employee who applied gets notified:
      if (r.userId === currentUser.id) {
        list.push({
          id: `notif-leave-emp-${r.id}-${r.status}`,
          title: isApproved ? "Leave Request Approved" : "Leave Request Declined",
          detail: `Your ${r.leaveType} leave (${dateRangeStr}) has been ${statusTitle.toLowerCase()} by ${r.reviewedByName || "Management"}.`,
          time: statusTitle,
          link: `/attendance?view=requests&leaveId=${r.id}`,
          category: "leave",
          badgeColor: isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        });
      }
    });

    // =========================================================================
    // 3. COMPANY HOLIDAY DECLARATIONS
    //    - Only notify employees about active upcoming holidays announced recently
    //    - Exclude declarant, past holidays, and management with calendar control
    // =========================================================================
    if (Array.isArray(officeLeaves)) {
      officeLeaves.forEach((ol) => {
        // Exclude the user who declared it
        if (ol.declaredById && ol.declaredById === currentUser.id) return;

        // Skip past holidays whose dates have already concluded
        const holidayEnd = ol.endDate || ol.date;
        if (holidayEnd < todayStr) return;

        // Only notify if declared today / recently (within last 24h)
        if (ol.createdAt) {
          const createdTime = new Date(ol.createdAt).getTime();
          const oneDayMs = 24 * 60 * 60 * 1000;
          if (Date.now() - createdTime > oneDayMs) return;
        }

        // Leadership & PMs manage official calendar directly, no redundant bell alert needed
        if (isCeo || isPm) return;

        const dateRangeStr =
          ol.endDate && ol.endDate !== ol.date
            ? `${ol.date} → ${ol.endDate}`
            : ol.date;

        const isDeclarantCeo =
          ol.declaredByRole === "ceo" ||
          (!ol.declaredByRole && ol.declaredByName?.toLowerCase().includes("ceo")) ||
          ol.declaredById === "u-ceo-1";

        let declarantTitle = isDeclarantCeo
          ? `CEO ${ol.declaredByName || "Executive"}`
          : `PM ${ol.declaredByName || "Project Manager"}`;

        list.push({
          id: `notif-holiday-${ol.id}`,
          title: "Company Holiday Declared",
          detail: `${ol.title} (${dateRangeStr}) has been declared as an official company holiday by ${declarantTitle}.`,
          time: "Company Holiday",
          link: "/office-leaves",
          category: "holiday",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
        });
      });
    }

    // =========================================================================
    // 4. TASK ASSIGNMENT (when an employee is assigned a new task)
    // =========================================================================
    const myAssignedActiveTasks = tasks.filter((t) => t.assignedTo === currentUser.id && t.status !== "Completed");
    myAssignedActiveTasks.forEach((t) => {
      const proj = projects.find((p) => p.id === t.projectId);
      list.push({
        id: `notif-new-task-${t.id}`,
        title: "New Task Assigned",
        detail: `You have been assigned "${t.title}" in ${proj?.name || "your project"} (Due: ${t.deadline || "Soon"}).`,
        time: t.priority ? `${t.priority} Priority` : "Assigned",
        link: `/projects?projectId=${t.projectId}&taskId=${t.id}`,
        category: "task",
        badgeColor: t.priority === "High" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-sky-50 text-[#0084d4] border-sky-200"
      });
    });

    // =========================================================================
    // 4. TASK DEADLINE REACHES (Due Today or Overdue)
    // =========================================================================
    const activeTasksWithDeadline = tasks.filter((t) => t.status !== "Completed" && t.deadline);
    activeTasksWithDeadline.forEach((t) => {
      const isAssignedToMe = t.assignedTo === currentUser.id;
      const proj = projects.find((p) => p.id === t.projectId);
      const assignee = users.find((u) => u.id === t.assignedTo);
      const assigneeName = assignee?.fullName || "Team Member";

      // Case A: Deadline reaches today
      if (t.deadline === todayStr) {
        if (isAssignedToMe) {
          list.push({
            id: `notif-deadline-today-${t.id}-${todayStr}`,
            title: "Task Deadline Reached Today",
            detail: `"${t.title}" in ${proj?.name || "Project"} reaches its deadline today (${t.deadline}).`,
            time: "Due Today",
            link: `/projects?projectId=${t.projectId}&taskId=${t.id}`,
            category: "deadline",
            badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
          });
        } else if (isPm || isCeo) {
          list.push({
            id: `notif-deadline-today-${t.id}-${todayStr}`,
            title: "Task Due Today",
            detail: `"${t.title}" (${assigneeName} • ${proj?.name || "Project"}) reaches deadline today.`,
            time: "Due Today",
            link: `/projects?projectId=${t.projectId}&taskId=${t.id}`,
            category: "deadline",
            badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
          });
        }
      }
      // Case B: Deadline has passed / reached (Overdue)
      else if (t.deadline < todayStr) {
        if (isAssignedToMe) {
          list.push({
            id: `notif-deadline-overdue-${t.id}`,
            title: "Task Deadline Overdue",
            detail: `"${t.title}" was due on ${t.deadline} and is currently ${t.status}.`,
            time: "Overdue",
            link: `/projects?projectId=${t.projectId}&taskId=${t.id}`,
            category: "deadline",
            badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
          });
        } else if (isPm || isCeo) {
          list.push({
            id: `notif-deadline-overdue-${t.id}`,
            title: "Task Overdue Alert",
            detail: `"${t.title}" (${assigneeName} • ${proj?.name || "Project"}) passed deadline ${t.deadline}.`,
            time: "Overdue",
            link: `/projects?projectId=${t.projectId}&taskId=${t.id}`,
            category: "deadline",
            badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
          });
        }
      }
    });

    // =========================================================================
    // 5. PROJECT NOTIFICATIONS (New project added or user assigned to project)
    // =========================================================================
    if (Array.isArray(projects)) {
      projects.forEach((p) => {
        const isProjectManager = p.projectManagerId === currentUser.id;
        const isTeamLead = p.teamLeadId === currentUser.id;
        const isTeamMember = Array.isArray(p.teamMemberIds) && p.teamMemberIds.includes(currentUser.id);

        if (isCeo) {
          list.push({
            id: `notif-proj-ceo-${p.id}`,
            title: "New Project Added",
            detail: `"${p.name}" (${p.code}) • Category: ${p.category} • Priority: ${p.priority}`,
            time: p.status || "Active",
            link: `/projects?projectId=${p.id}`,
            category: "project",
            badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
          });
        } else if (isPm && isProjectManager) {
          list.push({
            id: `notif-proj-pm-${p.id}`,
            title: "Project Initiative Assigned",
            detail: `You are managing project "${p.name}" (${p.code}) • Category: ${p.category}`,
            time: "PM Assigned",
            link: `/projects?projectId=${p.id}`,
            category: "project",
            badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
          });
        } else if (isEmployee && (isTeamLead || isTeamMember)) {
          list.push({
            id: `notif-proj-emp-${p.id}`,
            title: isTeamLead ? "Assigned as Team Lead" : "Assigned to Project",
            detail: `You have been added to "${p.name}" (${p.code}) as ${isTeamLead ? "Team Lead" : "Team Member"} in ${p.category}.`,
            time: "Project Added",
            link: `/projects?projectId=${p.id}`,
            category: "project",
            badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
          });
        }
      });
    }

    // =========================================================================
    // 6. OTHER WORKSPACE NOTIFICATIONS (Deliverables, Reviews, Media, Rewards)
    // =========================================================================
    if (isEmployee) {
      // Reward points
      const myRewards = rewardsLedger.filter((r) => r.userId === currentUser.id);
      if (myRewards.length > 0) {
        const topReward = myRewards[0];
        list.push({
          id: `notif-reward-${topReward.id}`,
          title: `Reward Points Earned (+${topReward.points} pts)`,
          detail: topReward.reason || "Recognized for initiative contribution",
          time: topReward.date || "Recent",
          link: "/rewards",
          category: "reward",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
        });
      }
    }

    if (isPm || isCeo) {
      const reviewTasks = tasks.filter((t) => t.status === "Review");
      reviewTasks.slice(0, 2).forEach((t) => {
        const assignee = users.find((u) => u.id === t.assignedTo);
        list.push({
          id: `notif-rev-${t.id}`,
          title: "Deliverable Ready for Review",
          detail: `${assignee?.fullName || "Team Member"} submitted "${t.title}"`,
          time: "Needs Review",
          link: `/projects?projectId=${t.projectId}&taskId=${t.id}&tab=media`,
          category: "task",
          badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
        });
      });
    }

    if (Array.isArray(mediaDeletionRequests)) {
      mediaDeletionRequests.forEach((r) => {
        const proj = projects.find((p) => p.id === r.projectId);
        const isLead = r.teamLeadId === currentUser.id || proj?.teamLeadId === currentUser.id || isUserTeamLead(currentUser.id, r.projectId);
        const isProjectPm = proj?.projectManagerId === currentUser.id;
        const isRequester = r.requestedBy === currentUser.id;

        // Only active pending requests that require management action generate alerts.
        // Completed/resolved requests (Accepted/Rejected) are historical data and do not alert.
        if (r.status === "Pending") {
          const shouldNotify = (isCeo || isPm || isLead) && !isRequester;
          if (shouldNotify) {
            list.push({
              id: `notif-del-pending-${r.id}`,
              title: "Media Deletion Request",
              detail: `${r.requestedByName} requested deletion of "${r.attachmentName}" in ${r.projectName}${r.reason ? ` — "${r.reason}"` : ""}`,
              time: "Action Needed",
              link: `/media?tab=requests&requestId=${r.id}`,
              category: "media",
              badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
            });
          }
        }
      });
    }

    return list;
  }, [tasks, projects, users, currentUser, rewardsLedger, leaveRequests, officeLeaves, mediaDeletionRequests, isUserTeamLead]);

  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(() => {
    return (
      notificationPreferences || {
        taskAlerts: true,
        projectAlerts: true,
        leaveAlerts: true,
        holidayAlerts: true,
      }
    );
  });

  useEffect(() => {
    if (notificationPreferences) {
      setLocalPrefs(notificationPreferences);
    }
  }, [notificationPreferences]);

  useEffect(() => {
    const handlePrefEvent = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationPreferences>;
      if (customEvent.detail) {
        setLocalPrefs(customEvent.detail);
      } else {
        try {
          const userKey = `teamflow_notif_prefs_${currentUser.id || "guest"}`;
          const saved = localStorage.getItem(userKey) || localStorage.getItem("teamflow_notif_prefs");
          if (saved) setLocalPrefs(JSON.parse(saved));
        } catch {}
      }
    };

    window.addEventListener("teamflow_notif_prefs_updated", handlePrefEvent);
    window.addEventListener("storage", handlePrefEvent);
    return () => {
      window.removeEventListener("teamflow_notif_prefs_updated", handlePrefEvent);
      window.removeEventListener("storage", handlePrefEvent);
    };
  }, [currentUser.id]);

  useEffect(() => {
    try {
      const userKey = `teamflow_dismissed_notifs_${currentUser.id || "guest"}`;
      const saved = localStorage.getItem(userKey);
      const globalSaved = localStorage.getItem("teamflow_dismissed_notifs");
      const combined = Array.from(new Set([
        ...(saved ? JSON.parse(saved) : []),
        ...(globalSaved ? JSON.parse(globalSaved) : [])
      ]));
      setDismissedNotifIds(combined);
    } catch {}
  }, [currentUser.id]);

  const notifications = useMemo(() => {
    const activePrefs = localPrefs || notificationPreferences || {
      taskAlerts: true,
      projectAlerts: true,
      leaveAlerts: true,
      holidayAlerts: true,
    };

    return dynamicNotifications.filter((n) => {
      // 1. Manually dismissed check
      if (dismissedNotifIds.includes(n.id)) return false;

      // 2. Notification Preferences check
      if (!activePrefs.taskAlerts && (n.category === "task" || n.category === "deadline")) {
        return false;
      }
      if (!activePrefs.projectAlerts && n.category === "project") {
        return false;
      }
      if (!activePrefs.leaveAlerts && n.category === "leave") {
        return false;
      }
      if (!activePrefs.holidayAlerts && n.category === "holiday") {
        return false;
      }

      return true;
    });
  }, [dynamicNotifications, dismissedNotifIds, localPrefs, notificationPreferences]);

  const handleDismissNotification = (id: string) => {
    setDismissedNotifIds((prev) => {
      const updated = Array.from(new Set([...prev, id]));
      try {
        const userKey = `teamflow_dismissed_notifs_${currentUser.id || "guest"}`;
        localStorage.setItem(userKey, JSON.stringify(updated));
        localStorage.setItem("teamflow_dismissed_notifs", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleNotificationClick = (n: { id: string; link?: string }) => {
    handleDismissNotification(n.id);
    if (n.link) {
      router.push(n.link);
      setShowNotifications(false);
    }
  };

  const handleClearAllNotifications = () => {
    setDismissedNotifIds((prev) => {
      const allIds = Array.from(new Set([...prev, ...notifications.map((n) => n.id)]));
      try {
        const userKey = `teamflow_dismissed_notifs_${currentUser.id || "guest"}`;
        localStorage.setItem(userKey, JSON.stringify(allIds));
        localStorage.setItem("teamflow_dismissed_notifs", JSON.stringify(allIds));
      } catch {}
      return allIds;
    });
  };
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ceo":
        return {
          label: "CEO",
          className: "bg-purple-50 text-purple-700 border-purple-200/80",
          icon: ShieldCheck
        };
      case "project_manager":
        return {
          label: "Project Manager",
          className: "bg-blue-50 text-blue-700 border-blue-200/80",
          icon: Briefcase
        };
      default:
        return {
          label: "Employee",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
          icon: UserCheck
        };
    }
  };

  return (
    <header
      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      suppressHydrationWarning
    >
      <div>
        <h1 className="text-[19px] sm:text-[21px] font-bold text-slate-900 tracking-tight leading-snug">
          {title}
        </h1>
        <p className="text-[12px] sm:text-[13px] text-slate-500 font-normal mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {actionButton}

        {mounted && hasHydrated && currentUser.id && currentUser.role !== "ceo" && (
          <button
            onClick={toggleClockInOut}
            className={`h-[42px] inline-flex items-center gap-2 px-3.5 rounded-lg text-[12px] font-semibold border transition-all cursor-pointer shadow-xs ${
              isClockedIn
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70"
            }`}
            title="Toggle Clock In / Out"
          >
            {isClockedIn ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
            <span>{isClockedIn ? "Clocked In" : "Clocked Out"}</span>
          </button>
        )}

        <div className="relative" ref={menuRef} suppressHydrationWarning>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            suppressHydrationWarning
            className="h-[42px] flex items-center gap-2.5 px-3 rounded-lg bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
          >
            {mounted && hasHydrated && currentUser.id ? (
              <>
                <UserAvatar
                  src={currentUser?.avatar || ""}
                  name={currentUser?.fullName || currentUser?.name || "User"}
                  role={currentUser?.role || "employee"}
                  className="w-7 h-7 rounded-full border border-slate-200 shrink-0"
                  textClassName="text-[10px]"
                />
                <div className="text-left hidden md:block">
                  <p className="text-[12px] font-semibold text-slate-800 leading-tight">
                    {currentUser?.fullName || currentUser?.name || "User"}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize leading-tight">
                    {currentUser?.role ? currentUser.role.replace("_", " ") : "employee"}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 animate-pulse" />
                <div className="text-left hidden md:block space-y-1">
                  <div className="w-16 h-2.5 bg-slate-100 rounded animate-pulse" />
                  <div className="w-10 h-2 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100 flex items-start gap-3">
                <UserAvatar
                  src={currentUser.avatar}
                  name={currentUser.fullName || currentUser.name}
                  role={currentUser.role}
                  className="w-10 h-10 rounded-full border border-slate-200 shrink-0"
                  textClassName="text-[13px]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-slate-900 truncate leading-snug">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {currentUser.email}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${getRoleBadge(currentUser.role).className}`}
                    >
                      {getRoleBadge(currentUser.role).label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentUser.employeeId}
                    </span>
                  </div>
                </div>
              </div>

              

              <div className="pt-1 border-t border-slate-100 px-1.5">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={async () => {
                    if (isSigningOut) return;
                    setIsSigningOut(true);
                    try {
                      await logout();
                    } catch {
                      if (typeof window !== "undefined") {
                        window.location.replace("/login");
                      }
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSigningOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Signing Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef} suppressHydrationWarning>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-[42px] h-[42px] rounded-lg bg-white border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-2xs relative cursor-pointer"
            title="Notifications"
            suppressHydrationWarning
          >
            <Bell className="w-4 h-4 stroke-[1.8]" />
            {mounted && hasHydrated && notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white text-[9.5px] font-bold rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          {mounted && hasHydrated && showNotifications && (
            <div className="absolute right-0 mt-2 w-88 sm:w-96 max-h-[440px] flex flex-col bg-white rounded-lg shadow-xl border border-slate-200/90 p-3.5 z-50 text-[12px] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 font-medium text-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[13px] text-slate-900">Notifications</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    {notifications.length}
                  </span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAllNotifications}
                    className="text-[11px] font-semibold text-[#0084d4] hover:text-[#0277bd] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-[12px] space-y-1">
                  <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-500">No unread notifications</p>
                  <p className="text-[11px] text-slate-400">All notifications are up to date.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[360px] pt-1 pr-0.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="py-2.5 px-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group flex items-start gap-2.5"
                      title={n.link ? `Click to view ${n.title}` : "Click to dismiss"}
                    >
                      <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        {n.category === "leave" ? (
                          <Calendar className="w-3.5 h-3.5 text-[#0084d4]" />
                        ) : n.category === "holiday" ? (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        ) : n.category === "project" ? (
                          <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                        ) : n.category === "deadline" ? (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        ) : n.category === "task" ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        ) : n.category === "reward" ? (
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 font-semibold text-[12px] group-hover:text-[#0084d4] transition-colors truncate">
                          {n.title}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5 leading-snug line-clamp-2">
                          {n.detail}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissNotification(n.id);
                        }}
                        className="text-slate-300 hover:text-slate-600 p-0.5 rounded cursor-pointer shrink-0 mt-0.5"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
