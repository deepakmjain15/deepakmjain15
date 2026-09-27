"use client";

import { useState } from "react";
import Link from "next/link";
import { CURRENCIES, LIMITS } from "@/lib/constants";
import { ShareLink } from "./ShareLink";
import { Alert, buttonClass, Card, Field, inputClass, Spinner } from "./ui";

type Created = { code: string; name: string };

export function CreateTripForm() {
  const [name, setName] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [travellers, setTravellers] = useState("5");
  const [departingFrom, setDepartingFrom] = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          coordinatorName,
          expectedTravellers: Number(travellers),
          departingFrom,
          currency,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setCreated(data as Created);
      try {
        // Remember who the coordinator is on this device, so their name is prefilled on the form.
        localStorage.setItem(`tripmate:name:${data.code}`, coordinatorName.trim());
      } catch {
        /* storage unavailable */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <Card className="p-6 sm:p-8">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-good-soft text-good" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">{created.name} is ready</h2>
        <p className="mt-2 text-muted">
          Share this link in your group chat. Everyone adds their preferences, and you can analyse the options any time,
          even before everyone has replied.
        </p>
        <div className="mt-6">
          <ShareLink code={created.code} tripName={created.name} />
        </div>
        <div className="mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
          <Link href={`/t/${created.code}`} className={buttonClass("primary", "lg")}>
            Add my own preferences
          </Link>
          <Link href={`/t/${created.code}/dashboard`} className={buttonClass("secondary", "lg")}>
            Open group dashboard
          </Link>
        </div>
        <p className="mt-4 text-xs text-subtle">
          Tip: bookmark the dashboard. Anyone with the link or code can open it, and there are no accounts.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Trip name" htmlFor="name">
          <input
            id="name"
            className={inputClass}
            placeholder="e.g. Uni friends reunion trip"
            value={name}
            maxLength={LIMITS.tripNameMax}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="Your name" hint="You're the coordinator. This isn't an account, just a label." htmlFor="coordinator">
          <input
            id="coordinator"
            className={inputClass}
            placeholder="e.g. Priya"
            value={coordinatorName}
            maxLength={LIMITS.nameMax}
            onChange={(e) => setCoordinatorName(e.target.value)}
            required
            autoComplete="given-name"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Number of travellers" hint="Roughly, including you" htmlFor="travellers">
            <input
              id="travellers"
              type="number"
              inputMode="numeric"
              min={2}
              max={LIMITS.maxTravellers}
              className={inputClass}
              value={travellers}
              onChange={(e) => setTravellers(e.target.value)}
              required
            />
          </Field>
          <Field label="Budget currency" htmlFor="currency">
            <select id="currency" className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Travelling from (optional)" hint="Helps estimate realistic travel costs" htmlFor="from">
          <input
            id="from"
            className={inputClass}
            placeholder="e.g. London, or Mumbai & Pune"
            value={departingFrom}
            maxLength={80}
            onChange={(e) => setDepartingFrom(e.target.value)}
          />
        </Field>

        {error && <Alert>{error}</Alert>}

        <button type="submit" className={buttonClass("primary", "lg") + " w-full"} disabled={submitting}>
          {submitting ? (
            <>
              <Spinner /> Creating trip…
            </>
          ) : (
            "Create trip and get link"
          )}
        </button>
      </form>
    </Card>
  );
}
