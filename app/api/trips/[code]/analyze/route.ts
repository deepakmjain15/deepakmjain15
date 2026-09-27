import { NextResponse } from "next/server";
import { getResponses, getTripByCode, latestUpdate, saveAnalysis } from "@/lib/db";
import { analyseGroup, GeminiError } from "@/lib/gemini";
import { summarise } from "@/lib/summary";
import { normaliseCode } from "@/lib/validation";
import { handleUnexpected, jsonError } from "@/lib/api";

// Gemini can take a while; allow up to 60s on Vercel.
export const maxDuration = 60;

type Ctx = { params: Promise<{ code: string }> };

// POST /api/trips/:code/analyze — analyse whatever responses exist right now and store the result.
export async function POST(_request: Request, { params }: Ctx) {
  const { code } = await params;

  try {
    const trip = await getTripByCode(normaliseCode(code));
    if (!trip) return jsonError("Trip not found.", 404);

    const responses = await getResponses(trip.id);
    if (responses.length === 0) {
      return jsonError("No one has submitted preferences yet. Share the link and try again once someone responds.");
    }

    const { result, model } = await analyseGroup(trip, responses, summarise(responses));
    await saveAnalysis(trip.id, {
      responseCount: responses.length,
      responsesUpdatedAt: latestUpdate(responses),
      model,
      result,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error("Gemini:", err.message);
      return jsonError(err.message, err.status);
    }
    return handleUnexpected(err, "Could not analyse the trip. Please try again.");
  }
}
