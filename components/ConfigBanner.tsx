import { missingServerEnv } from "@/lib/env";

// Shown at the top of every page when server credentials are missing, so setup problems are obvious.
export function ConfigBanner() {
  const missing = missingServerEnv();
  if (missing.length === 0) return null;
  return (
    <div className="bg-warn-soft text-warn">
      <div className="mx-auto max-w-6xl px-4 py-2.5 text-sm sm:px-6">
        <span className="font-semibold">Setup needed:</span> add{" "}
        {missing.map((m, i) => (
          <span key={m}>
            <code className="rounded bg-white/60 px-1 font-mono text-[13px]">{m}</code>
            {i < missing.length - 1 ? ", " : ""}
          </span>
        ))}{" "}
        to <code className="font-mono text-[13px]">.env.local</code> (or your Vercel project settings) and restart. See
        README.md.
      </div>
    </div>
  );
}
