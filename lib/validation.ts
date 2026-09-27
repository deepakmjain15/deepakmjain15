// Server-side validation for request bodies. Returns either clean data or an error message.

import {
  CURRENCIES,
  DESTINATION_TYPES,
  FLEXIBILITY_LEVELS,
  LIMITS,
  TRIP_STYLES,
  type Currency,
  type DestinationType,
  type Flexibility,
  type TripStyle,
} from "./constants";
import type { PreferenceInput } from "./types";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

function pickList<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return allowed.filter((option) => value.includes(option));
}

export type NewTripInput = {
  name: string;
  coordinatorName: string;
  expectedTravellers: number;
  departingFrom: string;
  currency: Currency;
};

export function validateNewTrip(body: unknown): Result<NewTripInput> {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = text(b.name, LIMITS.tripNameMax);
  const coordinatorName = text(b.coordinatorName, LIMITS.nameMax);
  const expectedTravellers = Number(b.expectedTravellers);
  const departingFrom = text(b.departingFrom, 80);
  const currency = (CURRENCIES as readonly string[]).includes(String(b.currency))
    ? (b.currency as Currency)
    : "USD";

  if (!name) return { ok: false, error: "Give your trip a name." };
  if (!coordinatorName) return { ok: false, error: "Enter your name." };
  if (!Number.isInteger(expectedTravellers) || expectedTravellers < 2 || expectedTravellers > LIMITS.maxTravellers) {
    return { ok: false, error: `Number of travellers must be between 2 and ${LIMITS.maxTravellers}.` };
  }
  return { ok: true, data: { name, coordinatorName, expectedTravellers, departingFrom, currency } };
}

export function validatePreferences(body: unknown): Result<PreferenceInput> {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = text(b.name, LIMITS.nameMax);
  const budgetMax = Math.round(Number(b.budgetMax));
  const availableStart = text(b.availableStart, 10);
  const availableEnd = text(b.availableEnd, 10);
  const flexibility = String(b.flexibility) as Flexibility;

  let destinationTypes: DestinationType[] = pickList(b.destinationTypes, DESTINATION_TYPES);
  let tripStyles: TripStyle[] = pickList(b.tripStyles, TRIP_STYLES);
  if (destinationTypes.length === 0) destinationTypes = ["Any"];
  if (tripStyles.length === 0) tripStyles = ["Mixed"];

  if (!name) return { ok: false, error: "Enter your name." };
  if (!Number.isFinite(budgetMax) || budgetMax <= 0 || budgetMax > LIMITS.maxBudget) {
    return { ok: false, error: "Enter a maximum budget greater than zero." };
  }
  if (!isIsoDate(availableStart) || !isIsoDate(availableEnd)) {
    return { ok: false, error: "Enter both your available start and end dates." };
  }
  if (availableEnd < availableStart) {
    return { ok: false, error: "Your end date must be on or after your start date." };
  }
  if (!(FLEXIBILITY_LEVELS as readonly string[]).includes(flexibility)) {
    return { ok: false, error: "Choose how flexible you are." };
  }

  return {
    ok: true,
    data: {
      name,
      budgetMax,
      availableStart,
      availableEnd,
      destinationTypes,
      tripStyles,
      mustHaves: text(b.mustHaves, LIMITS.textMax),
      avoid: text(b.avoid, LIMITS.textMax),
      flexibility,
    },
  };
}

export function normaliseCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
