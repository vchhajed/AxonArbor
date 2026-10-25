"use client";

import type { ReactNode } from "react";
import { useIsEditing } from "@/components/editing-context";

/**
 * Renders a section (or one list item) only when its "Show on the site"
 * switch is on. In the admin editor a hidden one still appears, dimmed and
 * labelled, so it can be found and filled in before it goes live.
 */
export function Hideable({
  show,
  as: Tag = "div",
  className = "",
  children,
}: {
  show: boolean;
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
}) {
  const editing = useIsEditing();
  if (show) return <Tag className={className}>{children}</Tag>;
  if (!editing) return null;
  return (
    <Tag className={`relative outline-2 -outline-offset-2 outline-grey-400 outline-dashed ${className}`}>
      <p className="absolute top-3 left-3 z-20 bg-ink px-3 py-1.5 text-xs text-paper">
        Hidden on the live site. Turn on “Show on the site” in All settings.
      </p>
      <div className="opacity-50">{children}</div>
    </Tag>
  );
}
