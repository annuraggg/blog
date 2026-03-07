import { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PenSquare, LogOut } from "lucide-react";
import AdminNavLinks from "@/components/admin/AdminNavLinks";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || !["admin", "editor"].includes(session.user.role)) {
    redirect("/auth/signin");
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (session.user.email?.length ?? 0) >= 2
      ? session.user.email!.slice(0, 2).toUpperCase()
      : "?";

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        {/* Logo / branding */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white">
            <PenSquare className="h-4 w-4 text-white dark:text-zinc-900" />
          </div>
          <Link
            href="/admin"
            className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight"
          >
            Admin Panel
          </Link>
        </div>

        {/* Nav links (client component for active state) */}
        <AdminNavLinks />

        {/* User profile footer */}
        <div className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {session.user.name ?? session.user.email}
              </p>
              <p className="text-xs text-zinc-400 capitalize">{session.user.role}</p>
            </div>
            <Link
              href="/api/auth/signout"
              title="Sign out"
              className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
