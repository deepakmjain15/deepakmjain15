import { NextResponse } from "next/server";
import { createTrip } from "@/lib/db";
import { validateNewTrip } from "@/lib/validation";
import { handleUnexpected, jsonError, readJson } from "@/lib/api";

// POST /api/trips — create a new trip and return its share code.
export async function POST(request: Request) {
  const parsed = validateNewTrip(await readJson(request));
  if (!parsed.ok) return jsonError(parsed.error);

  try {
    const trip = await createTrip(parsed.data);
    return NextResponse.json({ code: trip.code, name: trip.name }, { status: 201 });
  } catch (err) {
    return handleUnexpected(err, "Could not create the trip. Please try again.");
  }
}
