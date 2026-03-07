import { ReactNode } from "react";
import Navbar from "@/components/blog/Navbar";
import Footer from "@/components/blog/Footer";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12">{children}</main>
      <Footer />
    </div>
  );
}
