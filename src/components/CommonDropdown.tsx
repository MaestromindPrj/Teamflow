"use client";

import React, { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CommonDropdownProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  options?: DropdownOption[];
  icon?: React.ReactNode;
  containerClassName?: string;
}

const CommonDropdown = forwardRef<HTMLSelectElement, CommonDropdownProps>(
  ({ value, onChange, options, children, icon, className = "", containerClassName = "", ...props }, ref) => {
    return (
      <div className={`relative inline-flex items-center ${containerClassName}`}>
        {icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 flex items-center justify-center">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`common-dropdown h-9 text-[12px] font-medium bg-white border border-slate-200/90 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50/60 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all shadow-2xs cursor-pointer appearance-none pl-3 pr-8 ${
            icon ? "pl-8" : ""
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform" />
      </div>
    );
  }
);

CommonDropdown.displayName = "CommonDropdown";

export default CommonDropdown;

