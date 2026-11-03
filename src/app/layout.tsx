import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AppShell from "@/components/AppShell";
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
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-[#f8fafc] text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900 font-sans" suppressHydrationWarning>
        <TeamFlowProvider>
          <Suspense fallback={<div className="flex h-screen w-full overflow-hidden" />}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </TeamFlowProvider>
      </body>
    </html>
  );
}
