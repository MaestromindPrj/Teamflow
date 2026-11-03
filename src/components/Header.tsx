"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, Check, ShieldCheck, Briefcase, UserCheck, Clock, LogOut, Settings, User, X } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import UserAvatar from "@/components/UserAvatar";

interface HeaderProps {
  title: string;
  subtitle: string;
  actionButton?: React.ReactNode;
}

export default function Header({ title, subtitle, actionButton }: HeaderProps) {
  const router = useRouter();
  const { currentUser, users, projects, tasks, rewardsLedger, isClockedIn, toggleClockInOut, logout, mediaDeletionRequests, hasHydrated } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [showNotifications, setShowNotifications] = useState(false);

  const dynamicNotifications = useMemo(() => {
    const list: Array<{ id: string; title: string; detail: string; time: string; link?: string }> = [];

    const isEmployer = currentUser.role === "employer";
    const isPm = currentUser.role === "project_manager";
    const isCeo = currentUser.role === "ceo";

    // 1. Role-specific: Employers see their assigned tasks and awards
    if (isEmployer) {
      const myActiveTasks = tasks.filter((t) => t.assignedTo === currentUser.id && t.status !== "Completed");
      const highPriority = myActiveTasks.find((t) => t.priority === "High");

      if (highPriority) {
        list.push({
          id: `notif-high-${highPriority.id}`,
          title: "High Priority Task",
          detail: `"${highPriority.title}" is assigned to you (Due: ${highPriority.deadline || "Soon"})`,
          time: "Urgent",
          link: "/tasks",
        });
      } else if (myActiveTasks.length > 0) {
        const topTask = myActiveTasks[0];
        list.push({
          id: `notif-assigned-${topTask.id}`,
          title: "Active Task Assignment",
          detail: `"${topTask.title}" (${topTask.status})`,
          time: "In Progress",
          link: "/tasks",
        });
      }

      // Reward points received by current user
      const myRewards = rewardsLedger.filter((r) => r.userId === currentUser.id);
      if (myRewards.length > 0) {
        const topReward = myRewards[0];
        list.push({
          id: `notif-reward-${topReward.id}`,
          title: `Reward Points Earned (+${topReward.points} pts)`,
          detail: topReward.reason || "Recognized for initiative contribution",
          time: topReward.date || "Recent",
          link: "/rewards",
        });
      }

      // Completed / verified deliverables
      const myCompleted = tasks.filter((t) => t.assignedTo === currentUser.id && t.status === "Completed");
      if (myCompleted.length > 0) {
        const topDone = myCompleted[0];
        list.push({
          id: `notif-done-${topDone.id}`,
          title: "Deliverable Approved",
          detail: `Your task "${topDone.title}" has been completed and verified`,
          time: "Verified",
          link: "/tasks",
        });
      }
    }

    // 2. Role-specific: PMs & CEOs see review queues and project milestones
    if (isPm || isCeo) {
      const reviewTasks = tasks.filter((t) => t.status === "Review");
      if (reviewTasks.length > 0) {
        reviewTasks.slice(0, 2).forEach((t) => {
          const assignee = users.find((u) => u.id === t.assignedTo);
          list.push({
            id: `notif-rev-${t.id}`,
            title: "Deliverable Ready for Review",
            detail: `${assignee?.fullName || "Team Member"} submitted "${t.title}"`,
            time: "Needs Review",
            link: "/tasks",
          });
        });
      }

      const completedTasks = tasks.filter((t) => t.status === "Completed");
      if (completedTasks.length > 0) {
        const topCompleted = completedTasks[0];
        list.push({
          id: `notif-comp-${topCompleted.id}`,
          title: "Task Milestone Completed",
          detail: `"${topCompleted.title}" completed and approved`,
          time: "Milestone",
          link: "/tasks",
        });
      }

      if (projects.length > 0) {
        const topProj = projects[0];
        list.push({
          id: `notif-proj-${topProj.id}`,
          title: "Active Project Initiative",
          detail: `${topProj.name} (${topProj.code}) on track`,
          time: "Active",
          link: "/projects",
        });
      }
    }

    // 3. Media Deletion Requests (notified to Team Lead, PM, and CEO)
    if (Array.isArray(mediaDeletionRequests)) {
      const pendingDelReqs = mediaDeletionRequests.filter((r) => {
        if (r.status !== "Pending") return false;
        if (isCeo) return true;
        if (isPm) {
          const proj = projects.find((p) => p.id === r.projectId);
          return proj?.projectManagerId === currentUser.id;
        }
        return r.teamLeadId === currentUser.id;
      });

      pendingDelReqs.slice(0, 2).forEach((r) => {
        list.push({
          id: `notif-del-${r.id}`,
          title: "Media Deletion Request",
          detail: `${r.requestedByName} requested deletion of "${r.attachmentName}" in ${r.projectName}`,
          time: "Action Needed",
          link: "/media",
        });
      });
    }

    return list;
  }, [tasks, projects, users, currentUser, rewardsLedger, mediaDeletionRequests]);

  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("teamflow_dismissed_notifs");
      if (saved) setDismissedNotifIds(JSON.parse(saved));
    } catch {}
  }, []);

  const notifications = useMemo(() => {
    return dynamicNotifications.filter((n) => !dismissedNotifIds.includes(n.id));
  }, [dynamicNotifications, dismissedNotifIds]);

  const handleDismissNotification = (id: string) => {
    setDismissedNotifIds((prev) => {
      const updated = [...prev, id];
      try {
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
    const allIds = dynamicNotifications.map((n) => n.id);
    setDismissedNotifIds(allIds);
    try {
      localStorage.setItem("teamflow_dismissed_notifs", JSON.stringify(allIds));
    } catch {}
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
          className: "bg-purple-100 text-purple-700 border-purple-200",
          icon: ShieldCheck
        };
      case "project_manager":
        return {
          label: "Project Manager",
          className: "bg-blue-100 text-blue-700 border-blue-200",
          icon: Briefcase
        };
      default:
        return {
          label: "Employer",
          className: "bg-[#4ade1d]/15 text-[#4ade1d] border-[#4ade1d]/30",
          icon: UserCheck
        };
    }
  };

  return (
    <header
      className="px-7 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-xs sticky top-0 z-30"
      suppressHydrationWarning
    >
      <div>
        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-snug">
          {title}
        </h1>
        <p className="text-[13px] text-slate-500 font-normal mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {actionButton}

        {mounted && hasHydrated && currentUser.id && currentUser.role !== "ceo" && (
          <button
            onClick={toggleClockInOut}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer shadow-2xs ${
              isClockedIn
                ? "bg-[#4ade1d]/15 text-[#4ade1d] border-[#4ade1d]/30 hover:bg-[#4ade1d]/25"
                : "bg-[#ffa500]/15 text-[#ffa500] border-[#ffa500]/30 hover:bg-[#ffa500]/25"
            }`}
            title="Toggle Clock In / Out"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isClockedIn ? "Clocked In" : "Clocked Out"}</span>
          </button>
        )}

        <div className="relative" ref={menuRef} suppressHydrationWarning>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            suppressHydrationWarning
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
          >
            {mounted && hasHydrated && currentUser.id ? (
              <>
                <UserAvatar
                  src={currentUser?.avatar || ""}
                  name={currentUser?.fullName || currentUser?.name || "User"}
                  role={currentUser?.role || "employer"}
                  className="w-7 h-7 rounded-full border border-slate-200 shrink-0"
                  textClassName="text-[10px]"
                />
                <div className="text-left hidden md:block">
                  <p className="text-[12px] font-semibold text-slate-800 leading-tight">
                    {currentUser?.name || currentUser?.fullName || "User"}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize leading-tight">
                    {currentUser?.role ? currentUser.role.replace("_", " ") : "employer"}
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
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg bg-white border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-2xs relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[1.8]" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#de2d1d] rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200/90 p-3 z-50 text-[12px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-medium text-slate-800">
                <span className="font-semibold text-[13px]">Notifications ({notifications.length})</span>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAllNotifications}
                    className="text-[11px] text-[#0084d4] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-[12px]">
                  No unread notifications
                </div>
              ) : (
                <div className="divide-y divide-slate-100 pt-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="py-2.5 px-1.5 hover:bg-slate-50/80 -mx-1 rounded transition-colors cursor-pointer group flex items-start justify-between gap-2"
                      title={n.link ? `Click to view ${n.title}` : "Click to dismiss"}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 font-medium text-[12px] group-hover:text-[#0084d4] transition-colors">{n.title}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">{n.detail}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
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
