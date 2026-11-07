"use client";

import React from "react";
import Header from "@/components/Header";

export function PageHeaderSkeleton({ title, subtitle }: { title: string; subtitle?: string }) {
  return <Header title={title} subtitle={subtitle || "Loading data..."} />;
}

// 1. Grid of cards skeleton (Categories, Job Roles, Tech Stacks, Office Leaves)
export function CardGridSkeleton({
  title,
  subtitle,
  cardCount = 6,
  columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}: {
  title: string;
  subtitle?: string;
  cardCount?: number;
  columns?: string;
}) {
  return (
    <div className="flex-1 flex flex-col pb-12 animate-in fade-in duration-200">
      <PageHeaderSkeleton title={title} subtitle={subtitle} />
      <div className="px-7 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className={`grid ${columns} gap-3.5`}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <div
              key={i}
              className="p-4.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3.5 animate-pulse"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-6 h-6 rounded bg-slate-100 shrink-0" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-4 w-12 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. Projects page skeleton
export function ProjectsSkeleton() {
  return (
    <div className="flex-1 flex flex-col pb-12 animate-in fade-in duration-200">
      <PageHeaderSkeleton title="Projects" subtitle="Loading workspace portfolios..." />
      <div className="px-7 py-6 space-y-6">
        {/* Controls row */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="h-9 w-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-4 animate-pulse"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-16 bg-slate-100 rounded font-mono" />
                  <div className="h-5 w-44 bg-slate-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <div className="h-3 w-14 bg-slate-100 rounded" />
                  <div className="h-3 w-8 bg-slate-100 rounded" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-slate-200 border border-white" />
                  <div className="w-6 h-6 rounded-full bg-slate-200 border border-white" />
                  <div className="w-6 h-6 rounded-full bg-slate-200 border border-white" />
                </div>
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3. Attendance page skeleton
export function AttendanceSkeleton() {
  return (
    <div className="flex-1 flex flex-col pb-12 animate-in fade-in duration-200">
      <PageHeaderSkeleton title="Attendance & Workday Logs" subtitle="Loading staff clock-in records..." />
      <div className="px-7 py-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2 animate-pulse">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-7 w-16 bg-slate-200 rounded" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        {/* Attendance Table Skeleton */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden animate-pulse">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-100 rounded" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-slate-200 rounded" />
                    <div className="h-2.5 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-3 w-24 bg-slate-100 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Team Directory page skeleton
export function TeamDirectorySkeleton() {
  return (
    <div className="flex-1 flex flex-col pb-12 animate-in fade-in duration-200">
      <PageHeaderSkeleton title="Team Directory" subtitle="Loading organization roster..." />
      <div className="px-7 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-4 animate-pulse">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="h-3 w-40 bg-slate-100 rounded" />
                <div className="h-3 w-28 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 5. Media Vault page skeleton
export function MediaVaultSkeleton() {
  return (
    <div className="flex-1 flex flex-col pb-12 animate-in fade-in duration-200">
      <PageHeaderSkeleton title="Deliverables & Asset Vault" subtitle="Loading enterprise assets..." />
      <div className="px-7 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2 animate-pulse">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-6 w-14 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 animate-pulse">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Rewards page skeleton
export function RewardsSkeleton() {
  return (
    <div className="flex-1 flex flex-col pb-12 animate-in fade-in duration-200">
      <PageHeaderSkeleton title="Rewards & Recognition" subtitle="Loading gamified ledger..." />
      <div className="px-7 py-6 space-y-6">
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-slate-100 rounded" />
            <div className="h-8 w-36 bg-slate-200 rounded" />
          </div>
          <div className="h-9 w-32 bg-slate-200 rounded-lg" />
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-5 space-y-4 animate-pulse">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. Settings page skeleton
export function SettingsSkeleton() {
  return (
    <div className="flex-1 flex flex-col pb-12 animate-in fade-in duration-200">
      <PageHeaderSkeleton title="Settings & Profile" subtitle="Loading account profile..." />
      <div className="px-7 py-6 max-w-4xl space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-3.5 w-32 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-9 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-9 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 8. Task Detail page skeleton
export function TaskDetailSkeleton() {
  return (
    <div className="flex-1 flex flex-col pb-12 animate-in fade-in duration-200">
      <PageHeaderSkeleton title="Task Details" subtitle="Loading ticket specifications..." />
      <div className="px-7 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-slate-100 rounded" />
          <div className="h-4 w-4 bg-slate-100 rounded" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5 animate-pulse">
            <div className="h-6 w-3/4 bg-slate-200 rounded" />
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
              <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
            </div>
            <div className="h-40 bg-slate-100 rounded-lg" />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4 animate-pulse">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="space-y-3">
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

