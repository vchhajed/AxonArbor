"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/admin/actions";
import { PublishControls } from "./PublishControls";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/admin/edit/home", label: "Edit website", icon: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" },
  { href: "/admin/enquiries", label: "Enquiries", icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
  { href: "/admin/consultants", label: "Consultants", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
  { href: "/admin/network", label: "Trainer network", icon: "M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a5 5 0 0 1 10 0M12 20a5 5 0 0 1 10 0" },
  { href: "/admin/companies", label: "Companies", icon: "M4 21V5h10v16M14 9h6v12M7 9h4M7 13h4M7 17h4M4 21h17" },
  { href: "/admin/media", label: "Images", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01" },
  { href: "/admin/history", label: "Publish history", icon: "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-5 shrink-0">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminShell({
  email,
  changedPages,
  newEnquiries,
  pending,
  children,
}: {
  email: string;
  changedPages: string[];
  newEnquiries: number;
  pending: { consultants: number; companies: number };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href.replace(/\/home$/, ""));

  return (
    <div className="min-h-dvh bg-grey-50 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-grey-200 bg-ink text-paper lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0">
        <div className="flex items-center justify-between px-6 py-5 lg:block">
          <Link href="/admin" className="font-serif text-xl">
            Axon Arbor
          </Link>
          <p className="eyebrow text-grey-400 lg:mt-1">Admin</p>
        </div>
        <nav aria-label="Admin" className="overflow-x-auto px-3 pb-3 lg:flex-1 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                      active ? "bg-paper text-ink" : "text-grey-300 hover:bg-grey-800 hover:text-paper"
                    }`}
                  >
                    <Icon d={item.icon} />
                    {item.label}
                    {(() => {
                      const count = { "/admin/enquiries": newEnquiries, "/admin/consultants": pending.consultants, "/admin/companies": pending.companies }[item.href] ?? 0;
                      return count > 0 ? (
                        <span className="ml-auto bg-amber px-2 py-0.5 font-label text-[0.65rem] font-bold text-ink">{count}</span>
                      ) : null;
                    })()}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hidden border-t border-grey-800 px-6 py-5 text-sm lg:block">
          <p className="truncate text-grey-300" title={email}>
            {email}
          </p>
          <div className="mt-3 flex gap-4">
            <a href="/" target="_blank" rel="noreferrer" className="text-grey-400 hover:text-amber">
              View site ↗
            </a>
            <form action={signOut}>
              <button type="submit" className="text-grey-400 hover:text-amber">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-grey-200 bg-paper/95 px-6 py-3 backdrop-blur lg:px-10">
          <PublishControls changedPages={changedPages} />
          <form action={signOut} className="lg:hidden">
            <button type="submit" className="text-sm text-grey-600 hover:text-ink">
              Sign out
            </button>
          </form>
        </header>
        <main className="px-6 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
