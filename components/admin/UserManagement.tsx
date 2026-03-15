"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

type UserRole = "admin" | "author" | "editor" | "user";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const ROLE_OPTIONS: UserRole[] = ["admin", "author", "editor", "user"];

const roleBadgeClass: Record<UserRole, string> = {
  admin:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  author:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  editor:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  user: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function UserManagement({ users: initial }: { users: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "author" as UserRole,
  });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)),
      );
      toast.success("Role updated.");
    } catch {
      toast.error("Failed to update role.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed");
      }
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success("User deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as UserRow & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create user");
      setUsers((prev) => [
        {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setForm({ name: "", email: "", password: "", role: "author" });
      setShowCreate(false);
      toast.success("User created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add user button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm rounded-lg hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Create user form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Create New User
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-transparent"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-transparent"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Password *</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-transparent"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                }
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-transparent"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-1.5 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Users table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">
                Name
              </th>
              <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium hidden sm:table-cell">
                Email
              </th>
              <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">
                Role
              </th>
              <th className="text-right px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.map((user) => (
              <tr
                key={user._id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-zinc-400 sm:hidden">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user._id, e.target.value as UserRole)
                    }
                    className={`text-xs font-medium px-2 py-0.5 rounded border-0 cursor-pointer ${roleBadgeClass[user.role]} bg-transparent`}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r} className="bg-white dark:bg-zinc-900">
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-zinc-400">No users found.</div>
        )}
      </div>
    </div>
  );
}
