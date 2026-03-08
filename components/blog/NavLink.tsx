"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { useNavStore } from "@/lib/stores/nav-store";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export default function NavLink({
  href,
  children,
}: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href;
  const setNavigating = useNavStore((state) => state.setNavigating);

  return (
    <Link
      href={href}
      onClick={() => {
        if (pathname !== href) setNavigating(true);
      }}
      className={`
        relative inline-block
        dark:text-white/80 text-zinc-900
        after:absolute after:left-0 after:-bottom-1
        after:h-0.5 after:w-full
        after:bg-blue-500
        after:origin-left
        after:transition-transform after:duration-300
        ${active ? "after:scale-x-100 font-bold" : "after:scale-x-0 hover:after:scale-x-100"}
      `}
    >
      {children}
    </Link>
  );
}
