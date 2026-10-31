"use client";

import { useState, useEffect } from "react";

export interface UserAvatarProps {
  src?: string | null;
  name?: string;
  role?: string;
  className?: string;
  textClassName?: string;
  alt?: string;
  title?: string;
}

export function getInitials(name?: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getRoleBadgeStyle(role?: string): string {
  switch (role) {
    case "ceo":
      return "bg-amber-100 text-amber-800 border-amber-200/80";
    case "project_manager":
      return "bg-purple-100 text-purple-800 border-purple-200/80";
    case "employer":
    default:
      return "bg-sky-100 text-[#0084d4] border-sky-200/80";
  }
}

export default function UserAvatar({
  src,
  name = "User",
  role,
  className = "w-8 h-8 rounded-full",
  textClassName,
  alt,
  title,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const initials = getInitials(name);
  const roleStyle = getRoleBadgeStyle(role);

  const cleanSrc = src && typeof src === "string" ? src.trim() : "";

  const computedTextClass = () => {
    if (textClassName) return textClassName;
    if (className.includes("w-18") || className.includes("w-16")) return "text-[18px]";
    if (className.includes("w-14") || className.includes("w-12")) return "text-[14px]";
    if (className.includes("w-10")) return "text-[12px]";
    if (className.includes("w-6") || className.includes("w-5") || className.includes("w-4")) return "text-[9px]";
    if (className.includes("w-7") || className.includes("w-8")) return "text-[11px]";
    return "text-[11px]";
  };

  if (!cleanSrc || imgError) {
    return (
      <div
        className={`${className} flex items-center justify-center font-bold border shrink-0 select-none ${roleStyle} ${computedTextClass()}`}
        title={title || name}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={cleanSrc}
      alt={alt || name}
      title={title || name}
      onError={() => setImgError(true)}
      className={`${className} object-cover shrink-0`}
    />
  );
}

