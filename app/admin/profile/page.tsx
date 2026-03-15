export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import ProfileForm from "@/components/admin/ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("name email image bio website twitter")
    .lean();

  if (!user) redirect("/auth/signin");

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
        My Profile
      </h1>
      <ProfileForm
        user={{
          _id: String(user._id),
          name: user.name,
          email: user.email,
          image: user.image ?? "",
          bio: user.bio ?? "",
          website: user.website ?? "",
          twitter: user.twitter ?? "",
        }}
      />
    </div>
  );
}
