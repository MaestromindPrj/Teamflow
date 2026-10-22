"use client";

import React, { ReactNode } from "react";

export interface SubTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface InPageSubTabsProps<T extends string = string> {
  tabs: SubTabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  rightAction?: ReactNode;
  className?: string;
  id?: string;
}

export default function InPageSubTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  rightAction,
  className = "",
  id,
}: InPageSubTabsProps<T>) {
  return (
    <div
      id={id}
      className={`w-full flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-2 cursor-pointer select-none shrink-0 ${
                isActive
                  ? "bg-[#0084d4] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.icon && (
                <span className="shrink-0 flex items-center justify-center">
                  {tab.icon}
                </span>
              )}
              <span>
                {tab.label}
                {typeof tab.count === "number" && ` (${tab.count})`}
              </span>
            </button>
          );
        })}
      </div>
      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </div>
  );
}
