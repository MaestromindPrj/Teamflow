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
  ChevronRight
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutGrid },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Company Holidays", href: "/office-leaves", icon: CalendarRange },
  { name: "Team Directory", href: "/team", icon: Users },
  { name: "Rewards", href: "/rewards", icon: Award },
  { name: "Tech Stack", href: "/tech-stacks", icon: Cpu },
  { name: "Categories", href: "/categories", icon: Layers },
  { name: "Job Roles", href: "/job-roles", icon: Briefcase },
  { name: "Media & Assets", href: "/media", icon: ImageIcon },
  { name: "Settings", href: "/settings", icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, users, hasHydrated } = useTeamFlow();
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

  if (!mounted || !hasHydrated || !currentUser.id) {
    return (
      <aside
        className={`bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none ${
          isCollapsed ? "w-18" : "w-56 md:w-64"
        }`}
        suppressHydrationWarning
      >
        <div>
          <div
            className={`h-16 flex items-center border-b border-slate-100 px-3.5 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
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
                <div className="hidden w-full h-full items-center justify-center bg-linear-to-tr from-[#0084d4] to-[#0284c7] text-white font-black text-sm rounded-xl">
                  M
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col justify-center min-w-0">
                  <span className="font-bold text-[16px] text-slate-900 tracking-tight leading-none truncate">
                    Maestrominds
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1 leading-none truncate">
                    Enterprise PM
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="p-3 space-y-1.5 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`h-9.5 bg-slate-100 rounded-lg ${
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

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none ${
        mounted ? "transition-all duration-200 ease-in-out" : ""
      } ${
        isCollapsed ? "w-18" : "w-56 md:w-64"
      }`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header / Brand */}
        <div
          className={`h-16 flex items-center border-b border-slate-100 px-3.5 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            href="/"
            className={`flex items-center gap-2.5 overflow-hidden ${
              isCollapsed ? "justify-center" : ""
            }`}
            title="Maestrominds - Enterprise PM"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
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
              <div className="hidden w-full h-full items-center justify-center bg-linear-to-tr from-[#0084d4] to-[#0284c7] text-white font-black text-sm rounded-xl">
                M
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col justify-center min-w-0 animate-in fade-in duration-200">
                <span className="font-bold text-[16px] text-slate-900 tracking-tight leading-none truncate">
                  Maestrominds
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1 leading-none truncate">
                  Enterprise PM
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-1"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 overflow-y-auto flex-1" suppressHydrationWarning>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`flex items-center rounded-lg text-[13px] transition-all duration-150 ${
                  isCollapsed
                    ? "justify-center p-2.5"
                    : "gap-3 px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-[#0084d4] text-white font-medium shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-normal"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 stroke-[2] ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Collapse Toggle Footer */}
      <div className="p-2 border-t border-slate-100">
        <button
          type="button"
          onClick={toggleSidebar}
          className={`w-full flex items-center rounded-lg text-[12px] text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors cursor-pointer py-2 ${
            isCollapsed ? "justify-center px-2" : "px-3 justify-between"
          }`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          ) : (
            <>
              <span> </span>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
