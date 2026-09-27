"use client";

import { buttonClass } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-muted">
        We couldn&apos;t load this page. If you&apos;re running TripMate yourself, check the server logs and that your
        Supabase credentials and schema are set up.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-6 overflow-x-auto rounded-lg bg-bad-soft p-3 text-left text-xs whitespace-pre-wrap text-bad">{error.message}</pre>
      )}
      <button type="button" onClick={reset} className={buttonClass("primary") + " mt-8"}>
        Try again
      </button>
    </main>
  );
}
