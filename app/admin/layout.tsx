import { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || !["admin", "editor"].includes(session.user.role)) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/admin" className="text-xl font-bold text-zinc-900 dark:text-white">
            Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/posts", label: "Posts" },
            { href: "/admin/posts/new", label: "New Post" },
            { href: "/admin/series", label: "Series" },
            { href: "/admin/comments", label: "Comments" },
            { href: "/admin/analytics", label: "Analytics" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">{session.user.email}</p>
          <p className="text-xs text-zinc-400 capitalize">{session.user.role}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div>{children}</div>
      </main>
    </div>
  );
}
