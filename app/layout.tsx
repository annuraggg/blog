import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { RouteProgress } from "@/components/RouteProgress";
import { Lora } from "next/font/google";

import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: {
    template: "%s | " + process.env.NEXT_PUBLIC_SITE_NAME,
    default: process.env.NEXT_PUBLIC_SITE_NAME || "",
  },
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "",
};

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lora.className} font-sans `}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RouteProgress />
          {children}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
