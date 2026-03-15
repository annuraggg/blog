export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import UserManagement from "@/components/admin/UserManagement";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/admin");
  }

  await connectDB();
  const users = await User.find({})
    .sort({ createdAt: -1 })
    .select("name email role createdAt")
    .lean();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
        User Management
      </h1>
      <UserManagement
        users={users.map((u) => ({
          _id: String(u._id),
          name: u.name,
          email: u.email,
          role: u.role as "admin" | "author" | "editor" | "user",
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
