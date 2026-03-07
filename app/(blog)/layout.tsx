import { ReactNode } from "react";
import NewsletterForm from "@/components/NewsletterForm";
import Navbar from "@/components/blog/Navbar";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-12">{children}</main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Subscribe to the newsletter
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
              Get new articles in your inbox.
            </p>
            <NewsletterForm />
          </div>
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
