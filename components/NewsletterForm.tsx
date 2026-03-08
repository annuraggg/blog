"use client";

import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing!");
        setEmail("");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <section>
      <div className="relative mx-auto max-w-5xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 px-8 py-14 text-center">
        {/* Description */}
        <p className="max-w-2xl mx-auto mb-8 leading-relaxed text-3xl text-zinc-700 dark:text-zinc-300">
          I share the lessons I learned the hard way.
        </p>

        {/* Form */}
        {status === "success" ? (
          <p className="text-green-600 dark:text-green-400 font-medium">
            {message}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center gap-3 justify-center max-w-xl mx-auto"
          >
            <input
              type="email"
              required
              placeholder="anurag@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium hover:opacity-90 transition"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        )}

        {/* Error */}
        {status === "error" && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-3">
            {message}
          </p>
        )}

        {/* Disclaimer */}
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 font-sans">
          No spam ever. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
