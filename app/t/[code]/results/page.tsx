import type { Metadata } from "next";
import Link from "next/link";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { CopySummaryButton } from "@/components/CopySummaryButton";
import { OptionCard } from "@/components/OptionCard";
import { Alert, Badge, ButtonLink, Card, cx } from "@/components/ui";
import { isAnalysisStale } from "@/lib/db";
import { formatDateRange, formatMoneyRange, timeAgo } from "@/lib/format";
import { loadLatestAnalysis, loadResponses, loadTrip } from "@/lib/trip-loader";
import type { AnalysisResult, Trip } from "@/lib/types";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await loadTrip((await params).code);
  return { title: `${trip.name} options` };
}

function chatSummary(trip: Trip, result: AnalysisResult): string {
  const lines = [`${trip.name}: trip options from TripMate`, ""];
  result.options.forEach((o, i) => {
    lines.push(
      `${i + 1}. ${o.destination}${o.country ? `, ${o.country}` : ""} (${o.groupFit}% group fit)`,
      `   ${formatMoneyRange(o.costMin, o.costMax, trip.currency)} pp${
        o.suggestedStart && o.suggestedEnd ? ` · ${formatDateRange(o.suggestedStart, o.suggestedEnd)}` : ""
      }`,
      `   ${o.tagline || o.whyItWorks}`,
    );
  });
  lines.push("", "Which one works for you? Let's decide together.");
  return lines.join("\n");
}

function InsightList({
  items,
  tone,
  empty,
}: {
  items: { title: string; detail: string; participants?: string[] }[];
  tone: "good" | "warn";
  empty: string;
}) {
  if (items.length === 0) return <p className="text-sm text-subtle">{empty}</p>;
  return (
    <ul className="space-y-4">
      {items.map((item, i) => (
        <li key={`${item.title}-${i}`} className="flex gap-3">
          <span className={cx("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", tone === "good" ? "bg-good" : "bg-warn")} />
          <div>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">{item.detail}</p>
            {item.participants && item.participants.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.participants.map((p) => (
                  <Badge key={p}>{p}</Badge>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function ResultsPage({ params }: Props) {
  const trip = await loadTrip((await params).code);
  const [responses, analysis] = await Promise.all([loadResponses(trip.id), loadLatestAnalysis(trip.id)]);

  if (!analysis) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">No trip options yet</h2>
        <p className="mt-2 text-muted">
          {responses.length === 0
            ? "Once people have added their preferences, the coordinator can analyse the group from the dashboard."
            : `${responses.length} of ${trip.expectedTravellers} travellers have responded. You can analyse what's in now.`}
        </p>
        <div className="mx-auto mt-8 max-w-xs">
          {responses.length > 0 ? (
            <AnalyzeButton code={trip.code} />
          ) : (
            <ButtonLink href={`/t/${trip.code}/dashboard`} size="lg" className="w-full">
              Go to dashboard
            </ButtonLink>
          )}
        </div>
      </main>
    );
  }

  const { result } = analysis;
  const partial = analysis.responseCount < trip.expectedTravellers;
  const changed = isAnalysisStale(analysis, responses);
  const conflictsAndTradeOffs = [...result.conflicts, ...result.tradeOffs];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Your Group&apos;s Trip Options</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Badge tone={partial ? "warn" : "good"}>
              Based on {analysis.responseCount} of {trip.expectedTravellers} responses
            </Badge>
            <span>Generated {timeAgo(analysis.createdAt)}</span>
          </div>
        </div>
        <Link href={`/t/${trip.code}/dashboard`} className="text-sm font-medium text-brand hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      {changed && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-warn/30 bg-warn-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-warn">
            <span className="font-semibold">Responses have changed since this analysis.</span> There are now{" "}
            {responses.length} response{responses.length === 1 ? "" : "s"}. Re-run to include the latest preferences.
          </p>
          <div className="sm:w-56">
            <AnalyzeButton code={trip.code} label="Re-run analysis" />
          </div>
        </div>
      )}

      {result.overview && <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-ink">{result.overview}</p>}

      {/* Agreement vs trade-offs */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-good" aria-hidden /> Where the group agrees
          </h3>
          <InsightList items={result.agreements} tone="good" empty="No clear areas of agreement yet." />
        </Card>
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-warn" aria-hidden /> Where the group has trade-offs
          </h3>
          <InsightList items={conflictsAndTradeOffs} tone="warn" empty="No major conflicts found." />
        </Card>
      </div>

      {/* Constraints */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Budget", result.constraints.budget],
            ["Dates", result.constraints.dates],
            ["Destination types", result.constraints.destinationTypes],
            ["Trip styles", result.constraints.tripStyles],
          ] as const
        )
          .filter(([, text]) => text)
          .map(([label, text]) => (
            <div key={label} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs font-medium tracking-wide text-subtle uppercase">{label}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{text}</p>
            </div>
          ))}
      </div>

      {/* Options */}
      <div className="mt-12 mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-semibold tracking-tight">
          {result.options.length} option{result.options.length === 1 ? "" : "s"} to discuss
        </h3>
        <p className="text-sm text-subtle">Group fit = the average of each person&apos;s individual fit</p>
      </div>
      <div className={cx("grid gap-6", result.options.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2")}>
        {result.options.map((option, i) => (
          <OptionCard key={`${option.destination}-${i}`} option={option} index={i} currency={trip.currency} />
        ))}
      </div>

      {/* Decision handoff */}
      <div className="mt-12 grid gap-6 rounded-3xl bg-ink p-8 text-white sm:p-10 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">The decision is yours</h3>
          <p className="mt-3 leading-relaxed text-white/70">
            {result.decisionNote ||
              "None of these is the single right answer. Talk through the trade-offs together and pick the one your group is happiest with."}
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <CopySummaryButton text={chatSummary(trip, result)} />
          <p className="text-xs text-white/50">Paste it in your group chat to decide together.</p>
        </div>
      </div>

      <div className="mt-6">
        <Alert tone="brand">
          These options are AI-generated suggestions. Costs and dates are estimates, so check prices before booking.
        </Alert>
      </div>
    </main>
  );
}
