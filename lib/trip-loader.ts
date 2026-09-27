import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getLatestAnalysis, getResponses, getTripByCode } from "./db";
import { normaliseCode } from "./validation";

// Cached per request, so the layout and page can both call these without extra queries.
export const loadTrip = cache(async (rawCode: string) => {
  const trip = await getTripByCode(normaliseCode(rawCode));
  if (!trip) notFound();
  return trip;
});

export const loadResponses = cache((tripId: string) => getResponses(tripId));
export const loadLatestAnalysis = cache((tripId: string) => getLatestAnalysis(tripId));
