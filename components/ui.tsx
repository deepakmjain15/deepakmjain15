// Small, dependency-free UI primitives shared across pages.

import Link from "next/link";
import { fitTone } from "@/lib/format";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse" | "ghostInverse";
type ButtonSize = "md" | "lg";

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    size === "lg" ? "h-12 px-6 text-[15px]" : "h-10 px-4 text-sm",
    variant === "primary" && "bg-brand text-white hover:bg-brand-hover",
    variant === "secondary" && "border border-line-strong bg-surface text-ink hover:bg-paper",
    variant === "ghost" && "text-muted hover:bg-black/[0.04] hover:text-ink",
    variant === "inverse" && "bg-white text-ink hover:bg-white/90",
    variant === "ghostInverse" && "text-white hover:bg-white/10",
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cx(buttonClass(variant, size), className)}>
      {children}
    </Link>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("rounded-2xl border border-line bg-surface", className)}>{children}</div>;
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-base font-semibold text-ink">{children}</h2>
      {hint && <div className="text-sm text-subtle">{hint}</div>}
    </div>
  );
}

type BadgeTone = "neutral" | "brand" | "good" | "warn" | "bad";

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone === "neutral" && "bg-black/[0.05] text-muted",
        tone === "brand" && "bg-brand-soft text-brand-ink",
        tone === "good" && "bg-good-soft text-good",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "bad" && "bg-bad-soft text-bad",
      )}
    >
      {children}
    </span>
  );
}

const TONE_BAR = { high: "bg-good", mid: "bg-warn", low: "bg-bad", none: "bg-line-strong" } as const;
const TONE_TEXT = { high: "text-good", mid: "text-warn", low: "text-bad", none: "text-subtle" } as const;

export function ProgressBar({
  value,
  tone = "brand",
  size = "md",
  label,
}: {
  value: number; // 0–100
  tone?: "brand" | "fit";
  size?: "sm" | "md";
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const color = tone === "fit" ? TONE_BAR[fitTone(pct)] : "bg-brand";
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cx("w-full overflow-hidden rounded-full bg-black/[0.06]", size === "sm" ? "h-1.5" : "h-2")}
    >
      <div className={cx("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function FitValue({ fit, className }: { fit: number | null; className?: string }) {
  return (
    <span className={cx("tabular-nums font-semibold", TONE_TEXT[fitTone(fit)], className)}>
      {fit === null ? "—" : `${fit}%`}
    </span>
  );
}

export function fitLabel(fit: number | null): string {
  const tone = fitTone(fit);
  return tone === "high" ? "Strong fit" : tone === "mid" ? "Some compromise" : tone === "low" ? "Big compromise" : "Not assessed";
}

export function Alert({ tone = "bad", children }: { tone?: "bad" | "warn" | "brand"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "bad" ? "alert" : "status"}
      className={cx(
        "rounded-xl px-4 py-3 text-sm",
        tone === "bad" && "bg-bad-soft text-bad",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "brand" && "bg-brand-soft text-brand-ink",
      )}
    >
      {children}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const inputClass =
  "block w-full rounded-lg border border-line-strong bg-surface px-3.5 h-11 text-[15px] text-ink placeholder:text-subtle " +
  "focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15";

export const textareaClass = inputClass.replace("h-11", "min-h-[84px] py-2.5 resize-y");

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-subtle">{hint}</p>}
    </div>
  );
}
