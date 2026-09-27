import { NextResponse } from "next/server";
import { getResponseByName, getTripByCode, upsertResponse } from "@/lib/db";
import { normaliseCode, validatePreferences } from "@/lib/validation";
import { handleUnexpected, jsonError, readJson } from "@/lib/api";

type Ctx = { params: Promise<{ code: string }> };

// GET /api/trips/:code/responses?name=Priya — load someone's previous answers so they can edit them.
export async function GET(request: Request, { params }: Ctx) {
  const { code } = await params;
  const name = new URL(request.url).searchParams.get("name")?.trim();
  if (!name) return jsonError("Missing name.");

  try {
    const trip = await getTripByCode(normaliseCode(code));
    if (!trip) return jsonError("Trip not found.", 404);
    const response = await getResponseByName(trip.id, name);
    return NextResponse.json({ response });
  } catch (err) {
    return handleUnexpected(err, "Could not load your previous response.");
  }
}

// POST /api/trips/:code/responses — submit (or update, if the name already exists) preferences.
export async function POST(request: Request, { params }: Ctx) {
  const { code } = await params;
  const parsed = validatePreferences(await readJson(request));
  if (!parsed.ok) return jsonError(parsed.error);

  try {
    const trip = await getTripByCode(normaliseCode(code));
    if (!trip) return jsonError("Trip not found. Check the link or code.", 404);
    const { updated } = await upsertResponse(trip.id, parsed.data);
    return NextResponse.json({ updated }, { status: updated ? 200 : 201 });
  } catch (err) {
    return handleUnexpected(err, "Could not save your preferences. Please try again.");
  }
}
