import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { TeamFlowProvider } from "@/context/TeamFlowContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TeamFlow - Enterprise Project Management",
  description: "Advanced Multi-Role Project Operations & Tracking System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-[#f8fafc] text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900 font-sans">
        <TeamFlowProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <Suspense fallback={<aside className="w-56 md:w-64 bg-white border-r border-slate-200" />}>
              <Sidebar />
            </Suspense>
            <main className="flex-1 flex flex-col h-full overflow-y-auto">
              {children}
            </main>
          </div>
        </TeamFlowProvider>
      </body>
    </html>
  );
}
