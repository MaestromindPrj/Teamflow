"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Calendar,
  Users,
  FolderKanban,
  Award,
  Settings,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Image as ImageIcon
} from "lucide-react";
import { useTeamFlow } from "@/context/TeamFlowContext";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutGrid },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Team Directory", href: "/team", icon: Users },
  { name: "Media & Assets", href: "/media", icon: ImageIcon },
  { name: "Rewards", href: "/rewards", icon: Award }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useTeamFlow();

  const getRoleIcon = () => {
    switch (currentUser.role) {
      case "ceo":
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />;
      case "project_manager":
        return <Briefcase className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-[#4ade1d]" />;
    }
  };

  const getRoleBadgeText = () => {
    switch (currentUser.role) {
      case "ceo":
        return "CEO";
      case "project_manager":
        return "Project Manager";
      default:
        return "Employer";
    }
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (currentUser.role === "ceo" && item.href === "/media") {
      return false;
    }
    if (currentUser.role === "employer" && item.href === "/team") {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-56 md:w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none">
      <div>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-[#0084d4] to-[#0284c7] flex items-center justify-center text-white shadow-xs">
              <svg
                className="w-4.5 h-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="3" width="6" height="5" rx="1.5" />
                <rect x="3" y="15" width="6" height="5" rx="1.5" />
                <rect x="15" y="15" width="6" height="5" rx="1.5" />
                <path d="M12 8v4" />
                <path d="M6 12h12" />
                <path d="M6 12v3" />
                <path d="M18 12v3" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-[16px] text-slate-900 tracking-tight block leading-tight">
                TeamFlow
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Enterprise PM
              </span>
            </div>
          </Link>
        </div>

        <nav className="p-3 space-y-1">
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

      <div className="p-3 border-t border-slate-100">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] transition-colors mb-2 ${
            pathname === "/settings"
              ? "bg-[#0084d4] text-white font-medium shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-normal"
          }`}
        >
          <Settings
            className={`w-4 h-4 shrink-0 stroke-[2] ${
              pathname === "/settings" ? "text-white" : "text-slate-500"
            }`}
          />
          <span>Settings</span>
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100 bg-slate-50/50"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-slate-900 leading-tight truncate">
                {currentUser.name}
              </p>
              {getRoleIcon()}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
              {getRoleBadgeText()}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
