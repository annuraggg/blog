import Link from "next/link";
import React from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import NavLink from "./NavLink";
import { connectDB } from "@/lib/db";
import Series from "@/lib/models/Series";

const getSeries = async () => {
  await connectDB();
  return Series.find().sort({ title: 1 }).lean();
};

const Navbar = async () => {
  const seriesList = await getSeries();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center">
        <div className="flex-1">
          <Link
            href="/"
            className="text-3xl font-bold text-zinc-900 dark:text-white"
          >
            {process.env.NEXT_PUBLIC_SITE_NAME}
            <span className="text-blue-500 text-4xl ml-1">.</span>
          </Link>
        </div>

        <nav className="flex items-center gap-6 justify-center flex-1">
          <NavLink href="/">Latest</NavLink>

          {seriesList.map((series: { slug: string; title: string }) => (
            <NavLink key={series.slug} href={`/series/${series.slug}`}>
              {series.title}
            </NavLink>
          ))}
        </nav>

 
        <div className="flex-1 flex justify-end">
          <AnimatedThemeToggler />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
