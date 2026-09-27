"use client";

import { useEffect, useState } from "react";
import { buttonClass, cx } from "./ui";

// Shows the shareable trip URL with copy + native share. The origin is read in the browser,
// so the link is correct on localhost, preview deployments and production alike.
export function ShareLink({ code, tripName, compact = false }: { code: string; tripName: string; compact?: boolean }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
  }, []);

  const url = origin ? `${origin}/t/${code}` : `/t/${code}`;
  const message = `Add your preferences for "${tripName}" on TripMate so we can finally pick a trip: ${url}`;

  async function copy(text: string, what: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      window.prompt("Copy this:", text);
    }
  }

  async function share() {
    try {
      await navigator.share({ title: tripName, text: message, url });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className={cx("space-y-3", compact && "space-y-2")}>
      <div className="flex items-stretch gap-2">
        <div className="flex min-w-0 flex-1 items-center rounded-lg border border-line-strong bg-paper px-3.5 text-sm">
          <span className="truncate font-mono text-[13px] text-ink" title={url}>
            {url}
          </span>
        </div>
        <button type="button" onClick={() => copy(url, "link")} className={buttonClass("primary")}>
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => copy(code, "code")}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-muted hover:text-ink"
        >
          Code <span className="font-mono font-semibold tracking-widest text-ink">{code}</span>
          <span className="text-xs text-subtle">{copied === "code" ? "copied" : "copy"}</span>
        </button>
        <button type="button" onClick={() => copy(message, "link")} className="rounded-lg px-3 py-1.5 text-muted hover:bg-black/[0.04] hover:text-ink">
          Copy invite message
        </button>
        {canShare && (
          <button type="button" onClick={share} className="rounded-lg px-3 py-1.5 text-muted hover:bg-black/[0.04] hover:text-ink">
            Share…
          </button>
        )}
      </div>
    </div>
  );
}
