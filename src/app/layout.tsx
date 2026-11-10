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
  title: "Maestrominds - Enterprise Project Management",
  description: "Advanced Multi-Role Project Operations & Tracking System",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-[#f8fafc] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 font-sans" suppressHydrationWarning>
        <TeamFlowProvider>
          <Suspense fallback={<div className="flex h-screen w-full overflow-hidden" />}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </TeamFlowProvider>
      </body>
    </html>
  );
}
