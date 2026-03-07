import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Authentication Error</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Something went wrong during sign in.</p>
        <Link href="/auth/signin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Try again
        </Link>
      </div>
    </div>
  );
}
