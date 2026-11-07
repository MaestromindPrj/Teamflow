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
  Cpu
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === "/login") {
    return null;
  }

  if (!mounted || !hasHydrated) {
    return (
      <aside className="w-56 md:w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none" suppressHydrationWarning>
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
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
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-bold text-[16px] text-slate-900 tracking-tight leading-none">
                  Maestrominds
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1 leading-none">
                  Enterprise PM
                </span>
              </div>
            </Link>
          </div>
          <div className="p-3 space-y-1.5 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9.5 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  const activeUser = currentUser.id ? currentUser : (users[0] || currentUser);
  const role = activeUser.role || "employer";
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
    if (role === "employer" && item.href === "/team") {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-56 md:w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none">
      <div>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5">
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
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-bold text-[16px] text-slate-900 tracking-tight leading-none">
                Maestrominds
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1 leading-none">
                Enterprise PM
              </span>
            </div>
          </Link>
        </div>

        <nav className="p-3 space-y-1" suppressHydrationWarning>
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] transition-all duration-150 ${
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
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
