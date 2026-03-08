/**
 * Central blog configuration.
 * All values fall back to environment variables so the same codebase can power
 * multiple blogs simply by changing env vars (or editing this file).
 */

export const blogConfig = {
  /** Public display name of the blog */
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog",

  /** Short description shown in metadata / footer */
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ?? "Thoughts, ideas, and stories",

  /** Canonical base URL (no trailing slash) */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "",

  /** Social links – all optional */
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? "",
    github: process.env.NEXT_PUBLIC_GITHUB_URL ?? "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "",
  },

  /** Email sender settings (server-side only) */
  email: {
    senderName: process.env.BREVO_SENDER_NAME ?? "Blog Newsletter",
    senderEmail: process.env.BREVO_SENDER_EMAIL ?? "",
    templateId: Number(process.env.BREVO_TEMPLATE_ID ?? "5"),
  },
} as const;

export type BlogConfig = typeof blogConfig;
