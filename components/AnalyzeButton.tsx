"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, buttonClass, cx, Spinner } from "./ui";

const STAGES = ["Reading everyone's preferences…", "Finding where the group overlaps…", "Weighing trade-offs…", "Drafting trip options…"];

export function AnalyzeButton({
  code,
  disabled,
  label = "Analyze Trip Options",
  variant = "primary",
  className,
}: {
  code: string;
  disabled?: boolean;
  label?: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4000);
    return () => clearInterval(id);
  }, [loading]);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${code}/analyze`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Analysis failed. Please try again.");
      router.push(`/t/${code}/results`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={analyze}
        disabled={disabled || loading}
        className={cx(buttonClass(variant, "lg"), "w-full", className)}
      >
        {loading ? (
          <>
            <Spinner /> Analyzing…
          </>
        ) : (
          label
        )}
      </button>
      {loading && (
        <p className="text-center text-sm text-muted" aria-live="polite">
          {STAGES[stage]} <span className="text-subtle">Usually 10–30 seconds.</span>
        </p>
      )}
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
