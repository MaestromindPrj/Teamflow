"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <main className="w-full min-h-screen h-full overflow-y-auto">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100/60 antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#f8fafc]">
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
