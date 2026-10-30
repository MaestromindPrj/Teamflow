"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Check, ShieldCheck, Briefcase, UserCheck, Clock, LogOut } from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

interface HeaderProps {
  title: string;
  subtitle: string;
  actionButton?: React.ReactNode;
}

export default function Header({ title, subtitle, actionButton }: HeaderProps) {
  const router = useRouter();
  const { currentUser, users, projects, tasks, setCurrentUserId, isClockedIn, toggleClockInOut, logout } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [showNotifications, setShowNotifications] = useState(false);

  const dynamicNotifications = useMemo(() => {
    const list: Array<{ id: string; title: string; detail: string; time: string }> = [];

    const reviewTasks = tasks.filter((t) => t.status === "Review");
    const completedTasks = tasks.filter((t) => t.status === "Completed");

    if (reviewTasks.length > 0) {
      const topReview = reviewTasks[0];
      const assignee = users.find((u) => u.id === topReview.assignedTo);
      list.push({
        id: `notif-rev-${topReview.id}`,
        title: "Deliverable Ready for Review",
        detail: `${assignee?.fullName || "Team Member"} submitted "${topReview.title}"`,
        time: "Recent"
      });
    }

    if (completedTasks.length > 0) {
      const topCompleted = completedTasks[0];
      list.push({
        id: `notif-comp-${topCompleted.id}`,
        title: "Task Milestone Completed",
        detail: `"${topCompleted.title}" completed and approved`,
        time: "1 hour ago"
      });
    }

    if (projects.length > 0) {
      const topProj = projects[0];
      list.push({
        id: `notif-proj-${topProj.id}`,
        title: "Active Project Initiative",
        detail: `${topProj.name} (${topProj.code}) on track`,
        time: "Today"
      });
    }

    return list;
  }, [tasks, projects, users]);

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; detail: string; time: string }>>([]);

  useEffect(() => {
    if (dynamicNotifications.length > 0) {
      setNotifications(dynamicNotifications);
    }
  }, [dynamicNotifications]);
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
    <header className="px-7 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-xs sticky top-0 z-30">
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

        {mounted && currentUser.role !== "ceo" && (
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
            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              <img
                src={mounted ? currentUser.avatar : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"}
                alt={mounted ? currentUser.name : "Elena"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[12px] font-semibold text-slate-800 leading-tight">
                {mounted ? currentUser.name : "Elena"}
              </p>
              <p className="text-[10px] text-slate-400 capitalize leading-tight">
                {mounted ? currentUser.role.replace("_", " ") : "ceo"}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="max-h-80 overflow-y-auto py-1">
                {users.map((u) => {
                  const isSelected = u.id === currentUser.id;
                  const badge = getRoleBadge(u.role);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUserId(u.id);
                        setShowUserMenu(false);
                        router.push("/");
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? "bg-sky-50/70" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <img
                          src={u.avatar}
                          alt={u.fullName}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">
                            {u.fullName}
                          </p>
                          <div className="mt-0.5">
                            <span
                              className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#0084d4] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-slate-100 px-2 pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
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
                    onClick={() => setNotifications([])}
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
                      onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
                      className="py-2.5 hover:bg-slate-50/80 -mx-1 px-1 rounded transition-colors cursor-pointer"
                      title="Click to dismiss notification"
                    >
                      <p className="text-slate-900 font-medium text-[12px]">{n.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{n.detail}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
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
