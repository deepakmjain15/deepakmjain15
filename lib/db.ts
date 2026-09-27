import "server-only";
import { randomInt } from "node:crypto";
import { getSupabase } from "./supabase";
import type { Currency, DestinationType, Flexibility, TripStyle } from "./constants";
import type { AnalysisResult, ParticipantResponse, PreferenceInput, StoredAnalysis, Trip } from "./types";
import type { NewTripInput } from "./validation";

// All database access lives here. Only ever called from server components and route handlers.

// No 0/O, 1/I/L, so codes are easy to read aloud or type from a screenshot.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

export function nameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

type TripRow = {
  id: string;
  code: string;
  name: string;
  coordinator_name: string;
  expected_travellers: number;
  departing_from: string | null;
  currency: string;
  created_at: string;
};

function toTrip(row: TripRow): Trip {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    coordinatorName: row.coordinator_name,
    expectedTravellers: row.expected_travellers,
    departingFrom: row.departing_from,
    currency: row.currency as Currency,
    createdAt: row.created_at,
  };
}

export async function createTrip(input: NewTripInput): Promise<Trip> {
  const db = getSupabase();
  // Retry a few times in the unlikely event of a code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db
      .from("trips")
      .insert({
        code: generateCode(),
        name: input.name,
        coordinator_name: input.coordinatorName,
        expected_travellers: input.expectedTravellers,
        departing_from: input.departingFrom || null,
        currency: input.currency,
      })
      .select()
      .single();
    if (!error) return toTrip(data as TripRow);
    if (error.code !== "23505") throw new Error(`Could not create trip: ${error.message}`);
  }
  throw new Error("Could not generate a unique trip code. Please try again.");
}

export async function getTripByCode(code: string): Promise<Trip | null> {
  const { data, error } = await getSupabase().from("trips").select().eq("code", code).maybeSingle();
  if (error) throw new Error(`Could not load trip: ${error.message}`);
  return data ? toTrip(data as TripRow) : null;
}

type ResponseRow = {
  id: string;
  name: string;
  preferences: {
    budget_max: number;
    available_start: string;
    available_end: string;
    destination_types: string[];
    trip_styles: string[];
    must_haves: string;
    avoid: string;
    flexibility: string;
    updated_at: string;
  } | null;
};

export async function getResponses(tripId: string): Promise<ParticipantResponse[]> {
  const { data, error } = await getSupabase()
    .from("participants")
    .select(
      "id, name, preferences (budget_max, available_start, available_end, destination_types, trip_styles, must_haves, avoid, flexibility, updated_at)",
    )
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load responses: ${error.message}`);

  return ((data ?? []) as unknown as ResponseRow[])
    .filter((row) => row.preferences)
    .map((row) => {
      const p = row.preferences!;
      return {
        participantId: row.id,
        name: row.name,
        budgetMax: p.budget_max,
        availableStart: p.available_start,
        availableEnd: p.available_end,
        destinationTypes: p.destination_types as DestinationType[],
        tripStyles: p.trip_styles as TripStyle[],
        mustHaves: p.must_haves,
        avoid: p.avoid,
        flexibility: p.flexibility as Flexibility,
        updatedAt: p.updated_at,
      };
    });
}

export async function getResponseByName(tripId: string, name: string): Promise<ParticipantResponse | null> {
  const key = nameKey(name);
  const all = await getResponses(tripId);
  return all.find((r) => nameKey(r.name) === key) ?? null;
}

// Creates the participant if new, otherwise updates their existing preferences.
export async function upsertResponse(tripId: string, input: PreferenceInput): Promise<{ updated: boolean }> {
  const db = getSupabase();
  const key = nameKey(input.name);

  const { data: existing, error: findError } = await db
    .from("participants")
    .select("id")
    .eq("trip_id", tripId)
    .eq("name_key", key)
    .maybeSingle();
  if (findError) throw new Error(`Could not save response: ${findError.message}`);

  // Existing participants keep the name spelling they first used.
  let participantId = existing?.id as string | undefined;
  if (!participantId) {
    const { data, error } = await db
      .from("participants")
      .upsert({ trip_id: tripId, name: input.name, name_key: key }, { onConflict: "trip_id,name_key" })
      .select("id")
      .single();
    if (error) throw new Error(`Could not save response: ${error.message}`);
    participantId = data.id as string;
  }

  const { error } = await db.from("preferences").upsert(
    {
      participant_id: participantId,
      budget_max: input.budgetMax,
      available_start: input.availableStart,
      available_end: input.availableEnd,
      destination_types: input.destinationTypes,
      trip_styles: input.tripStyles,
      must_haves: input.mustHaves,
      avoid: input.avoid,
      flexibility: input.flexibility,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" },
  );
  if (error) throw new Error(`Could not save preferences: ${error.message}`);

  return { updated: Boolean(existing) };
}

type AnalysisRow = {
  id: string;
  response_count: number;
  responses_updated_at: string | null;
  model: string;
  result: AnalysisResult;
  created_at: string;
};

export async function saveAnalysis(
  tripId: string,
  args: { responseCount: number; responsesUpdatedAt: string | null; model: string; result: AnalysisResult },
): Promise<void> {
  const { error } = await getSupabase().from("analyses").insert({
    trip_id: tripId,
    response_count: args.responseCount,
    responses_updated_at: args.responsesUpdatedAt,
    model: args.model,
    result: args.result,
  });
  if (error) throw new Error(`Could not save analysis: ${error.message}`);
}

export async function getLatestAnalysis(tripId: string): Promise<StoredAnalysis | null> {
  const { data, error } = await getSupabase()
    .from("analyses")
    .select()
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not load analysis: ${error.message}`);
  if (!data) return null;
  const row = data as AnalysisRow;
  return {
    id: row.id,
    responseCount: row.response_count,
    responsesUpdatedAt: row.responses_updated_at,
    model: row.model,
    result: row.result,
    createdAt: row.created_at,
  };
}

// The most recent time any response was created or edited; used to spot stale analyses.
export function latestUpdate(responses: ParticipantResponse[]): string | null {
  let latest: string | null = null;
  for (const r of responses) {
    if (!latest || new Date(r.updatedAt).getTime() > new Date(latest).getTime()) latest = r.updatedAt;
  }
  return latest;
}

// True if anyone has responded or edited their answers since the analysis was generated.
export function isAnalysisStale(analysis: StoredAnalysis, responses: ParticipantResponse[]): boolean {
  if (analysis.responseCount !== responses.length) return true;
  if (!analysis.responsesUpdatedAt) return false;
  const analysedAt = new Date(analysis.responsesUpdatedAt).getTime();
  return responses.some((r) => new Date(r.updatedAt).getTime() > analysedAt);
}
