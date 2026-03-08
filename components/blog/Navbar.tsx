import Link from "next/link";
import React from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import NavLink from "./NavLink";
import MobileNav from "./MobileNav";
import { connectDB } from "@/lib/db";
import Series from "@/lib/models/Series";

const getSeries = async () => {
  await connectDB();
  return Series.find().sort({ title: 1 }).lean();
};

const Navbar = async () => {
  const seriesList = await getSeries();
  const navItems = [
    { href: "/", label: "Latest" },
    ...seriesList.map((s: { slug: string; title: string }) => ({
      href: `/series/${s.slug}`,
      label: s.title,
    })),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center">
        <div className="flex-1">
          <Link
            href="/"
            className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white"
          >
            {process.env.NEXT_PUBLIC_SITE_NAME}
            <span className="text-blue-500 text-3xl md:text-4xl ml-1">.</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 justify-center flex-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 flex justify-end items-center gap-3">
          <AnimatedThemeToggler />
          {/* Mobile nav trigger */}
          <MobileNav items={navItems} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
