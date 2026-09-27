// Deterministic group summary, computed without AI.
// Shown on the dashboard, and passed to Gemini as verified facts so it doesn't miscount.

import { DESTINATION_TYPES, TRIP_STYLES } from "./constants";
import type { ParticipantResponse } from "./types";
import { daysBetween } from "./format";

export type Tally = { label: string; count: number; names: string[] };

export type DateWindow = {
  start: string;
  end: string;
  days: number;
  names: string[]; // who is available for the whole window
};

export type GroupSummary = {
  responseCount: number;
  budget: { min: number; max: number; median: number } | null;
  // Dates when *everyone who responded* is free, or null if there's no such window.
  commonWindow: DateWindow | null;
  // The window where the most people overlap (equals commonWindow when everyone overlaps).
  bestWindow: DateWindow | null;
  destinationTypes: Tally[];
  tripStyles: Tally[];
  flexibility: Tally[];
};

function tally(responses: ParticipantResponse[], labels: readonly string[], pick: (r: ParticipantResponse) => string[]): Tally[] {
  return labels
    .map((label) => {
      const names = responses.filter((r) => pick(r).includes(label)).map((r) => r.name);
      return { label, count: names.length, names };
    })
    .sort((a, b) => b.count - a.count);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Sweep over start/end events to find the date range covered by the most participants.
function findBestWindow(responses: ParticipantResponse[]): DateWindow | null {
  if (responses.length === 0) return null;
  const events: { date: string; delta: number }[] = [];
  for (const r of responses) {
    events.push({ date: r.availableStart, delta: 1 });
    events.push({ date: nextDay(r.availableEnd), delta: -1 });
  }
  // Process ends before starts on the same date (an end event is already exclusive).
  events.sort((a, b) => (a.date === b.date ? a.delta - b.delta : a.date < b.date ? -1 : 1));

  let active = 0;
  let bestCount = 0;
  let best: { start: string; endExclusive: string } | null = null;
  let bestDays = 0;
  for (let i = 0; i < events.length; i++) {
    active += events[i].delta;
    const next = events[i + 1];
    if (!next || next.date === events[i].date) continue;
    const start = events[i].date;
    const days = daysBetween(start, next.date) - 1;
    if (active > bestCount || (active === bestCount && days > bestDays)) {
      bestCount = active;
      bestDays = days;
      best = { start, endExclusive: next.date };
    }
  }
  if (!best || bestCount === 0) return null;

  const endDate = new Date(`${best.endExclusive}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  const end = endDate.toISOString().slice(0, 10);
  const start = best.start;
  const names = responses.filter((r) => r.availableStart <= start && r.availableEnd >= end).map((r) => r.name);
  return { start, end, days: daysBetween(start, end), names };
}

export function summarise(responses: ParticipantResponse[]): GroupSummary {
  const budgets = responses.map((r) => r.budgetMax);
  const bestWindow = findBestWindow(responses);

  let commonWindow: DateWindow | null = null;
  if (responses.length > 0) {
    const start = responses.map((r) => r.availableStart).sort().at(-1)!;
    const end = responses.map((r) => r.availableEnd).sort()[0];
    if (start <= end) {
      commonWindow = { start, end, days: daysBetween(start, end), names: responses.map((r) => r.name) };
    }
  }

  return {
    responseCount: responses.length,
    budget: budgets.length
      ? { min: Math.min(...budgets), max: Math.max(...budgets), median: median(budgets) }
      : null,
    commonWindow,
    bestWindow,
    destinationTypes: tally(responses, DESTINATION_TYPES, (r) => r.destinationTypes),
    tripStyles: tally(responses, TRIP_STYLES, (r) => r.tripStyles),
    flexibility: tally(responses, ["Low", "Medium", "High"], (r) => [r.flexibility]),
  };
}
