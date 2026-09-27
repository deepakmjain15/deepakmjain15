import type { Metadata } from "next";
import Link from "next/link";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { ShareLink } from "@/components/ShareLink";
import { Badge, Card, ProgressBar, SectionTitle } from "@/components/ui";
import { isAnalysisStale, nameKey } from "@/lib/db";
import { formatDateRange, formatMoney, timeAgo } from "@/lib/format";
import { summarise, type Tally } from "@/lib/summary";
import { loadLatestAnalysis, loadResponses, loadTrip } from "@/lib/trip-loader";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await loadTrip((await params).code);
  return { title: `${trip.name} dashboard` };
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink">
      {initials}
    </span>
  );
}

function TallyBars({ items, total }: { items: Tally[]; total: number }) {
  const shown = items.filter((t) => t.count > 0);
  if (shown.length === 0) return <p className="text-sm text-subtle">No preferences yet.</p>;
  return (
    <ul className="space-y-2.5">
      {shown.map((t) => (
        <li key={t.label} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 text-sm" title={t.names.join(", ")}>
          <span className="text-ink">{t.label}</span>
          <ProgressBar value={(t.count / total) * 100} size="sm" label={`${t.label}: ${t.count} of ${total}`} />
          <span className="w-10 text-right text-xs text-subtle tabular-nums">
            {t.count}/{total}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function DashboardPage({ params }: Props) {
  const trip = await loadTrip((await params).code);
  const [responses, analysis] = await Promise.all([loadResponses(trip.id), loadLatestAnalysis(trip.id)]);
  const summary = summarise(responses);

  const count = responses.length;
  const expected = Math.max(trip.expectedTravellers, count);
  const pendingCount = Math.max(0, trip.expectedTravellers - count);
  const coordinatorPending = !responses.some((r) => nameKey(r.name) === nameKey(trip.coordinatorName));
  const stale = analysis ? isAnalysisStale(analysis, responses) : false;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Responses received</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
                  {count}
                  <span className="text-2xl text-subtle"> / {trip.expectedTravellers}</span>
                </p>
              </div>
              {count >= trip.expectedTravellers ? (
                <Badge tone="good">Everyone has responded</Badge>
              ) : count === 0 ? (
                <Badge>Waiting for first response</Badge>
              ) : (
                <Badge tone="warn">{pendingCount} still to respond</Badge>
              )}
            </div>
            <div className="mt-4">
              <ProgressBar value={(count / expected) * 100} label="Responses received" />
            </div>
          </Card>

          {/* Participants */}
          <Card className="p-6">
            <SectionTitle hint={`${count} submitted · ${pendingCount} pending`}>Travellers</SectionTitle>
            {count === 0 ? (
              <div className="rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
                <p className="font-medium">No responses yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Share the trip link with your group. Responses appear here as soon as they&apos;re submitted.
                </p>
                <Link href={`/t/${trip.code}`} className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
                  Add your own preferences first →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {responses.map((r) => (
                  <li key={r.participantId} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0">
                    <Initials name={r.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {r.name}
                        {nameKey(r.name) === nameKey(trip.coordinatorName) && (
                          <span className="ml-2 text-xs font-normal text-subtle">coordinator</span>
                        )}
                      </p>
                      <p className="text-sm text-muted">
                        Up to {formatMoney(r.budgetMax, trip.currency)} · {formatDateRange(r.availableStart, r.availableEnd)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={r.flexibility === "High" ? "good" : r.flexibility === "Low" ? "warn" : "neutral"}>
                        {r.flexibility} flexibility
                      </Badge>
                      <span className="hidden text-xs text-subtle sm:inline">{timeAgo(r.updatedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {pendingCount > 0 && (
              <div className="mt-5 border-t border-line pt-5">
                <p className="mb-3 text-xs font-medium tracking-wide text-subtle uppercase">Still pending</p>
                <div className="flex flex-wrap gap-2">
                  {coordinatorPending && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-line-strong px-3 py-1.5 text-sm text-muted">
                      {trip.coordinatorName} <span className="text-xs text-subtle">(coordinator)</span>
                    </span>
                  )}
                  {Array.from({ length: pendingCount - (coordinatorPending ? 1 : 0) }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full border border-dashed border-line-strong px-3 py-1.5 text-sm text-subtle"
                    >
                      Traveller {count + (coordinatorPending ? 1 : 0) + i + 1}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Group summary */}
          {count > 0 && (
            <Card className="p-6">
              <SectionTitle hint={`Based on ${count} response${count === 1 ? "" : "s"}`}>Group preference summary</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-paper p-4">
                  <p className="text-xs font-medium tracking-wide text-subtle uppercase">Budget per person</p>
                  {summary.budget && (
                    <>
                      <p className="mt-2 text-lg font-semibold tabular-nums">
                        {formatMoney(summary.budget.min, trip.currency)} – {formatMoney(summary.budget.max, trip.currency)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Median {formatMoney(summary.budget.median, trip.currency)}. A trip everyone can afford stays under{" "}
                        {formatMoney(summary.budget.min, trip.currency)}.
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-xl bg-paper p-4">
                  <p className="text-xs font-medium tracking-wide text-subtle uppercase">Dates</p>
                  {summary.commonWindow ? (
                    <>
                      <p className="mt-2 text-lg font-semibold">
                        {formatDateRange(summary.commonWindow.start, summary.commonWindow.end)}
                      </p>
                      <p className="mt-1 text-sm text-good">
                        Everyone who responded is free · {summary.commonWindow.days} days
                      </p>
                    </>
                  ) : summary.bestWindow ? (
                    <>
                      <p className="mt-2 text-lg font-semibold">
                        {formatDateRange(summary.bestWindow.start, summary.bestWindow.end)}
                      </p>
                      <p className="mt-1 text-sm text-warn">
                        No shared window. Best overlap: {summary.bestWindow.names.length} of {count} (
                        {summary.bestWindow.names.join(", ")})
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-medium">Destination types</p>
                  <TallyBars items={summary.destinationTypes} total={count} />
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium">Trip styles</p>
                  <TallyBars items={summary.tripStyles} total={count} />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-6">
            <h2 className="font-semibold">Compare trip options</h2>
            <p className="mt-1 mb-5 text-sm text-muted">
              {count === 0
                ? "You'll be able to analyse as soon as the first person responds."
                : count < trip.expectedTravellers
                  ? `You don't need to wait for everyone. The analysis will use the ${count} response${count === 1 ? "" : "s"} available now, and you can re-run it later.`
                  : "Everyone's in. Get 2–3 balanced options with an honest fit score for each person."}
            </p>
            {analysis && !stale ? (
              <div className="space-y-3">
                <Link
                  href={`/t/${trip.code}/results`}
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-brand px-6 text-[15px] font-medium text-white hover:bg-brand-hover"
                >
                  View trip options
                </Link>
                <AnalyzeButton code={trip.code} label="Re-run analysis" variant="secondary" />
              </div>
            ) : (
              <AnalyzeButton code={trip.code} disabled={count === 0} />
            )}
            {analysis && (
              <p className="mt-3 text-xs text-subtle">
                Last analysed {timeAgo(analysis.createdAt)} with {analysis.responseCount} response
                {analysis.responseCount === 1 ? "" : "s"}.
                {stale && (
                  <>
                    {" "}
                    <span className="text-warn">Responses have changed since.</span>{" "}
                    <Link href={`/t/${trip.code}/results`} className="underline">
                      View previous
                    </Link>
                  </>
                )}
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold">Invite your group</h2>
            <p className="mt-1 mb-4 text-sm text-muted">Anyone with this link can add their preferences.</p>
            <ShareLink code={trip.code} tripName={trip.name} compact />
          </Card>
        </div>
      </div>
    </main>
  );
}
