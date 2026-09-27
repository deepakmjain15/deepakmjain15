"use client";

import { useState } from "react";
import { buttonClass } from "./ui";

// Copies a plain-text summary of the options, ready to paste into the group chat.
export function CopySummaryButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const withLink = `${text}\n\nFull details: ${window.location.href}`;
    try {
      await navigator.clipboard.writeText(withLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this summary:", withLink);
    }
  }

  return (
    <button type="button" onClick={copy} className={buttonClass("inverse", "lg")}>
      {copied ? "Copied to clipboard" : "Copy summary for the group chat"}
    </button>
  );
}
