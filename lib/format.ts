// Small display helpers. Safe for server and client.

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en")}`;
  }
}

export function formatMoneyRange(min: number, max: number, currency: string): string {
  if (!min && !max) return "—";
  if (min === max || !min) return formatMoney(max, currency);
  return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
}

// Dates are stored as YYYY-MM-DD; format them in UTC so they never shift by a day.
export function formatDate(iso: string, opts: { year?: boolean } = {}): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(opts.year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

export function formatDateRange(start: string, end: string): string {
  if (!start || !end) return "—";
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatDate(start, { year: !sameYear })} – ${formatDate(end, { year: true })}`;
}

export function daysBetween(start: string, end: string): number {
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function fitTone(fit: number | null): "high" | "mid" | "low" | "none" {
  if (fit === null) return "none";
  if (fit >= 75) return "high";
  if (fit >= 55) return "mid";
  return "low";
}
