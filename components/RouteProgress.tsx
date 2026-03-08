"use client";

import { motion, useAnimation } from "motion/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNavStore } from "@/lib/stores/nav-store";

// Fallback timeout (ms) in case navigation doesn't complete normally
const FALLBACK_TIMEOUT_MS = 10000;

export function RouteProgress({ className }: { className?: string }) {
  const controls = useAnimation();
  const pathname = usePathname();
  const navigating = useNavStore((state) => state.navigating);
  const setNavigating = useNavStore((state) => state.setNavigating);

  useEffect(() => {
    setNavigating(false);
  }, [pathname, setNavigating]);

  useEffect(() => {
    if (!navigating) return;

    controls.set({ scaleX: 0, opacity: 1 });
    controls.start({
      scaleX: [0, 0.4, 0.6, 0.8],
      transition: { duration: 0.8, ease: "easeOut" },
    });

    const timer = setTimeout(() => {
      setNavigating(false);
    }, FALLBACK_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [navigating, controls, setNavigating]);

  if (!navigating) return null;

  return (
    <motion.div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] h-1 bg-blue-500 origin-left",
        className
      )}
      animate={controls}
      style={{ scaleX: 0 }}
    />
  );
}
