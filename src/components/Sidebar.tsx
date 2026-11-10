"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Calendar,
  Users,
  FolderKanban,
  Award,
  Settings,
  Image as ImageIcon,
  Briefcase,
  Layers,
  CalendarRange,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";
import UserAvatar from "@/components/UserAvatar";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "Overview" | "Organization" | "Management" | "Preferences";
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutGrid, section: "Overview" },
  { name: "Projects", href: "/projects", icon: FolderKanban, section: "Overview" },
  { name: "Attendance", href: "/attendance", icon: Calendar, section: "Overview" },
  { name: "Company Holidays", href: "/office-leaves", icon: CalendarRange, section: "Overview" },
  { name: "Team Directory", href: "/team", icon: Users, section: "Organization" },
  { name: "Rewards", href: "/rewards", icon: Award, section: "Organization" },
  { name: "Media & Assets", href: "/media", icon: ImageIcon, section: "Organization" },
  { name: "Tech Stack", href: "/tech-stacks", icon: Cpu, section: "Management" },
  { name: "Categories", href: "/categories", icon: Layers, section: "Management" },
  { name: "Job Roles", href: "/job-roles", icon: Briefcase, section: "Management" },
  { name: "Settings", href: "/settings", icon: Settings, section: "Preferences" }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, hasHydrated } = useTeamFlow();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("teamflow_sidebar_collapsed") === "true";
      } catch {}
    }
    return false;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("teamflow_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  if (pathname === "/login") {
    return null;
  }

  // Pre-hydration skeleton with dark executive styling
  if (!mounted || !hasHydrated || !currentUser.id) {
    return (
      <aside
        className={`bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none ${
          isCollapsed ? "w-18" : "w-60 md:w-64"
        }`}
        suppressHydrationWarning
      >
        <div>
          <div
            className={`h-16 flex items-center border-b border-slate-800/80 px-4 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Maestrominds Logo"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                    const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (sibling) sibling.style.display = "flex";
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center bg-blue-600 text-white font-black text-sm rounded-xl">
                  M
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col justify-center min-w-0">
                  <span className="font-bold text-[15px] text-white tracking-tight leading-none truncate">
                    Maestrominds
                  </span>
                  <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-1 leading-none truncate">
                    Enterprise PM
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="p-3 space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`h-9 bg-slate-800/70 rounded-lg ${
                  isCollapsed ? "w-10 mx-auto" : "w-full"
                }`}
              />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  const role = currentUser.id ? currentUser.role : "employee";
  const isCeoOrPm = role === "ceo" || role === "project_manager";

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (
      (item.href === "/job-roles" ||
        item.href === "/departments" ||
        item.href === "/categories" ||
        item.href === "/office-leaves" ||
        item.href === "/tech-stacks") &&
      !isCeoOrPm
    ) {
      return false;
    }
    if (role === "ceo" && item.href === "/media") {
      return false;
    }
    if (role === "employee" && item.href === "/team") {
      return false;
    }
    return true;
  });

  const sections: Array<NavItem["section"]> = ["Overview", "Organization", "Management", "Preferences"];

  const roleLabel =
    role === "ceo"
      ? "CEO"
      : role === "project_manager"
      ? "Project Manager"
      : currentUser.jobTitle || "Employee";

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800/90 flex flex-col justify-between shrink-0 select-none shadow-xl z-40 ${
        mounted ? "transition-all duration-200 ease-in-out" : ""
      } ${
        isCollapsed ? "w-18" : "w-60 md:w-64"
      }`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header / Brand */}
        <div
          className={`h-16 flex items-center border-b border-slate-800/80 px-4 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            href="/"
            className={`flex items-center gap-3 overflow-hidden group ${
              isCollapsed ? "justify-center" : ""
            }`}
            title="Maestrominds - Enterprise PM"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Maestrominds Logo"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                    const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (sibling) sibling.style.display = "flex";
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center bg-blue-600 text-white font-black text-sm">
                  M
                </div>
              </div>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col justify-center min-w-0 animate-in fade-in duration-200">
                <span className="font-bold text-[15px] text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors truncate">
                  Maestrominds
                </span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-blue-500/15 text-blue-400 border border-blue-500/25 leading-none">
                    Enterprise
                  </span>
                </div>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-1"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items Grouped by Section */}
        <nav className="p-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar" suppressHydrationWarning>
          {sections.map((secName) => {
            const sectionItems = visibleNavItems.filter((i) => i.section === secName);
            if (sectionItems.length === 0) return null;

            return (
              <div key={secName} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">
                    {secName}
                  </div>
                )}
                {sectionItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`group flex items-center rounded-lg text-[13px] transition-all duration-150 relative ${
                        isCollapsed
                          ? "justify-center p-2.5"
                          : "gap-3 px-3 py-2"
                      } ${
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30 ring-1 ring-blue-500/40"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/70 font-medium"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 stroke-[2] transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card / Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <UserAvatar
                  src={currentUser?.avatar || ""}
                  name={currentUser?.fullName || currentUser?.name || "User"}
                  role={currentUser?.role || "employee"}
                  className="w-8 h-8 rounded-full border border-slate-700 shrink-0"
                  textClassName="text-[11px]"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-white truncate leading-tight">
                  {currentUser?.fullName || currentUser?.name || "User"}
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                  {roleLabel}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
