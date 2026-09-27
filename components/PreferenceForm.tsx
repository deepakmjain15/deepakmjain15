"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DESTINATION_TYPES,
  FLEXIBILITY_HINTS,
  FLEXIBILITY_LEVELS,
  LIMITS,
  TRIP_STYLES,
  type DestinationType,
  type Flexibility,
  type TripStyle,
} from "@/lib/constants";
import type { ParticipantResponse } from "@/lib/types";
import { Alert, buttonClass, Card, cx, Field, inputClass, Spinner, textareaClass } from "./ui";

type Props = { code: string; tripName: string; currency: string; coordinatorName: string };

// "Any" / "Mixed" mean "no preference", so they are exclusive with the specific choices.
function toggle<T extends string>(list: T[], value: T, exclusive: T): T[] {
  if (value === exclusive) return list.includes(value) ? [] : [value];
  const without = list.filter((v) => v !== exclusive);
  return without.includes(value) ? without.filter((v) => v !== value) : [...without, value];
}

function Chips<T extends string>({
  options,
  selected,
  onToggle,
  label,
}: {
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => {
        const on = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(option)}
            className={cx(
              "h-9 rounded-full border px-4 text-sm transition-colors",
              on ? "border-brand bg-brand text-white" : "border-line-strong bg-surface text-ink hover:border-ink/40",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line pt-6 first:border-t-0 first:pt-0 sm:grid-cols-[180px_1fr] sm:gap-8">
      <div className="flex items-baseline gap-2 sm:block">
        <span className="text-xs font-semibold text-brand tabular-nums">0{step}</span>
        <h2 className="font-semibold sm:mt-1">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function PreferenceForm({ code, tripName, currency, coordinatorName }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [destinationTypes, setDestinationTypes] = useState<DestinationType[]>([]);
  const [tripStyles, setTripStyles] = useState<TripStyle[]>([]);
  const [mustHaves, setMustHaves] = useState("");
  const [avoid, setAvoid] = useState("");
  const [flexibility, setFlexibility] = useState<Flexibility>("Medium");

  const [returning, setReturning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ updated: boolean } | null>(null);
  const lastLookup = useRef("");
  const [today, setToday] = useState("");

  const storageKey = `tripmate:name:${code}`;

  function fill(r: ParticipantResponse) {
    setBudget(String(r.budgetMax));
    setStart(r.availableStart);
    setEnd(r.availableEnd);
    setDestinationTypes(r.destinationTypes);
    setTripStyles(r.tripStyles);
    setMustHaves(r.mustHaves);
    setAvoid(r.avoid);
    setFlexibility(r.flexibility);
  }

  // If someone has already answered with this name, load their answers so they can edit them.
  async function lookup(candidate: string) {
    const trimmed = candidate.trim();
    if (!trimmed || trimmed.toLowerCase() === lastLookup.current) return;
    lastLookup.current = trimmed.toLowerCase();
    try {
      const res = await fetch(`/api/trips/${code}/responses?name=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { response: ParticipantResponse | null };
      if (data.response) {
        fill(data.response);
        setReturning(true);
      } else {
        setReturning(false);
      }
    } catch {
      /* non-critical */
    }
  }

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setName(saved);
        void lookup(saved);
      }
    } catch {
      /* storage unavailable */
    }
    // Run once on mount.
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Enter your name.");
    if (!(Number(budget) > 0)) return setError("Enter your maximum budget per person.");
    if (!start || !end) return setError("Enter the dates you're available.");
    if (end < start) return setError("Your end date must be on or after your start date.");

    setSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${code}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          budgetMax: Number(budget),
          availableStart: start,
          availableEnd: end,
          destinationTypes,
          tripStyles,
          mustHaves,
          avoid,
          flexibility,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save your preferences. Please try again.");
      try {
        localStorage.setItem(storageKey, name.trim());
      } catch {
        /* storage unavailable */
      }
      setDone({ updated: Boolean(data.updated) });
      router.refresh(); // update response counts shown on the page
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-good-soft text-good" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">
          {done.updated ? "Your answers are updated" : "Thanks, you're in"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          {coordinatorName} can now include your preferences when comparing trip options for {tripName}.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/t/${code}/dashboard`} className={buttonClass("primary", "lg")}>
            See the group dashboard
          </Link>
          <button
            type="button"
            className={buttonClass("secondary", "lg")}
            onClick={() => {
              setDone(null);
              setReturning(true);
            }}
          >
            Edit my answers
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <Section step={1} title="About you">
          <Field
            label="Your name"
            htmlFor="name"
            hint="Already answered? Use the same name and you'll update your previous response."
          >
            <input
              id="name"
              className={inputClass}
              value={name}
              maxLength={LIMITS.nameMax}
              placeholder="e.g. Rohan"
              autoComplete="given-name"
              onChange={(e) => {
                setName(e.target.value);
                setReturning(false);
              }}
              onBlur={(e) => lookup(e.target.value)}
            />
          </Field>
          {returning && (
            <Alert tone="brand">Welcome back. We&apos;ve loaded your previous answers, so change anything and save.</Alert>
          )}
        </Section>

        <Section step={2} title="Budget & dates">
          <Field label="Maximum budget per person" hint="Everything included: travel, stay, food, activities" htmlFor="budget">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-medium text-subtle">
                {currency}
              </span>
              <input
                id="budget"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                className={inputClass + " pl-14 tabular-nums"}
                placeholder="1000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Available from" htmlFor="start">
              <input
                id="start"
                type="date"
                className={inputClass}
                value={start}
                min={today || undefined}
                onChange={(e) => {
                  setStart(e.target.value);
                  if (end && e.target.value > end) setEnd(e.target.value);
                }}
              />
            </Field>
            <Field label="Available until" htmlFor="end">
              <input
                id="end"
                type="date"
                className={inputClass}
                value={end}
                min={start || today || undefined}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section step={3} title="Your kind of trip">
          <Field label="Destination types" hint="Pick any that appeal">
            <Chips
              label="Destination types"
              options={DESTINATION_TYPES}
              selected={destinationTypes}
              onToggle={(v) => setDestinationTypes((list) => toggle(list, v, "Any"))}
            />
          </Field>
          <Field label="Trip styles" hint="Pick any that appeal">
            <Chips
              label="Trip styles"
              options={TRIP_STYLES}
              selected={tripStyles}
              onToggle={(v) => setTripStyles((list) => toggle(list, v, "Mixed"))}
            />
          </Field>
        </Section>

        <Section step={4} title="Must-haves & deal-breakers">
          <Field label="Must-haves" htmlFor="must" hint="Optional">
            <textarea
              id="must"
              className={textareaClass}
              maxLength={LIMITS.textMax}
              placeholder="e.g. A pool, good vegetarian food, at least one hike"
              value={mustHaves}
              onChange={(e) => setMustHaves(e.target.value)}
            />
          </Field>
          <Field label="Things to avoid" htmlFor="avoid" hint="Optional">
            <textarea
              id="avoid"
              className={textareaClass}
              maxLength={LIMITS.textMax}
              placeholder="e.g. Long flights, very cold weather, party hostels"
              value={avoid}
              onChange={(e) => setAvoid(e.target.value)}
            />
          </Field>
        </Section>

        <Section step={5} title="Flexibility">
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Flexibility">
            {FLEXIBILITY_LEVELS.map((level) => {
              const on = flexibility === level;
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setFlexibility(level)}
                  className={cx(
                    "rounded-xl border p-3.5 text-left transition-colors",
                    on ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-line-strong bg-surface hover:border-ink/40",
                  )}
                >
                  <span className="block text-sm font-semibold">{level}</span>
                  <span className="mt-0.5 block text-xs text-muted">{FLEXIBILITY_HINTS[level]}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {error && <Alert>{error}</Alert>}

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-subtle">Your answers are visible to everyone with the trip link.</p>
          <button type="submit" className={buttonClass("primary", "lg")} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner /> Saving…
              </>
            ) : returning ? (
              "Update my preferences"
            ) : (
              "Submit my preferences"
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}
