"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  BookOpen,
  MessageSquare,
  BarChart2,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    isActive: (p: string) => p === "/admin",
  },
  {
    href: "/admin/posts",
    label: "Posts",
    icon: FileText,
    // Active on /admin/posts and /admin/posts/[id]/... but NOT on /admin/posts/new
    isActive: (p: string) =>
      p === "/admin/posts" ||
      (p.startsWith("/admin/posts/") && p !== "/admin/posts/new"),
  },
  {
    href: "/admin/posts/new",
    label: "New Post",
    icon: FilePlus,
    isActive: (p: string) => p === "/admin/posts/new",
  },
  {
    href: "/admin/series",
    label: "Series",
    icon: BookOpen,
    isActive: (p: string) =>
      p === "/admin/series" || p.startsWith("/admin/series/"),
  },
  {
    href: "/admin/comments",
    label: "Comments",
    icon: MessageSquare,
    isActive: (p: string) =>
      p === "/admin/comments" || p.startsWith("/admin/comments/"),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart2,
    isActive: (p: string) =>
      p === "/admin/analytics" || p.startsWith("/admin/analytics/"),
  },
];

export default function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon, isActive }) => {
        const active = isActive(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
              active
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${active ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}`}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
