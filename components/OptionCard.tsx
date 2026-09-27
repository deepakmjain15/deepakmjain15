import type { TripOption } from "@/lib/types";
import { formatDateRange, formatMoneyRange } from "@/lib/format";
import { Badge, Card, FitValue, fitLabel, ProgressBar } from "./ui";
import { fitTone } from "@/lib/format";

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-good" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

function Minus() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-warn" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 8h8" />
    </svg>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">{children}</p>;
}

export function OptionCard({ option, index, currency }: { option: TripOption; index: number; currency: string }) {
  const tone = fitTone(option.groupFit);
  const compromises = option.individualFit.filter((f) => f.compromise);

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-line p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">Option {index + 1}</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight">{option.destination}</h3>
            {option.country && <p className="text-sm text-muted">{option.country}</p>}
          </div>
          <div className="shrink-0 text-right">
            <FitValue fit={option.groupFit} className="text-3xl" />
            <p className="text-xs text-subtle">group fit</p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={option.groupFit} tone="fit" label={`Group fit ${option.groupFit}%`} />
        </div>
        {option.tagline && <p className="mt-3 text-sm font-medium text-ink">{option.tagline}</p>}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge tone="brand">{formatMoneyRange(option.costMin, option.costMax, currency)} pp</Badge>
          {option.suggestedStart && option.suggestedEnd && <Badge>{formatDateRange(option.suggestedStart, option.suggestedEnd)}</Badge>}
          <Badge tone={tone === "high" ? "good" : tone === "mid" ? "warn" : "bad"}>{fitLabel(option.groupFit)}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <Label>Why it works</Label>
          <p className="text-sm leading-relaxed text-ink">{option.whyItWorks}</p>
        </div>

        {option.strengths.length > 0 && (
          <div>
            <Label>Strengths</Label>
            <ul className="space-y-1.5">
              {option.strengths.map((s) => (
                <li key={s} className="flex gap-2 text-sm leading-snug">
                  <Check />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {option.tradeOffs.length > 0 && (
          <div>
            <Label>Trade-offs</Label>
            <ul className="space-y-1.5">
              {option.tradeOffs.map((t) => (
                <li key={t} className="flex gap-2 text-sm leading-snug">
                  <Minus />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-3 rounded-xl bg-paper p-4 text-sm">
          <div>
            <p className="text-xs text-subtle">Approximate cost per person</p>
            <p className="font-semibold tabular-nums">{formatMoneyRange(option.costMin, option.costMax, currency)}</p>
            {option.costNote && <p className="mt-0.5 text-xs text-muted">{option.costNote}</p>}
          </div>
          <div>
            <p className="text-xs text-subtle">Suggested dates</p>
            <p className="font-semibold">
              {option.suggestedStart && option.suggestedEnd ? formatDateRange(option.suggestedStart, option.suggestedEnd) : "Flexible"}
            </p>
            {option.datesNote && <p className="mt-0.5 text-xs text-muted">{option.datesNote}</p>}
          </div>
        </div>

        {/* Individual fit */}
        <div className="mt-auto">
          <Label>Fit for each person</Label>
          <ul className="space-y-3">
            {option.individualFit.map((f) => (
              <li key={f.name}>
                <div className="grid grid-cols-[minmax(0,88px)_1fr_40px] items-center gap-3 text-sm">
                  <span className="truncate font-medium" title={f.name}>
                    {f.name}
                  </span>
                  <ProgressBar value={f.fit ?? 0} tone="fit" size="sm" label={`${f.name} fit`} />
                  <FitValue fit={f.fit} className="text-right text-xs" />
                </div>
                {f.note && <p className="mt-1 text-xs leading-relaxed text-muted">{f.note}</p>}
              </li>
            ))}
          </ul>
          {compromises.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl bg-warn-soft p-4">
              <p className="text-xs font-semibold text-warn">Compromises needed</p>
              {compromises.map((f) => (
                <p key={f.name} className="text-xs leading-relaxed text-warn">
                  <span className="font-semibold">{f.name}:</span> {f.compromise}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
